from fastapi import APIRouter, Depends, Query, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from schemas import schemas
from services.history_service import get_paginated_history, process_history_upload
from routes.auth import get_current_user, require_role

router = APIRouter(prefix="/history", tags=["Trade History"])

@router.get("", response_model=schemas.PaginatedHistoryResponse)
def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company_name: Optional[str] = None,
    country: Optional[str] = None,
    product_code: Optional[str] = None,
    item_no: Optional[str] = None,
    posting_group: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    data, total_count = get_paginated_history(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        date_from=date_from,
        date_to=date_to,
        company_name=company_name,
        country=country,
        product_code=product_code,
        item_no=item_no,
        posting_group=posting_group
    )
    
    if current_user.role != "admin":
        for item in data:
            item.salesperson = None
            
    return {
        "data": data,
        "total": total_count,
        "page": page,
        "page_size": page_size
    }

@router.post("/upload", response_model=schemas.UploadHistoryResponse)
def upload_history(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    total_inserted = 0
    total_skipped = 0
    for file in files:
        inserted, skipped = process_history_upload(db, file)
        total_inserted += inserted
        total_skipped += skipped
        
    return {
        "inserted_rows": total_inserted,
        "skipped_rows": total_skipped,
        "message": f"Successfully processed {len(files)} file(s). Inserted: {total_inserted}, Skipped duplicates: {total_skipped}"
    }

