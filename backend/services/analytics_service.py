from sqlalchemy.orm import Session, Query
from sqlalchemy import func, or_, String
from typing import List, Dict, Optional
from models import models
from datetime import datetime
from collections import defaultdict
from cachetools import TTLCache
import logging
from utils.product_normalizer import extract_base_product_code

logger = logging.getLogger("uvicorn")

# YoY Cache: 1 hour TTL, max 100 items
yoy_cache = TTLCache(maxsize=100, ttl=3600)

# ─── Shared date-filter helper ────────────────────────────────────────────────

def _apply_date_filter(query: Query, date_from: Optional[str], date_to: Optional[str]) -> Query:
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
    return [{"company_name": r.company_name, "total_quantity_pcs": r.total_quantity_pcs or 0} for r in results if r.company_name]


def get_top_countries(db: Session, limit: int = 10, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        models.TradeHistory.ship_to_country,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(models.TradeHistory.ship_to_country).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    return [{"ship_to_country": r.ship_to_country, "total_quantity_pcs": r.total_quantity_pcs or 0} for r in results if r.ship_to_country]


def get_top_products(db: Session, limit: int = 10, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        models.TradeHistory.product_code,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_quantity_pcs')
    )
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(models.TradeHistory.product_code).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    return [{"product_code": r.product_code, "total_quantity_pcs": r.total_quantity_pcs or 0} for r in results if r.product_code]


def get_monthly_trend(db: Session, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        models.MonthlyTradeRollup.year,
        models.MonthlyTradeRollup.month,
        func.sum(models.MonthlyTradeRollup.total_quantity).label('total_quantity_pcs')
    )
    
    if date_from:
        sy = int(date_from[:4])
        sm = int(date_from[5:7])
        q = q.filter(or_(models.MonthlyTradeRollup.year > sy, (models.MonthlyTradeRollup.year == sy) & (models.MonthlyTradeRollup.month >= sm)))
    if date_to:
        ey = int(date_to[:4])
        em = int(date_to[5:7])
        q = q.filter(or_(models.MonthlyTradeRollup.year < ey, (models.MonthlyTradeRollup.year == ey) & (models.MonthlyTradeRollup.month <= em)))
    
    results = q.group_by(
        models.MonthlyTradeRollup.year,
        models.MonthlyTradeRollup.month
    ).order_by(
        models.MonthlyTradeRollup.year.asc(),
        models.MonthlyTradeRollup.month.asc()
    ).all()
    return [{"month": f"{r.year}-{r.month:02d}", "total_quantity_pcs": r.total_quantity_pcs or 0} for r in results]


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
    return [{"month": r.month, "total_quantity_pcs": r.total_quantity_pcs or 0} for r in results]


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
    return [{"size": r.size, "total_quantity_pcs": r.total_quantity_pcs or 0} for r in results if r.size]


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
    return [{"item_no": r.item_no, "total_quantity_pcs": r.total_quantity_pcs or 0} for r in results if r.item_no]


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
    return [{"posting_group": r.posting_group, "total_quantity_pcs": r.total_quantity_pcs or 0} for r in results if r.posting_group]


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
    return [{"salesperson": r.salesperson, "total_quantity_pcs": r.total_quantity_pcs or 0} for r in results if r.salesperson]


def get_yearly_trend(db: Session, date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict]:
    q = db.query(
        func.cast(models.MonthlyTradeRollup.year, String).label('year'),
        func.sum(models.MonthlyTradeRollup.total_quantity).label('total_quantity_pcs')
    )
    if date_from:
        sy = int(date_from[:4])
        sm = int(date_from[5:7])
        q = q.filter(or_(models.MonthlyTradeRollup.year > sy, (models.MonthlyTradeRollup.year == sy) & (models.MonthlyTradeRollup.month >= sm)))
    if date_to:
        ey = int(date_to[:4])
        em = int(date_to[5:7])
        q = q.filter(or_(models.MonthlyTradeRollup.year < ey, (models.MonthlyTradeRollup.year == ey) & (models.MonthlyTradeRollup.month <= em)))

    results = q.group_by(
        models.MonthlyTradeRollup.year
    ).order_by(
        models.MonthlyTradeRollup.year.asc()
    ).all()
    return [{"year": str(r.year), "total_quantity_pcs": r.total_quantity_pcs or 0} for r in results]


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


# ─── Buyer Finder ──────────────────────────────────────────────────────────────

def get_buyers_by_product(
    db: Session,
    product_code: Optional[str] = None,
    size: Optional[str] = None,
    country: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 50,
) -> List[Dict]:
    q = db.query(
        models.TradeHistory.company_name,
        models.TradeHistory.ship_to_country,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_volume'),
        func.count(models.TradeHistory.id).label('transaction_count'),
        func.max(models.TradeHistory.posting_date).label('last_purchase'),
    )
    if product_code:
        q = q.filter(models.TradeHistory.product_code == product_code)
    if size:
        # Trim + upper for case/whitespace-insensitive match (' L', 'l', 'L' all match 'L')
        q = q.filter(func.upper(func.trim(models.TradeHistory.size)) == size.strip().upper())
    if country:
        q = q.filter(models.TradeHistory.ship_to_country.ilike(country))
    q = _apply_date_filter(q, date_from, date_to)
    results = q.group_by(
        models.TradeHistory.company_name,
        models.TradeHistory.ship_to_country,
    ).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit).all()
    return [
        {
            "company_name": r.company_name or "Unknown",
            "country": r.ship_to_country or "Unknown",
            "total_volume": r.total_volume or 0,
            "transaction_count": r.transaction_count,
            "last_purchase": str(r.last_purchase or ""),
        }
        for r in results if r.company_name
    ]


