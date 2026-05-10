import re
from typing import Optional
from pydantic import BaseModel

# Regex to match valid sizes: XS, S, M, L, XL, XXL, 3XL, or numerical sizes like 6, 7.5, 8
SIZE_PATTERN = re.compile(r'^(XXS|XS|S|M|L|XL|XXL|XXXL|3XL|4XL|5XL|\d+|\d+\.\d+)$', re.IGNORECASE)

class NormalizedProduct(BaseModel):
    base_family: str
    size_suffix: Optional[str]
    normalized_code: str
    original_code: str

def extract_base_product_code(product_code: str) -> str:
    """Extracts the base product family code by stripping known size suffixes."""
    if not product_code:
        return ""
    parts = product_code.split("-")
    if len(parts) > 1 and SIZE_PATTERN.match(parts[-1]):
        return "-".join(parts[:-1])
    return product_code

def extract_size_suffix(product_code: str) -> Optional[str]:
    """Extracts the size suffix if present."""
    if not product_code:
        return None
    parts = product_code.split("-")
    if len(parts) > 1 and SIZE_PATTERN.match(parts[-1]):
        return parts[-1].upper()
    return None

def normalize_product(product_code: str) -> NormalizedProduct:
    """Returns a reusable normalized metadata structure."""
    if not product_code:
        return NormalizedProduct(
            base_family="",
            size_suffix=None,
            normalized_code="",
            original_code=""
        )
        
    base = extract_base_product_code(product_code)
    suffix = extract_size_suffix(product_code)
    
    return NormalizedProduct(
        base_family=base,
        size_suffix=suffix,
        normalized_code=base.upper(),
        original_code=product_code
    )
