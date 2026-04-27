from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import List, Optional
from database import get_db
from models import models
from schemas import schemas
from routes.auth import get_current_user

router = APIRouter(prefix="/filters", tags=["Filters"])

@router.get("/product-codes", response_model=schemas.FilterFallbackResponse)
def get_product_codes(
    search: Optional[str] = Query(None, description="Partial product code to search"),
    size: Optional[str] = Query(None, description="Filter by size"),
    country: Optional[str] = Query(None, description="Filter by country"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return distinct product codes matching the search string, with fallback relaxation."""
    def run_query(use_size: bool, use_country: bool):
        q = db.query(distinct(models.TradeHistory.product_code)).filter(
            models.TradeHistory.product_code.isnot(None),
            models.TradeHistory.product_code != "",
        )
        if search:
            q = q.filter(models.TradeHistory.product_code.ilike(f"%{search}%"))
        if use_size and size:
            q = q.filter(models.TradeHistory.size.ilike(size))
        if use_country and country:
            q = q.filter(models.TradeHistory.ship_to_country.ilike(country))
        results = q.order_by(models.TradeHistory.product_code).limit(limit).all()
        return [r[0] for r in results if r[0]]

    results = run_query(use_size=True, use_country=True)
    if results:
        return {"data": results, "fallback": False}

    if country:
        results = run_query(use_size=True, use_country=False)
        if results:
            return {"data": results, "fallback": True}

    if size:
        results = run_query(use_size=False, use_country=False)
        if results:
            return {"data": results, "fallback": True}

    return {"data": [], "fallback": False}

@router.get("/countries", response_model=schemas.FilterFallbackResponse)
def get_countries(
    search: Optional[str] = Query(None, description="Partial country name to search"),
    product_code: Optional[str] = Query(None, description="Filter by product code"),
    size: Optional[str] = Query(None, description="Filter by size"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return distinct ship-to countries matching the search string, with fallback relaxation."""
    def run_query(use_product: bool, use_size: bool):
        q = db.query(distinct(models.TradeHistory.ship_to_country)).filter(
            models.TradeHistory.ship_to_country.isnot(None),
            models.TradeHistory.ship_to_country != "",
        )
        if search:
            q = q.filter(models.TradeHistory.ship_to_country.ilike(f"%{search}%"))
        if use_product and product_code:
            q = q.filter(models.TradeHistory.product_code.ilike(product_code))
        if use_size and size:
            q = q.filter(models.TradeHistory.size.ilike(size))
        results = q.order_by(models.TradeHistory.ship_to_country).limit(limit).all()
        return [r[0] for r in results if r[0]]

    results = run_query(use_product=True, use_size=True)
    if results:
        return {"data": results, "fallback": False}

    if size:
        results = run_query(use_product=True, use_size=False)
        if results:
            return {"data": results, "fallback": True}

    if product_code:
        results = run_query(use_product=False, use_size=False)
        if results:
            return {"data": results, "fallback": True}

    return {"data": [], "fallback": False}

@router.get("/sizes", response_model=schemas.FilterFallbackResponse)
def get_sizes(
    product_code: Optional[str] = Query(None, description="Filter by product code"),
    country: Optional[str] = Query(None, description="Filter sizes by destination country"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return distinct normalised sizes, optionally filtered by product_code and country, with fallback relaxation."""
    SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL"]

    def run_query(use_product: bool, use_country: bool):
        q = db.query(models.TradeHistory.size).filter(
            models.TradeHistory.size.isnot(None),
            models.TradeHistory.size != "",
        )
        if use_product and product_code:
            q = q.filter(models.TradeHistory.product_code.ilike(product_code))
        if use_country and country:
            q = q.filter(models.TradeHistory.ship_to_country.ilike(country))

        raw = q.all()
        seen = set()
        for (val,) in raw:
            normalised = str(val).strip().upper()
            if normalised in SIZE_ORDER:
                seen.add(normalised)
        return [s for s in SIZE_ORDER if s in seen]

    results = run_query(use_product=True, use_country=True)
    if results:
        return {"data": results, "fallback": False}

    if country:
        results = run_query(use_product=True, use_country=False)
        if results:
            return {"data": results, "fallback": True}

    if product_code:
        results = run_query(use_product=False, use_country=False)
        if results:
            return {"data": results, "fallback": True}

    return {"data": [], "fallback": False}
