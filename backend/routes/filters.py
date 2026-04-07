from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import List, Optional
from database import get_db
from models import models
from routes.auth import get_current_user

router = APIRouter(prefix="/filters", tags=["Filters"])


@router.get("/product-codes", response_model=List[str])
def get_product_codes(
    search: Optional[str] = Query(None, description="Partial product code to search"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return distinct product codes matching the search string."""
    q = db.query(distinct(models.TradeHistory.product_code)).filter(
        models.TradeHistory.product_code.isnot(None),
        models.TradeHistory.product_code != "",
    )
    if search:
        q = q.filter(models.TradeHistory.product_code.ilike(f"%{search}%"))
    results = q.order_by(models.TradeHistory.product_code).limit(limit).all()
    return [r[0] for r in results if r[0]]


@router.get("/countries", response_model=List[str])
def get_countries(
    search: Optional[str] = Query(None, description="Partial country name to search"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return distinct ship-to countries matching the search string."""
    q = db.query(distinct(models.TradeHistory.ship_to_country)).filter(
        models.TradeHistory.ship_to_country.isnot(None),
        models.TradeHistory.ship_to_country != "",
    )
    if search:
        q = q.filter(models.TradeHistory.ship_to_country.ilike(f"%{search}%"))
    results = q.order_by(models.TradeHistory.ship_to_country).limit(limit).all()
    return [r[0] for r in results if r[0]]


@router.get("/sizes", response_model=List[str])
def get_sizes(
    country: Optional[str] = Query(None, description="Filter sizes by destination country"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return distinct normalised sizes, optionally filtered by country, in logical order."""
    SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL"]

    q = db.query(models.TradeHistory.size).filter(
        models.TradeHistory.size.isnot(None),
        models.TradeHistory.size != "",
    )
    if country:
        q = q.filter(models.TradeHistory.ship_to_country.ilike(country))

    raw = q.all()

    seen: set[str] = set()
    for (val,) in raw:
        normalised = str(val).strip().upper()
        if normalised in SIZE_ORDER:
            seen.add(normalised)

    return [s for s in SIZE_ORDER if s in seen]