# _extract_prefix has been centralized into utils.product_normalizer


def get_recommended_buyers(
    db: Session,
    product_code: Optional[str] = None,
    size: Optional[str] = None,
    country: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 50,
) -> List[Dict]:
    """Return buyers who purchased *similar* products, ranked by composite score.

    Similarity is determined by product-code family prefix (all segments except
    the last variant/size suffix) OR same size across any product.

    Buyers of the exact product are INCLUDED but tagged is_exact_match=True and
    ranked lower, so they appear below genuinely new prospects.
    """
    import logging
    log = logging.getLogger("uvicorn")

    # ── 1. Build similarity conditions ──────────────────────────────────────
    from sqlalchemy import or_

    conditions   = []
    prefix       = None

    if product_code:
        prefix = extract_base_product_code(product_code)
        conditions.append(or_(
            models.TradeHistory.product_code == prefix,
            models.TradeHistory.product_code.like(f"{prefix}-%")
        ))
        log.info(f"[RecommendedBuyers] product_code={product_code!r}  →  prefix={prefix!r}")

    if size and not product_code:
        # Size-only mode (trim + upper for dirty data)
        conditions.append(func.upper(func.trim(models.TradeHistory.size)) == size.strip().upper())
        log.info(f"[RecommendedBuyers] size-only mode  size={size!r}")

    if not conditions:
        log.info("[RecommendedBuyers] No conditions – returning empty")
        return []

    # ── 2. Query similar buyers (include exact matches for now) ─────────────
    q = db.query(
        models.TradeHistory.company_name,
        models.TradeHistory.ship_to_country,
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_volume'),
        func.count(models.TradeHistory.id).label('transaction_count'),
        func.max(models.TradeHistory.posting_date).label('last_purchase'),
    ).filter(or_(*conditions))

    # Apply size filter even when product_code is present (case-insensitive + trimmed)
    if size:
        q = q.filter(func.upper(func.trim(models.TradeHistory.size)) == size.strip().upper())
        log.info(f"[RecommendedBuyers] Applying size filter: size={size!r}")

    if country:
        q = q.filter(models.TradeHistory.ship_to_country.ilike(country))

    q = _apply_date_filter(q, date_from, date_to)

    results = q.group_by(
        models.TradeHistory.company_name,
        models.TradeHistory.ship_to_country,
    ).order_by(
        func.sum(models.TradeHistory.total_quantity_pcs).desc()
    ).limit(limit * 4).all()

    log.info(f"[RecommendedBuyers] Raw DB rows returned: {len(results)}")

    # ── 3. Collect exact-match buyer names (for flag only, NOT exclusion) ───
    exact_names: set[str] = set()
    if product_code:
        exact_rows = get_buyers_by_product(
            db,
            product_code=product_code,
            size=size,
            country=country,
            date_from=date_from,
            date_to=date_to,
            limit=9999,
        )
        exact_names = {r["company_name"] for r in exact_rows}
        log.info(f"[RecommendedBuyers] Exact-match buyers (to flag): {len(exact_names)}")

    # ── 4. Score every row ──────────────────────────────────────────────────
    today  = datetime.now()
    scored = []

    for r in results:
        if not r.company_name:
            continue

        # Recency
        recency_days = 9999
        if r.last_purchase:
            try:
                recency_days = (today - datetime.strptime(str(r.last_purchase)[:10], "%Y-%m-%d")).days
            except Exception:
                pass

        is_exact = r.company_name in exact_names

        # Composite score – exact buyers get a 50 % penalty so they rank lower
        base_score = (
            (r.total_volume or 0)
            + (r.transaction_count * 1000)
            - (recency_days * 10)
        )
        score = base_score * (0.5 if is_exact else 1.0)

        # Match reason
        if product_code:
            reason = (
                f"Also bought exact product"
                if is_exact
                else f"Bought similar '{prefix}' products"
            )
        else:
            reason = f"Bought size '{size}'"

        scored.append({
            "company_name":    r.company_name,
            "country":         r.ship_to_country or "Unknown",
            "total_volume":    r.total_volume or 0,
            "transaction_count": r.transaction_count,
            "last_purchase":   str(r.last_purchase or ""),
            "match_reason":    reason,
            "is_exact_match":  is_exact,
            "_score":          score,
        })

    scored.sort(key=lambda x: x["_score"], reverse=True)
    log.info(f"[RecommendedBuyers] Final candidates before trim: {len(scored)}")

    # Remove internal fields
    for item in scored:
        item.pop("_score", None)

    return scored[:limit]


