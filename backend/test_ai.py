import asyncio
from database import SessionLocal
from services import recommendation_engine

db = SessionLocal()
try:
    res = recommendation_engine.get_ai_recommended_buyers(
        db,
        product_code="E-DCE4160NRLB-9-M",
        size="M",
        country=None,
        date_from=None,
        date_to="2023-12-31",
        limit=5,
        include_existing=False,
        diversity_mode=False
    )
    import json
    print(res.model_dump_json(indent=2))
finally:
    db.close()
