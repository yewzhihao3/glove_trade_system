from sqlalchemy.orm import Session
from sqlalchemy import or_
import pandas as pd
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException
from models import models

def get_paginated_history(
    db: Session,
    page: int = 1,
    page_size: int = 50,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company_name: Optional[str] = None,
    country: Optional[str] = None,
    product_code: Optional[str] = None,
    item_no: Optional[str] = None,
    posting_group: Optional[str] = None
) -> Tuple[list, int]:
    
    query = db.query(models.TradeHistory)
    
    # Text Search across multiple columns
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.TradeHistory.company_name.ilike(search_pattern),
                models.TradeHistory.product_code.ilike(search_pattern),
                models.TradeHistory.item_no.ilike(search_pattern),
                models.TradeHistory.ship_to_country.ilike(search_pattern)
            )
        )
    
    # Exact / partial filters
    if company_name:
        query = query.filter(models.TradeHistory.company_name.ilike(f"%{company_name}%"))
    if country:
        query = query.filter(models.TradeHistory.ship_to_country.ilike(f"%{country}%"))
    if product_code:
        query = query.filter(models.TradeHistory.product_code.ilike(f"%{product_code}%"))
    if item_no:
        query = query.filter(models.TradeHistory.item_no.ilike(f"%{item_no}%"))
    if posting_group:
        query = query.filter(models.TradeHistory.posting_group.ilike(f"%{posting_group}%"))
        
    # Date filters (assuming YYYY-MM-DD string format)
    if date_from:
        query = query.filter(models.TradeHistory.posting_date >= date_from)
    if date_to:
        query = query.filter(models.TradeHistory.posting_date <= date_to)
        
    # Get total count before pagination
    total_count = query.count()
    
    # Calculate limits
    offset = (page - 1) * page_size
    data = query.order_by(models.TradeHistory.posting_date.desc()).offset(offset).limit(page_size).all()
    
    return data, total_count


