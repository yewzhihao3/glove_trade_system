from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional
from models import models
from datetime import datetime


# ─── Shared date-filter helper ────────────────────────────────────────────────

def _apply_date_filter(query, date_from: Optional[str], date_to: Optional[str]):
    """Apply posting_date range filters to any query."""
    if date_from:
        query = query.filter(models.TradeHistory.posting_date >= date_from)
    if date_to:
        query = query.filter(models.TradeHistory.posting_date <= date_to)
    return query


# ─── Analytics functions ───────────────────────────────────────────────────────

def get_top_buyers(db: Session, limit: int = 10, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        models.TradeHistory.company_name,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(models.TradeHistory.company_name).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    return [{"company_name": r.company_name, "total_quantity_pcs": r.total_quantity_pcs} for r in results if r.company_name]


def get_top_countries(db: Session, limit: int = 10, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        models.TradeHistory.ship_to_country,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(models.TradeHistory.ship_to_country).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    return [{"ship_to_country": r.ship_to_country, "total_quantity_pcs": r.total_quantity_pcs} for r in results if r.ship_to_country]


def get_top_products(db: Session, limit: int = 10, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        models.TradeHistory.product_code,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(models.TradeHistory.product_code).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    return [{"product_code": r.product_code, "total_quantity_pcs": r.total_quantity_pcs} for r in results if r.product_code]


def get_monthly_trend(db: Session, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        func.substr(models.TradeHistory.posting_date, 1, 7).label('month'),
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    ).filter(
        models.TradeHistory.posting_date != None,
        models.TradeHistory.posting_date != ""
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(
        func.substr(models.TradeHistory.posting_date, 1, 7)
    ).order_by(
        func.substr(models.TradeHistory.posting_date, 1, 7).asc()
    ).all()
    return [{"month": r.month, "total_quantity_pcs": r.total_quantity_pcs} for r in results]


def get_company_trend(db: Session, company_name: str, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        func.substr(models.TradeHistory.posting_date, 1, 7).label('month'),
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    ).filter(
        models.TradeHistory.company_name == company_name,
        models.TradeHistory.posting_date != None,
        models.TradeHistory.posting_date != ""
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(
        func.substr(models.TradeHistory.posting_date, 1, 7)
    ).order_by(
        func.substr(models.TradeHistory.posting_date, 1, 7).asc()
    ).all()
    return [{"month": r.month, "total_quantity_pcs": r.total_quantity_pcs} for r in results]


def get_top_sizes(db: Session, limit: int = 10, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        models.TradeHistory.size,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    ).filter(
        models.TradeHistory.size != 'N/A',
        models.TradeHistory.size != None
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(models.TradeHistory.size).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    return [{"size": r.size, "total_quantity_pcs": r.total_quantity_pcs} for r in results if r.size]


def get_top_items(db: Session, limit: int = 20, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        models.TradeHistory.item_no,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    ).filter(
        models.TradeHistory.item_no != None,
        models.TradeHistory.item_no != ""
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(models.TradeHistory.item_no).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    return [{"item_no": r.item_no, "total_quantity_pcs": r.total_quantity_pcs} for r in results if r.item_no]


def get_top_groups(db: Session, limit: int = 10, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        models.TradeHistory.posting_group,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    ).filter(
        models.TradeHistory.posting_group != None,
        models.TradeHistory.posting_group != ""
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(models.TradeHistory.posting_group).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    return [{"posting_group": r.posting_group, "total_quantity_pcs": r.total_quantity_pcs} for r in results if r.posting_group]


def get_top_salespeople(db: Session, limit: int = 10, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        models.TradeHistory.salesperson,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    ).filter(
        models.TradeHistory.salesperson != None,
        models.TradeHistory.salesperson != ""
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(models.TradeHistory.salesperson).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    return [{"salesperson": r.salesperson, "total_quantity_pcs": r.total_quantity_pcs} for r in results if r.salesperson]


def get_yearly_trend(db: Session, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        func.substr(models.TradeHistory.posting_date, 1, 4).label('year'),
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    ).filter(
        models.TradeHistory.posting_date != None,
        models.TradeHistory.posting_date != ""
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(
        func.substr(models.TradeHistory.posting_date, 1, 4)
    ).order_by(
        func.substr(models.TradeHistory.posting_date, 1, 4).asc()
    ).all()
    return [{"year": r.year, "total_quantity_pcs": r.total_quantity_pcs} for r in results]


def get_potential_buyers(
    db: Session,
    min_transactions: int = 1,
    min_value: int = 0,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> List[Dict]:
    q = db.query(
        models.TradeHistory.company_name,
        models.TradeHistory.ship_to_country,
        func.count(models.TradeHistory.id).label('total_orders'),
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs'),
        func.min(models.TradeHistory.posting_date).label('first_purchase'),
        func.max(models.TradeHistory.posting_date).label('last_purchase')
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(
        models.TradeHistory.company_name,
        models.TradeHistory.ship_to_country
    ).having(
        func.count(models.TradeHistory.id) >= min_transactions,
        func.sum(models.TradeHistory.total_quantity_pcs) >= min_value
    ).all()

    analyzed = []
    today = datetime.now()

    for r in results:
        activity_period = "Unknown"
        if r.last_purchase:
            try:
                last_dt = datetime.strptime(r.last_purchase[:10], "%Y-%m-%d")
                days_diff = (today - last_dt).days
                if days_diff <= 30:
                    activity_period = "Recent (30 days)"
                elif days_diff <= 90:
                    activity_period = "Recent (3 months)"
                elif days_diff <= 365:
                    activity_period = "Last Year"
                elif days_diff <= 730:
                    activity_period = "Last 2 Years"
                else:
                    activity_period = "Old (> 2 years)"
            except Exception:
                pass

        analyzed.append({
            "company_name": r.company_name or "Unknown",
            "country": r.ship_to_country or "Unknown",
            "total_orders": r.total_orders,
            "total_quantity_pcs": r.total_quantity_pcs or 0,
            "first_purchase": str(r.first_purchase),
            "last_purchase": str(r.last_purchase),
            "activity_period": activity_period
        })

    analyzed.sort(key=lambda x: x['total_quantity_pcs'], reverse=True)
    return analyzed
