import random
from typing import List, Dict, Optional

ARCHETYPE_TEMPLATES = {
    "Enterprise Buyer": [
        "Historically active enterprise-scale importer with strong consistency in {prefix} procurement.",
        "Demonstrates strong recurring procurement behaviour for {prefix} with stable high-volume ordering patterns."
    ],
    "Growth Buyer": [
        "Emerging buyer showing increasing purchase frequency and consistent volume in {prefix} products.",
        "Active prospect displaying strong growth signals and repeat ordering behavior for {prefix}."
    ],
    "Regional Specialist": [
        "Consistent {country}-based buyer demonstrating targeted procurement preference for {prefix} products.",
        "Specialized importer focusing heavily on {prefix} products within the {country} region."
    ],
    "Dormant Buyer": [
        "Previously active buyer of {prefix} products, presenting a strong re-engagement opportunity.",
        "Historical purchaser of {prefix} with significant past volume, currently dormant and ideal for win-back."
    ],
    "High-Frequency Importer": [
        "Highly active buyer characterized by frequent, consistent shipments of {prefix} products.",
        "Shows exceptional repeat purchasing activity for {prefix} across multiple quarters."
    ],
    "Opportunistic Buyer": [
        "Buyer displaying sporadic but notable purchasing behavior for {prefix} products.",
        "Prospect with varied purchasing patterns, showing specific interest in {prefix}."
    ],
    "Size-Focused Buyer": [
        "Specialized buyer demonstrating a highly concentrated purchasing pattern for size {size}.",
        "Niche prospect with strong historical preference for size {size} products."
    ]
}

def generate_archetype(total_orders: int, total_volume: int, recency_days: int, country_score: int, size_score: int) -> str:
    if recency_days > 180 and total_volume > 50000:
        return "Dormant Buyer"
    if total_orders >= 20 and total_volume >= 1000000:
        return "Enterprise Buyer"
    if total_orders >= 15:
        return "High-Frequency Importer"
    if size_score > 0 and total_orders >= 5:
        return "Size-Focused Buyer"
    if country_score > 0 and total_orders >= 10:
        return "Regional Specialist"
    if total_orders >= 5 and total_volume >= 100000:
        return "Growth Buyer"
    return "Opportunistic Buyer"

def generate_activity_status(recency_days: int, total_orders: int) -> str:
    if recency_days <= 90 and total_orders >= 10:
        return "HOT"
    if recency_days <= 180:
        return "ACTIVE"
    if recency_days <= 365:
        return "WARM"
    return "COLD"

def generate_recommendation_strength(final_score: int) -> str:
    if final_score >= 80:
        return "Strong Match"
    if final_score >= 60:
        return "Moderate Match"
    return "Exploratory Match"

def generate_opportunity_signals(scores: Dict[str, float], recency_days: int, country: str, size: str, variant_diversity: int = 0) -> List[str]:
    signals = []
    if scores.get('product') == 40:
        signals.append("Purchased exact product configuration previously")
    elif scores.get('product', 0) > 0:
        signals.append("Historical purchases in the same product category")
        
    if scores.get('freq', 0) > 10:
        signals.append("High repeat order activity")
    if scores.get('vol', 0) > 7:
        signals.append("Large historical shipment volume")
    if scores.get('country', 0) > 0 and country:
        signals.append(f"Consistent {country} sourcing preference")
        
    # Diversity-based size signals
    if variant_diversity > 2:
        signals.append("Buyer demonstrates diversified procurement across multiple size categories")
    elif variant_diversity > 1:
        if size:
            signals.append(f"Historically imports multiple size variants with dominant activity in Size {size}")
        else:
            signals.append("Procures multiple size variants within this product family")
    elif variant_diversity == 1 and size:
        signals.append(f"Buyer shows strong concentration in Size {size} purchases")
    elif scores.get('size', 0) > 0 and size:
        signals.append(f"Dominant Size {size} purchasing behavior")
        
    if recency_days <= 90:
        signals.append("Active in recent months")
    elif recency_days > 180:
        signals.append("Prime target for re-engagement")
        
    return signals

def generate_behavioral_metrics(total_orders: int, total_volume: int, recency_days: int, size: str, freq_score: float, variant_diversity: int = 0) -> dict:
    avg_vol = total_volume // total_orders if total_orders > 0 else 0
    if avg_vol >= 1000000:
        avg_vol_str = f"{avg_vol/1000000:.1f}M pcs/order"
    elif avg_vol >= 1000:
        avg_vol_str = f"{avg_vol/1000:.1f}k pcs/order"
    else:
        avg_vol_str = f"{avg_vol} pcs/order"
        
    if total_orders >= 20:
        freq_str = "Very High"
    elif total_orders >= 10:
        freq_str = "High"
    elif total_orders >= 4:
        freq_str = "Medium"
    else:
        freq_str = "Low"
        
    if recency_days <= 90:
        act_win = "Recent (<3 mo)"
    elif recency_days <= 180:
        act_win = "Active (<6 mo)"
    elif recency_days <= 365:
        act_win = "Dormant (6-12 mo)"
    else:
        act_win = "Inactive (>1 yr)"
        
    return {
        "avg_order_volume": avg_vol_str,
        "purchase_frequency": freq_str,
        "activity_window": act_win,
        "dominant_size": size if size else None,
        "repeat_order_score": round(freq_score, 1),
        "variant_diversity_score": variant_diversity
    }

def generate_insight_summary(archetype: str, prefix: str, country: str, size: str) -> str:
    templates = ARCHETYPE_TEMPLATES.get(archetype, ARCHETYPE_TEMPLATES["Opportunistic Buyer"])
    template = random.choice(templates)
    
    safe_prefix = prefix if prefix else "related"
    safe_country = country if country else "this region"
    safe_size = size if size else "various sizes"
    
    return template.format(prefix=safe_prefix, country=safe_country, size=safe_size)
