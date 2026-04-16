from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from schemas import schemas
from services import analytics_service
from routes.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/top-buyers", response_model=List[schemas.TopBuyerResponse])
def get_top_buyers(
    limit: int = Query(10, ge=1, le=100),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_top_buyers(db, limit, date_from, date_to)


@router.get("/top-countries", response_model=List[schemas.TopCountryResponse])
def get_top_countries(
    limit: int = Query(10, ge=1, le=100),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_top_countries(db, limit, date_from, date_to)


@router.get("/top-products", response_model=List[schemas.TopProductResponse])
def get_top_products(
    limit: int = Query(10, ge=1, le=100),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_top_products(db, limit, date_from, date_to)


@router.get("/monthly-trend", response_model=List[schemas.MonthlyTrendResponse])
def get_monthly_trend(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_monthly_trend(db, date_from, date_to)


@router.get("/company-trend", response_model=List[schemas.MonthlyTrendResponse])
def get_company_trend(
    company_name: str = Query(...),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_company_trend(db, company_name, date_from, date_to)


@router.get("/top-sizes", response_model=List[schemas.TopSizeResponse])
def get_top_sizes(
    limit: int = Query(10, ge=1, le=100),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_top_sizes(db, limit, date_from, date_to)


@router.get("/top-items", response_model=List[schemas.TopItemResponse])
def get_top_items(
    limit: int = Query(20, ge=1, le=100),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_top_items(db, limit, date_from, date_to)


@router.get("/top-groups", response_model=List[schemas.TopGroupResponse])
def get_top_groups(
    limit: int = Query(10, ge=1, le=100),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_top_groups(db, limit, date_from, date_to)


@router.get("/top-salespeople", response_model=List[schemas.TopSalespersonResponse])
def get_top_salespeople(
    limit: int = Query(10, ge=1, le=100),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        return []
    return analytics_service.get_top_salespeople(db, limit, date_from, date_to)


@router.get("/yearly-trend", response_model=List[schemas.YearlyTrendResponse])
def get_yearly_trend(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_yearly_trend(db, date_from, date_to)


@router.get("/potential-buyers", response_model=List[schemas.PotentialBuyerResponse])
def get_potential_buyers(
    min_transactions: int = Query(1, ge=1),
    min_value: int = Query(0, ge=0),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_potential_buyers(db, min_transactions, min_value, date_from, date_to)


@router.get("/buyers-by-product", response_model=List[schemas.BuyerByProductResponse])
def get_buyers_by_product(
    product_code: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_buyers_by_product(
        db, product_code=product_code, size=size, country=country,
        date_from=date_from, date_to=date_to, limit=limit
    )


@router.get("/recommended-buyers", response_model=List[schemas.RecommendedBuyerResponse])
def get_recommended_buyers(
    product_code: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return analytics_service.get_recommended_buyers(
        db, product_code=product_code, size=size, country=country,
        date_from=date_from, date_to=date_to, limit=limit
    )
