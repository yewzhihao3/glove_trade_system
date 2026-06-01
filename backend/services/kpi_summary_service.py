from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
import logging

from models import models
from schemas import schemas

logger = logging.getLogger("uvicorn")

def get_kpi_metrics(db: Session, date_from: Optional[str] = None, date_to: Optional[str] = None) -> schemas.KpiMetrics:
    """Calculates all KPI metrics (volume, counts) for a specific date range."""
    q = db.query(
        func.sum(models.TradeHistory.total_quantity_pcs).label('volume'),
        func.count(func.distinct(models.TradeHistory.company_name)).label('buyer_count'),
        func.count(func.distinct(models.TradeHistory.ship_to_country)).label('country_count'),
        func.count(func.distinct(models.TradeHistory.product_code)).label('product_count')
    )
    
    if date_from:
        q = q.filter(models.TradeHistory.posting_date >= date_from)
    if date_to:
        q = q.filter(models.TradeHistory.posting_date <= date_to)
        
    res = q.first()
    
    return schemas.KpiMetrics(
        volume=res.volume or 0,
        active_buyer_count=res.buyer_count or 0,
        active_country_count=res.country_count or 0,
        active_product_count=res.product_count or 0
    )

def calculate_comparison_period(date_from: Optional[str], date_to: Optional[str]):
    """
    Calculates the previous equivalent period based on the provided date range.
    Uses calendar-aware shift for complete months/years, otherwise uses day-based shift.
    """
    if not date_from and not date_to:
        return None, None
        
    try:
        if date_from and date_to:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d").date()
            dt_to = datetime.strptime(date_to, "%Y-%m-%d").date()
            
            # Check calendar alignment
            # A full month ends on the last day of the month, or the 1st of the next month.
            aligned_to_1st = False
            shift_months = 0
            
            if dt_from.day == 1:
                # Case 1: dt_to is the end of a month
                rd_end = relativedelta(dt_to + timedelta(days=1), dt_from)
                # Case 2: dt_to is the 1st of a month
                rd_start = relativedelta(dt_to, dt_from)
                
                if (dt_to + timedelta(days=1)).day == 1 and rd_end.days == 0:
                    aligned_to_1st = True
                    shift_months = rd_end.months + (rd_end.years * 12)
                elif dt_to.day == 1 and rd_start.days == 0:
                    aligned_to_1st = True
                    shift_months = rd_start.months + (rd_start.years * 12)
            
            if aligned_to_1st and shift_months > 0:
                prev_from = dt_from - relativedelta(months=shift_months)
                
                # relativedelta automatically handles end-of-month clamping (e.g., Mar 31 -> Feb 28)
                # but if dt_to was exactly end-of-month, let's make sure the resulting prev_to is also exactly end-of-month.
                # relativedelta(months=1) on May 31 gives April 30.
                # relativedelta(months=1) on Feb 28 (non-leap) gives Jan 28, which is NOT end of month!
                # To be perfectly robust for end-of-month:
                if (dt_to + timedelta(days=1)).day == 1:
                    # It was an end-of-month. Get the new end-of-month.
                    prev_to = (prev_from + relativedelta(months=shift_months, days=-1)) 
                    # Wait, prev_from + shift_months brings us back to dt_from.
                    # We want the end of the previous period.
                    # The previous period is exactly shift_months long.
                    # So prev_to should be: prev_from + relativedelta(months=shift_months) - 1 day
                    prev_to = prev_from + relativedelta(months=shift_months) - timedelta(days=1)
                else:
                    prev_to = dt_to - relativedelta(months=shift_months)
            else:
                delta = dt_to - dt_from
                prev_to = dt_from - timedelta(days=1)
                prev_from = prev_to - delta
            
            return prev_from, prev_to
            
        elif date_from and not date_to:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d").date()
            dt_to = datetime.now().date()
            delta = dt_to - dt_from
            
            prev_to = dt_from - timedelta(days=1)
            prev_from = prev_to - delta
            
            return prev_from, prev_to
            
        elif not date_from and date_to:
            return None, None
            
    except ValueError:
        logger.error(f"Error parsing dates for comparison: {date_from}, {date_to}")
        return None, None
        
    return None, None

def get_kpi_summary(
    db: Session,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> schemas.KpiSummaryResponse:
    
    # Parse dates to objects for metadata
    curr_from = datetime.strptime(date_from, "%Y-%m-%d").date() if date_from else None
    curr_to = datetime.strptime(date_to, "%Y-%m-%d").date() if date_to else None
    
    # Current Metrics
    current_metrics = get_kpi_metrics(db, date_from, date_to)
    
    # Previous Metrics
    prev_from, prev_to = calculate_comparison_period(date_from, date_to)
    
    if prev_from and prev_to:
        previous_metrics = get_kpi_metrics(db, prev_from.strftime("%Y-%m-%d"), prev_to.strftime("%Y-%m-%d"))
        comparison_available = True
    else:
        previous_metrics = None
        comparison_available = False
        
    # Growth Calculation (Volume only for now, others are null)
    volume_pct = None
    growth_status = schemas.KpiGrowthStatus.UNAVAILABLE
    
    if comparison_available and previous_metrics is not None:
        c_vol = current_metrics.volume
        p_vol = previous_metrics.volume
        
        if p_vol > 0:
            volume_pct = ((c_vol - p_vol) / p_vol) * 100.0
            if volume_pct > 0:
                growth_status = schemas.KpiGrowthStatus.POSITIVE
            elif volume_pct < 0:
                growth_status = schemas.KpiGrowthStatus.NEGATIVE
            else:
                growth_status = schemas.KpiGrowthStatus.NEUTRAL
        elif p_vol == 0 and c_vol > 0:
            volume_pct = None
            growth_status = schemas.KpiGrowthStatus.NEW_ACTIVITY
        elif p_vol > 0 and c_vol == 0:
            volume_pct = -100.0
            growth_status = schemas.KpiGrowthStatus.FULLY_DECLINED
        elif p_vol == 0 and c_vol == 0:
            volume_pct = 0.0
            growth_status = schemas.KpiGrowthStatus.NEUTRAL
    
    growth = schemas.KpiGrowth(
        volume_pct=round(volume_pct, 2) if volume_pct is not None else None,
        buyer_pct=None,
        country_pct=None,
        product_pct=None
    )
    
    return schemas.KpiSummaryResponse(
        current_metrics=current_metrics,
        previous_metrics=previous_metrics,
        growth=growth,
        growth_status=growth_status,
        comparison_available=comparison_available,
        current_period=schemas.KpiSummaryPeriodMetadata(
            from_date=curr_from,
            to_date=curr_to
        ),
        comparison_period=schemas.KpiSummaryPeriodMetadata(
            from_date=prev_from,
            to_date=prev_to
        )
    )
