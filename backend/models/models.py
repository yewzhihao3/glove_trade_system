from sqlalchemy import Column, Integer, String, Float, DateTime, Text, UniqueConstraint, JSON
from sqlalchemy.sql import func
from database import Base
from .user import User

class HSCode(Base):
    __tablename__ = "hscodes"

    id = Column(Integer, primary_key=True, index=True)
    hs_code = Column(String, index=True)
    description = Column(Text)
    country = Column(String, index=True)
    source = Column(String, default="Manual")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint('hs_code', 'country', name='_hs_code_country_uc'),)

class BuyerLead(Base):
    __tablename__ = "buyer_leads"

    id = Column(Integer, primary_key=True, index=True)
    hs_code = Column(String, index=True)
    keyword = Column(String, index=True)
    country = Column(String, index=True)
    company_name = Column(String, index=True)
    company_country = Column(String)
    company_website_link = Column(String)
    description = Column(Text)
    source = Column(String, default="DeepSeek")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint('hs_code', 'keyword', 'country', 'company_name', name='_hs_keyword_country_company_uc'),)

class TradeHistory(Base):
    __tablename__ = "trade_history"

    id = Column(Integer, primary_key=True, index=True)
    posting_date = Column(String)  # Storing as string to match CLI's yyyy-mm-dd
    cust_name = Column(String, index=True)
    ship_to_country = Column(String, index=True)
    ship_to_name = Column(String)
    description_brand = Column(Text)
    base_uom_item = Column(String)
    total_quantity_pcs = Column(Integer)
    product_code = Column(String, index=True)
    item_no = Column(String)
    invoice_no = Column(String, index=True)
    company_name = Column(String, index=True)
    posting_group = Column(String)
    salesperson = Column(String)
    import_batch = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
