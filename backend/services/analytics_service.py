from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
from models import models

def get_top_buyers(db: Session, limit: int = 10) -> List[Dict]:
    results = db.query(
        models.TradeHistory.company_name,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    ).group_by(
        models.TradeHistory.company_name
    ).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    
    return [{"company_name": r.company_name, "total_quantity_pcs": r.total_quantity_pcs} for r in results if r.company_name]


def get_top_countries(db: Session, limit: int = 10) -> List[Dict]:
    results = db.query(
        models.TradeHistory.ship_to_country,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    ).group_by(
        models.TradeHistory.ship_to_country
    ).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    
    return [{"ship_to_country": r.ship_to_country, "total_quantity_pcs": r.total_quantity_pcs} for r in results if r.ship_to_country]


def get_top_products(db: Session, limit: int = 10) -> List[Dict]:
    results = db.query(
        models.TradeHistory.product_code,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    ).group_by(
        models.TradeHistory.product_code
    ).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    
    return [{"product_code": r.product_code, "total_quantity_pcs": r.total_quantity_pcs} for r in results if r.product_code]


def get_monthly_trend(db: Session) -> List[Dict]:
    # Assuming posting_date format is YYYY-MM-DD
    # Substring to get YYYY-MM string natively in SQLite
    results = db.query(
        func.substr(models.TradeHistory.posting_date, 1, 7).label('month'),
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    ).filter(
        models.TradeHistory.posting_date != None,
        models.TradeHistory.posting_date != ""
    ).group_by(
        func.substr(models.TradeHistory.posting_date, 1, 7)
    ).order_by(
        func.substr(models.TradeHistory.posting_date, 1, 7).asc()
    ).all()
    
    return [{"month": r.month, "total_quantity_pcs": r.total_quantity_pcs} for r in results]


def get_company_trend(db: Session, company_name: str) -> List[Dict]:
    results = db.query(
        func.substr(models.TradeHistory.posting_date, 1, 7).label('month'),
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    ).filter(
        models.TradeHistory.company_name == company_name,
        models.TradeHistory.posting_date != None,
        models.TradeHistory.posting_date != ""
    ).group_by(
        func.substr(models.TradeHistory.posting_date, 1, 7)
    ).order_by(
        func.substr(models.TradeHistory.posting_date, 1, 7).asc()
    ).all()
    
    return [{"month": r.month, "total_quantity_pcs": r.total_quantity_pcs} for r in results]

