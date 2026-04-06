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
    base_uom_item: Optional[str] = None
    total_quantity_pcs: Optional[int] = None
    product_code: str
    item_no: Optional[str] = None
    invoice_no: Optional[str] = None
    company_name: str
    posting_group: Optional[str] = None
    salesperson: Optional[str] = None
    import_batch: Optional[str] = None

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
