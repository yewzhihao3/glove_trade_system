from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from schemas import schemas
from services import analytics_service, recommendation_engine
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


@router.get("/buyers-by-product", response_model=schemas.BuyerByProductFallbackResponse)
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
    def run_query(use_product: bool, use_size: bool, use_country: bool):
        return analytics_service.get_buyers_by_product(
            db,
            product_code=product_code if use_product else None,
            size=size if use_size else None,
            country=country if use_country else None,
            date_from=date_from,
            date_to=date_to,
            limit=limit
        )

    results = run_query(True, True, True)
    if results or (not product_code and not size and not country):
        return {"data": results, "fallback": False}

    if country:
        results = run_query(True, True, False)
        if results:
            return {"data": results, "fallback": True}

    if size:
        results = run_query(True, False, False)
        if results:
            return {"data": results, "fallback": True}

    if product_code:
        results = run_query(False, False, False)
        if results:
            return {"data": results, "fallback": True}

    return {"data": [], "fallback": False}


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

@router.get("/yoy-comparison")
def get_yoy_comparison(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    product_code: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Returns an array of wide-format YOY data covering months 1-12.
    It guarantees all months are returned, with dynamics year keys (e.g. 2022_qty).
    """
    return analytics_service.get_yoy_comparison(
        db, 
        date_from=date_from, 
        date_to=date_to, 
        product_code=product_code, 
        country=country
    )

@router.get("/recommended-buyers-ai", response_model=schemas.AIRecommendationEnvelope)
def get_recommended_buyers_ai(
    product_code: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    include_existing: bool = Query(False),
    diversity_mode: bool = Query(False),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return recommendation_engine.get_ai_recommended_buyers(
        db,
        product_code=product_code,
        size=size,
        country=country,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        include_existing=include_existing,
        diversity_mode=diversity_mode
    )
