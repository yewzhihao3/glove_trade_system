from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas import schemas
from services import analytics_service
from routes.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/top-buyers", response_model=List[schemas.TopBuyerResponse])
def get_top_buyers(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_top_buyers(db, limit)


@router.get("/top-countries", response_model=List[schemas.TopCountryResponse])
def get_top_countries(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_top_countries(db, limit)


@router.get("/top-products", response_model=List[schemas.TopProductResponse])
def get_top_products(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_top_products(db, limit)


@router.get("/monthly-trend", response_model=List[schemas.MonthlyTrendResponse])
def get_monthly_trend(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_monthly_trend(db)


@router.get("/company-trend", response_model=List[schemas.MonthlyTrendResponse])
def get_company_trend(
    company_name: str = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_company_trend(db, company_name)
