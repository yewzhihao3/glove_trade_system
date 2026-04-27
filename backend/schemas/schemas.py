from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class HSCodeBase(BaseModel):
    hs_code: str
    description: str
    country: str
    source: str = "Manual"

class HSCodeCreate(HSCodeBase):
    pass

class HSCode(HSCodeBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BuyerLeadBase(BaseModel):
    hs_code: str
    keyword: str
    country: str
    company_name: str
    company_country: Optional[str] = None
    company_website_link: Optional[str] = None
    description: Optional[str] = None
    source: str = "DeepSeek"

class BuyerLeadCreate(BuyerLeadBase):
    pass

class BuyerLead(BuyerLeadBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TradeHistoryBase(BaseModel):
    posting_date: str
    cust_name: Optional[str] = None
    ship_to_country: Optional[str] = None
    ship_to_name: Optional[str] = None
    description_brand: Optional[str] = None
    size: Optional[str] = None
    base_uom_item: Optional[str] = None
    total_quantity_pcs: Optional[int] = None
    product_code: str
    item_no: Optional[str] = None
    company_name: str
    posting_group: Optional[str] = None
    salesperson: Optional[str] = None

class TradeHistoryCreate(TradeHistoryBase):
    pass

class TradeHistory(TradeHistoryBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class GenerateLeadsRequest(BaseModel):
    hs_code: str
    keyword: str
    country: str


# --- Pagination & Analytics Schemas ---

class PaginatedHistoryResponse(BaseModel):
    data: List[TradeHistory]
    total: int
    page: int
    page_size: int

class UploadHistoryResponse(BaseModel):
    inserted_rows: int
    skipped_rows: int
    message: str

class TopBuyerResponse(BaseModel):
    company_name: str
    total_quantity_pcs: int

class TopCountryResponse(BaseModel):
    ship_to_country: str
    total_quantity_pcs: int

class TopProductResponse(BaseModel):
    product_code: str
    total_quantity_pcs: int

class MonthlyTrendResponse(BaseModel):
    month: str
    total_quantity_pcs: int

class TopSizeResponse(BaseModel):
    size: str
    total_quantity_pcs: int

class TopItemResponse(BaseModel):
    item_no: str
    total_quantity_pcs: int

class TopGroupResponse(BaseModel):
    posting_group: str
    total_quantity_pcs: int

class TopSalespersonResponse(BaseModel):
    salesperson: str
    total_quantity_pcs: int

class YearlyTrendResponse(BaseModel):
    year: str
    total_quantity_pcs: int

class PotentialBuyerResponse(BaseModel):
    company_name: str
    country: str
    total_orders: int
    total_quantity_pcs: int
    first_purchase: str
    last_purchase: str
    activity_period: str

class BuyerByProductResponse(BaseModel):
    company_name: str
    country: str
    total_volume: int
    transaction_count: int
    last_purchase: str

class RecommendedBuyerResponse(BaseModel):
    company_name: str
    country: str
    total_volume: int
    transaction_count: int
    last_purchase: str
    match_reason: str
    is_exact_match: bool = False

class FilterFallbackResponse(BaseModel):
    data: List[str]
    fallback: bool = False

class BuyerByProductFallbackResponse(BaseModel):
    data: List[BuyerByProductResponse]
    fallback: bool = False

