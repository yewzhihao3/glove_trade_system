import sys
from database import SessionLocal
from models.user import User
from services import auth_service

def create_admin(email, username, password):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            existing.role = "admin"
            existing.password_hash = auth_service.hash_password(password)
            print(f"✅ Updated existing user '{email}' to admin!")
        else:
            new_user = User(
                email=email, 
                username=username, 
                password_hash=auth_service.hash_password(password),
                role="admin"
            )
            db.add(new_user)
            print(f"✅ Created new admin user: '{email}'")
        db.commit()
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python create_admin.py <email> <username> <password>")
    else:
        create_admin(sys.argv[1], sys.argv[2], sys.argv[3])
