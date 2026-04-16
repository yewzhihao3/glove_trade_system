from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

import logging
from database import get_db
from models.user import User
from schemas import auth as auth_schemas
from services import auth_service

logger = logging.getLogger("app")

router = APIRouter(tags=["Authentication"])

security = HTTPBearer()

def require_role(required_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return current_user
    return role_checker

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth_service.SECRET_KEY, algorithms=[auth_service.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token formatting")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return user

@router.post("/create-user", response_model=auth_schemas.UserResponse)
def create_user(user: auth_schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_username = db.query(User).filter(User.username == user.username).first()
    if db_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_password = auth_service.hash_password(user.password)
    new_user = User(email=user.email, username=user.username, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=auth_schemas.Token)
def login(user_credentials: auth_schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user:
        logger.warning(f"Login failed: {user_credentials.email}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if not auth_service.verify_password(user_credentials.password, user.password_hash):
        logger.warning(f"Login failed: {user_credentials.email}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = auth_service.create_access_token(data={"sub": user.email, "role": user.role})
    logger.info(f"Login success: {user.email}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=auth_schemas.UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=List[auth_schemas.UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.put("/users/{user_id}", response_model=auth_schemas.UserResponse)
def update_user(user_id: int, user_update: auth_schemas.UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.email and user_update.email != db_user.email:
        if db.query(User).filter(User.email == user_update.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        db_user.email = user_update.email
        
    if user_update.username and user_update.username != db_user.username:
        if db.query(User).filter(User.username == user_update.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")
        db_user.username = user_update.username
        
    if user_update.password:
        db_user.password_hash = auth_service.hash_password(user_update.password)
        
    if user_update.role:
        db_user.role = user_update.role
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your current session operator account")
        
    db.delete(db_user)
    db.commit()
    return {"status": "success", "message": "User removed from system"}
