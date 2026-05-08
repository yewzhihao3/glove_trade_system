import logging
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, case
from typing import List, Dict, Optional, Set
from datetime import datetime
import math
from models import models
from schemas import schemas

logger = logging.getLogger("uvicorn")

def _extract_prefix(product_code: str) -> str:
    """Strip the last dash-segment (usually size/variant) to get a product-family prefix."""
    parts = product_code.split("-")
    if len(parts) >= 2:
        return "-".join(parts[:-1])
    return product_code[:8]

def get_ai_recommended_buyers(
    db: Session,
    product_code: Optional[str] = None,
    size: Optional[str] = None,
    country: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 50,
    include_existing: bool = False,
    diversity_mode: bool = False
) -> schemas.AIRecommendationEnvelope:
    
    # 1. Base Setup & Conditions
    conditions = []
    prefix = None
    size_upper = size.strip().upper() if size else None
    
    if product_code:
        prefix = _extract_prefix(product_code)
        conditions.append(models.TradeHistory.product_code.like(f"{prefix}%"))
    if size_upper:
        conditions.append(func.upper(func.trim(models.TradeHistory.size)) == size_upper)
    if country:
        conditions.append(models.TradeHistory.ship_to_country.ilike(country))
        
    if not conditions:
        return schemas.AIRecommendationEnvelope(recommendation_version="v1", data=[])

    base_filters = []
    if date_from:
        base_filters.append(models.TradeHistory.posting_date >= date_from)
    if date_to:
        base_filters.append(models.TradeHistory.posting_date <= date_to)

    # 2. Identify existing buyers for exclusion
    exact_match_buyers: Set[str] = set()
    if not include_existing and (product_code or size_upper or country):
        exact_q = db.query(models.TradeHistory.company_name)
        if product_code:
            exact_q = exact_q.filter(models.TradeHistory.product_code == product_code)
        if size_upper:
            exact_q = exact_q.filter(func.upper(func.trim(models.TradeHistory.size)) == size_upper)
        if country:
            exact_q = exact_q.filter(models.TradeHistory.ship_to_country.ilike(country))
            
        if base_filters:
            exact_q = exact_q.filter(*base_filters)
            
        # Only exclude if they matched ALL provided criteria
        exact_buyers = exact_q.distinct().all()
        exact_match_buyers = {r[0] for r in exact_buyers if r[0]}

    # 3. Aggregate candidate metrics
    product_case = case((models.TradeHistory.product_code.like(f"{prefix}%"), 1), else_=0) if prefix else 0
    size_case = case((func.upper(func.trim(models.TradeHistory.size)) == size_upper, 1), else_=0) if size_upper else 0
    country_case = case((models.TradeHistory.ship_to_country.ilike(country), 1), else_=0) if country else 0
    
    # For product exact match bonus
    product_exact_case = case((models.TradeHistory.product_code == product_code, 1), else_=0) if product_code else 0

    q = db.query(
        models.TradeHistory.company_name,
        models.TradeHistory.ship_to_country,
        func.count(models.TradeHistory.id).label('total_orders'),
        func.sum(models.TradeHistory.total_quantity_pcs).label('total_volume'),
        func.max(models.TradeHistory.posting_date).label('last_purchase'),
        func.count(func.distinct(models.TradeHistory.product_code)).label('matched_products'),
        func.max(product_case).label('has_product_match'),
        func.max(product_exact_case).label('has_exact_product_match'),
        func.max(size_case).label('has_size_match'),
        func.max(country_case).label('has_country_match')
    ).filter(*base_filters).filter(or_(*conditions))
    
    results = q.group_by(
        models.TradeHistory.company_name,
        models.TradeHistory.ship_to_country
    ).all()

    if not results:
        return schemas.AIRecommendationEnvelope(recommendation_version="v1", data=[])

    # 4. Global Min/Max for Normalization
    max_orders = max((r.total_orders for r in results if r.total_orders), default=1)
    max_volume = max((r.total_volume for r in results if r.total_volume), default=1)

    today = datetime.now()
    if date_to:
        try:
            today = datetime.strptime(str(date_to)[:10], "%Y-%m-%d")
        except Exception:
            pass

    scored_candidates = []

    # 5. Scoring
    for r in results:
        if not r.company_name:
            continue
            
        if r.company_name in exact_match_buyers:
            continue

        # Recency parsing
        recency_days = 9999
        if r.last_purchase:
            try:
                recency_days = (today - datetime.strptime(str(r.last_purchase)[:10], "%Y-%m-%d")).days
            except Exception:
                pass
        
        # --- Component Scoring ---
        # 1. Product (40%)
        product_score = 0
        if r.has_exact_product_match:
            product_score = 40
        elif r.has_product_match:
            product_score = 28 # 70% of 40

        # 2. Size (20%)
        size_score = 20 if r.has_size_match else 0
        
        # 3. Country (10%)
        country_score = 10 if r.has_country_match else 0
        
        # 4. Frequency (15%) - Normalized using log1p
        freq_score = 0
        if max_orders > 0 and r.total_orders:
            freq_score = (math.log1p(r.total_orders) / math.log1p(max_orders)) * 15
            
        # 5. Recency (5%)
        rec_score = max(0.0, 1.0 - (recency_days / 365.0)) * 5
        
        # 6. Volume (10%) - Normalized using log1p
        vol_score = 0
        if max_volume > 0 and r.total_volume:
            vol_score = (math.log1p(r.total_volume) / math.log1p(max_volume)) * 10
            
        # Base Raw Score
        raw_score = product_score + size_score + country_score + freq_score + rec_score + vol_score
        
        # --- Multipliers ---
        decay_multiplier = 1.0
        if recency_days > 180:
            decay_multiplier = 0.3
        elif recency_days > 90:
            decay_multiplier = 0.7
            
        final_score = int(round(raw_score * decay_multiplier))
        
        if final_score < 45:
            continue
            
        # --- Tiering ---
        if final_score >= 80:
            confidence = "High"
        elif final_score >= 60:
            confidence = "Medium"
        else:
            confidence = "Low"
            
        # --- Primary Match Type & Reasons ---
        components = {
            "product_similarity": product_score,
            "size_similarity": size_score,
            "country_similarity": country_score,
            "repeat_order_pattern": freq_score,
            "high_volume": vol_score
        }
        primary_match_type = max(components.items(), key=lambda x: x[1])[0]
        
        reasons = []
        if product_score == 40:
            reasons.append("Purchased exact product previously")
        elif product_score > 0:
            reasons.append(f"Purchased similar products in the '{prefix}' category")
            
        if size_score > 0:
            reasons.append(f"Frequently buys Size {size_upper} products")
            
        if country_score > 0:
            reasons.append(f"Located in target country ({country})")
            
        if freq_score > 10:
            reasons.append("High recurring order activity")
            
        if recency_days <= 90:
            reasons.append("Active within recent months")
            
        if vol_score > 7:
            reasons.append("Large historical purchase volume")

        scored_candidates.append({
            "buyer_name": r.company_name,
            "country": r.ship_to_country or "Unknown",
            "score": final_score,
            "confidence_tier": confidence,
            "primary_match_type": primary_match_type,
            "reasons": reasons,
            "metrics": schemas.AIRecommendationMetrics(
                matched_products=r.matched_products,
                total_orders=r.total_orders,
                total_volume=r.total_volume or 0,
                last_purchase_date=str(r.last_purchase)[:10] if r.last_purchase else ""
            )
        })
        
    # 6. Sort & Diversity Mode
    scored_candidates.sort(key=lambda x: x["score"], reverse=True)
    
    if diversity_mode:
        diverse_candidates = []
        country_counts = {}
        
        for cand in scored_candidates:
            c = cand["country"]
            country_counts[c] = country_counts.get(c, 0) + 1
            
            # Cap at 5 per country
            if country_counts[c] > 5:
                continue
                
            # Slight penalty for subsequent buyers from the same country (for visual ranking)
            if country_counts[c] > 2:
                cand["score"] = int(cand["score"] * 0.9)
                
            diverse_candidates.append(cand)
            
        # Re-sort after applying diversity penalties
        diverse_candidates.sort(key=lambda x: x["score"], reverse=True)
        final_list = diverse_candidates[:limit]
    else:
        final_list = scored_candidates[:limit]
        
    # Convert to Response Models
    response_data = [schemas.AIRecommendedBuyerResponse(**cand) for cand in final_list]
    
    return schemas.AIRecommendationEnvelope(
        recommendation_version="v1",
        data=response_data
    )
