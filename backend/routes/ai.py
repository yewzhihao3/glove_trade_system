from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from database import get_db
from models import models
from schemas import schemas
from services import ai_service
from routes.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI"])

class GenerateHSCodeRequest(BaseModel):
    product_type: str
    country: str

@router.post("/generate-buyers", response_model=List[schemas.BuyerLead])
def generate_buyers(request: schemas.GenerateLeadsRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if we already have results to avoid API costs
    existing = db.query(models.BuyerLead).filter(
        models.BuyerLead.hs_code == request.hs_code,
        models.BuyerLead.keyword == request.keyword,
        models.BuyerLead.country == request.country
    ).all()
    
    if existing:
        return existing

    ai_leads = ai_service.get_ai_buyer_leads(request.hs_code, request.keyword, request.country)
    
    db_leads = []
    for lead in ai_leads:
        db_lead = models.BuyerLead(
            **lead,
            hs_code=request.hs_code,
            keyword=request.keyword,
            country=request.country
        )
        db.add(db_lead)
        db_leads.append(db_lead)
    
    try:
        db.commit()
    except Exception:
        db.rollback()
        # Fallback if duplicates exist (IntegrityError)
        return db.query(models.BuyerLead).filter(
            models.BuyerLead.hs_code == request.hs_code,
            models.BuyerLead.keyword == request.keyword,
            models.BuyerLead.country == request.country
        ).all()

    for db_lead in db_leads:
        db.refresh(db_lead)
        
    return db_leads

@router.post("/generate-hscode", response_model=List[schemas.HSCodeBase])
def generate_hscode(request: GenerateHSCodeRequest, current_user = Depends(get_current_user)):
    results = ai_service.get_ai_hscodes(request.product_type, request.country)
    for res in results:
        res['country'] = request.country
    return results