def process_history_upload(db: Session, file: UploadFile) -> Tuple[int, int]:
    filename = file.filename.lower()
    
    # Read file using Pandas
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(file.file)
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file.file)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use CSV or Excel.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
        
    # Convert dataframe column names to match model using strict legacy regex rules
    import re
    def clean_column_name(col_name: str) -> str:
        cleaned = str(col_name).lower()
        cleaned = re.sub(r'[^\w\s]', '', cleaned)  # Remove special characters except spaces
        cleaned = re.sub(r'\s+', '_', cleaned)     # Replace spaces and newlines with underscores
        cleaned = re.sub(r'_+', '_', cleaned)      # Remove multiple underscores
        return cleaned.strip('_')
        
    df.columns = [clean_column_name(c) for c in df.columns]
    
    # Expect certain core columns, provide fallbacks
    col_mapping = {
        'posting_date': ['posting_date', 'date', 'sales_date'],
        'company_name': ['company_name', 'client', 'company'],
        'cust_name': ['cust_name', 'customer_name', 'customer name', 'customer'],
        'ship_to_name': ['ship_to_name', 'shipto_name', 'shiptoname', 'ship_to'],
        'product_code': ['product_code', 'item_code', 'code'],
        'item_no': ['item_no', 'item_num', 'item_number', 'itemno'],
        'invoice_no': ['invoice_no', 'inv_no', 'invoice', 'document_no', 'invoiceno'],
        'total_quantity_pcs': ['total_quantity_pcs', 'quantity', 'qty', 'total_qty', 'total_quantity'],
        'ship_to_country': ['ship_to_country', 'country', 'region', 'shipto_country', 'bill_to_country', 'billto_country'],
        'description_brand': ['description_brand', 'description', 'brand', 'desc'],
        'base_uom_item': ['base_uom_item', 'uom', 'unit'],
        'posting_group': ['posting_group', 'group'],
        'salesperson': ['salesperson', 'sales_person', 'rep']
    }
    
    # Map available columns to our model
    final_ds = {}
    for target_col, aliases in col_mapping.items():
        found = False
        for alias in aliases:
            if alias in df.columns:
                final_ds[target_col] = df[alias]
                found = True
                break
        if not found:
            # If a critical column is missing, assign empty strings or zeros appropriately
            if target_col in ['posting_date', 'company_name', 'cust_name', 'ship_to_name', 'product_code', 'item_no', 'invoice_no']:
                final_ds[target_col] = "" # Prevent None for indexing checks
            elif target_col == 'total_quantity_pcs':
                final_ds[target_col] = 0
            else:
                final_ds[target_col] = None
                
    mapped_df = pd.DataFrame(final_ds)
    mapped_df = mapped_df.fillna({
        'posting_date': '', 'company_name': '', 'cust_name': '', 'ship_to_name': '', 'product_code': '', 
        'item_no': '', 'invoice_no': '', 'total_quantity_pcs': 0, 'ship_to_country': ''
    })
    
    # Cast total_quantity_pcs to numeric
    mapped_df['total_quantity_pcs'] = pd.to_numeric(mapped_df['total_quantity_pcs'], errors='coerce').fillna(0).astype(int)
    
    # To prevent duplicates cleanly, we can query existing exact matches, or since db can be large,
    # we bulk process in chunks
    
    inserted = 0
    skipped = 0
    
    # For a high performance non-ORM bulk load avoiding nested loops, we check database combinations
    from sqlalchemy.sql import text
    
    # Extract unique batch components
    batch_records = mapped_df.to_dict('records')
    
    # Let's chunk records out to avoid blowing memory
    chunk_size = 500
    for i in range(0, len(batch_records), chunk_size):
        chunk = batch_records[i:i + chunk_size]
        new_objects = []
        for row in chunk:
            # CLI logic for determining company name based on customer name vs ship_to_name
            cust = str(row.get('cust_name', '') or '')
            ship = str(row.get('ship_to_name', '') or '')
            raw_comp = str(row.get('company_name', '') or '')
            
            if cust and 'gallant' in cust.lower():
                comp_name = ship.strip() if ship and ship.strip() else cust
            elif cust:
                comp_name = cust.strip()
            elif ship:
                comp_name = ship.strip()
            else:
                comp_name = raw_comp.strip()
            
            row['company_name'] = comp_name

            exists = db.query(models.TradeHistory.id).filter_by(
                posting_date=str(row['posting_date']),
                company_name=comp_name,
                product_code=str(row['product_code']),
                item_no=str(row['item_no']),
                invoice_no=str(row['invoice_no'])
            ).first()
            
            if exists:
                skipped += 1
            else:
                # Convert to string to be safe where expected
                row['posting_date'] = str(row['posting_date'])
                row['product_code'] = str(row['product_code'])
                row['item_no'] = str(row['item_no'])
                row['invoice_no'] = str(row['invoice_no'])
                row['cust_name'] = cust
                row['ship_to_name'] = ship
                row['ship_to_country'] = str(row.get('ship_to_country', '') or '')
                
                # Extract size from description
                desc = str(row.get('description_brand', ''))
                size_val = 'N/A'
                if desc:
                    size_indicators = [
                        '-XS', '-S', '-M', '-L', '-XL', '-XXL', '-2XL', '-3XL', '-4XL',
                        ', XS', ', S', ', M', ', L', ', XL', ', XXL',
                        ' XS', ' S ', ' M ', ' L ', ' XL ', ' XXL ',
                        '/XS', '/S', '/M', '/L', '/XL', '/XXL'
                    ]
                    for indicator in size_indicators:
                        if indicator in desc or indicator + ' ' in desc + ' ':
                            size_val = indicator.strip().strip(',/-')
                            break
                row['size'] = size_val
                
                new_objects.append(models.TradeHistory(**row))
                inserted += 1
                
        if new_objects:
            db.bulk_save_objects(new_objects)
            db.commit()
            
    return inserted, skipped