# ─── YoY Comparison ────────────────────────────────────────────────────────────

def get_yoy_comparison(
    db: Session,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    product_code: Optional[str] = None,
    country: Optional[str] = None
) -> List[Dict]:
    """
    Retrieves Year-over-Year comparison data from the MonthlyTradeRollup table.
    Filters by dates, product, and country, caching the result in memory.
    Transforms data from long to wide format for multi-line charting.
    """
    # 1. Check in-memory Cache
    cache_key = f"yoy_{date_from}_{date_to}_{product_code}_{country}"
    if cache_key in yoy_cache:
        logger.info(f"Returning cached YoY data for key: {cache_key}")
        return yoy_cache[cache_key]

    # 2. Query MonthlyTradeRollup
    q = db.query(
        models.MonthlyTradeRollup.year,
        models.MonthlyTradeRollup.month,
        func.sum(models.MonthlyTradeRollup.total_quantity).label('total_qty')
    )
    
    # 3. Apply Filters
    if product_code:
        q = q.filter(models.MonthlyTradeRollup.product_code == product_code)
    if country:
        q = q.filter(models.MonthlyTradeRollup.country == country)
    
    if date_from:
        start_year = int(date_from[:4])
        start_month = int(date_from[5:7])
        # Simple approximation, exact requires year+month logic, but usually YoY runs open-ended
        q = q.filter(or_(
            models.MonthlyTradeRollup.year > start_year,
            (models.MonthlyTradeRollup.year == start_year) & (models.MonthlyTradeRollup.month >= start_month)
        ))
    if date_to:
        end_year = int(date_to[:4])
        end_month = int(date_to[5:7])
        q = q.filter(or_(
            models.MonthlyTradeRollup.year < end_year,
            (models.MonthlyTradeRollup.year == end_year) & (models.MonthlyTradeRollup.month <= end_month)
        ))
        
    results = q.group_by(
        models.MonthlyTradeRollup.year,
        models.MonthlyTradeRollup.month
    ).order_by(
        models.MonthlyTradeRollup.month,
        models.MonthlyTradeRollup.year
    ).all()

    # 4. Process Data (Pivot to Wide Format)
    # Target: {"month_index": 1, "month_label": "Jan", "2022_qty": 5000, "2023_qty": 6000}
    
    month_labels = {
        1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
        7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
    }

    # Initialize 12 rows perfectly
    wide_data = []
    for m in range(1, 13):
        wide_data.append({
            "month_index": m,
            "month_label": month_labels[m]
        })
        
    # Extract dynamically available years from results to pad out 0s if no data
    all_years = {r.year for r in results if r.year}

    sorted_years = sorted(list(all_years))
    
    # Initialize all known year keys with 0 inside our wide_data dicts
    for row_dict in wide_data:
        for y in sorted_years:
            row_dict[f"{y}_qty"] = 0
            
    # Populate actual values
    for r in results:
        if not r.month or not r.year:
            continue
        # month is 1-12, index in array is month - 1
        month_idx = int(r.month) - 1
        year_key = f"{int(r.year)}_qty"
        if 0 <= month_idx < 12:
            wide_data[month_idx][year_key] += int(r.total_qty or 0)

    logger.info(f"Generated YoY Data with {len(sorted_years)} years found. Saving to cache.")
    
    # Cache result
    yoy_cache[cache_key] = wide_data
    
    return wide_data
