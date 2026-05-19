from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from database import engine, get_db, Base
from models import models
from schemas import schemas
from services import ai_service
from routes.auth import router as auth_router, get_current_user
from routes.history import router as history_router
from routes.analytics import router as analytics_router
from routes.filters import router as filters_router
from routes.ai import router as ai_router

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Trade Intelligence Platform API")

import logging
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Error: {str(exc)}")
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

app.include_router(auth_router)
app.include_router(history_router)
app.include_router(analytics_router)
app.include_router(filters_router)
app.include_router(ai_router)

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Perform a lightweight database verification to keep Supabase active
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected"}
        )

# --- LEADS ENDPOINTS ---

@app.get("/leads", response_model=List[schemas.BuyerLead])
def get_leads(
    hs_code: Optional[str] = None, 
    country: Optional[str] = None, 
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(models.BuyerLead)
    if hs_code:
        query = query.filter(models.BuyerLead.hs_code == hs_code)
    if country:
        query = query.filter(models.BuyerLead.country == country)
    if keyword:
        query = query.filter(models.BuyerLead.keyword.contains(keyword))
    return query.order_by(models.BuyerLead.created_at.desc()).all()


@app.post("/leads/manual", response_model=schemas.BuyerLead)
def add_lead_manual(lead_data: schemas.BuyerLeadBase, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check for existing
    existing = db.query(models.BuyerLead).filter(
        models.BuyerLead.company_name == lead_data.company_name,
        models.BuyerLead.country == lead_data.country
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Lead already exists for this company in this region.")

    new_lead = models.BuyerLead(
        **lead_data.model_dump(exclude={"source"}),
        source="Manual"
    )
    db.add(new_lead)
    try:
        db.commit()
        db.refresh(new_lead)
        return new_lead
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save manual entry")

@app.put("/leads/{lead_id}", response_model=schemas.BuyerLead)
def update_lead(lead_id: int, lead_data: schemas.BuyerLeadBase, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_lead = db.query(models.BuyerLead).filter(models.BuyerLead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    for key, value in lead_data.model_dump().items():
        setattr(db_lead, key, value)
    
    try:
        db.commit()
        db.refresh(db_lead)
        return db_lead
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not update record")

@app.delete("/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_lead = db.query(models.BuyerLead).filter(models.BuyerLead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    db.delete(db_lead)
    try:
        db.commit()
        return {"status": "success", "message": "Lead removed from vault"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not delete record")


@app.post("/hscodes", response_model=List[schemas.HSCode])
def save_hscodes(codes: List[schemas.HSCodeBase], country: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_codes = []
    for code_data in codes:
        # Check if code already exists for this country
        existing = db.query(models.HSCode).filter(
            models.HSCode.hs_code == code_data.hs_code,
            models.HSCode.country == country
        ).first()
        
        if existing:
            db_codes.append(existing)
            continue

        db_code = models.HSCode(
            **code_data.model_dump(exclude={"country", "source"}),
            country=country,
            source="DeepSeek"
        )
        db.add(db_code)
        db_codes.append(db_code)
    
    try:
        db.commit()
    except Exception:
        db.rollback()
        # Fallback query in case of race conditions
        return db.query(models.HSCode).filter(models.HSCode.country == country).all()

    for c in db_codes:
        db.refresh(c)
    return db_codes

@app.get("/hscodes", response_model=List[schemas.HSCode])
def get_hscodes(country: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    query = db.query(models.HSCode)
    if country:
        query = query.filter(models.HSCode.country == country)
    return query.order_by(models.HSCode.created_at.desc()).all()

@app.post("/hscodes/manual", response_model=schemas.HSCode)
def add_hscode_manual(code_data: schemas.HSCodeBase, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check for existing
    existing = db.query(models.HSCode).filter(
        models.HSCode.hs_code == code_data.hs_code,
        models.HSCode.country == code_data.country
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="HS Code already exists for this country in the vault.")

    new_hscode = models.HSCode(
        hs_code=code_data.hs_code,
        description=code_data.description,
        country=code_data.country,
        source="Manual"
    )
    db.add(new_hscode)
    try:
        db.commit()
        db.refresh(new_hscode)
        return new_hscode
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save manual entry")

@app.put("/hscodes/{hscode_id}", response_model=schemas.HSCode)
def update_hscode(hscode_id: int, code_data: schemas.HSCodeBase, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_code = db.query(models.HSCode).filter(models.HSCode.id == hscode_id).first()
    if not db_code:
        raise HTTPException(status_code=404, detail="HS Code not found")
    
    for key, value in code_data.model_dump().items():
        setattr(db_code, key, value)
    
    try:
        db.commit()
        db.refresh(db_code)
        return db_code
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not update record")

@app.delete("/hscodes/{hscode_id}")
def delete_hscode(hscode_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_code = db.query(models.HSCode).filter(models.HSCode.id == hscode_id).first()
    if not db_code:
        raise HTTPException(status_code=404, detail="HS Code not found")
    
    db.delete(db_code)
    try:
        db.commit()
        return {"status": "success", "message": "HS Code removed from vault"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not delete record")


