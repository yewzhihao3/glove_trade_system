import random
from typing import List
from schemas.schemas import CompanyCreate

def generate_mock_companies(hs_code: str, country: str) -> List[CompanyCreate]:
    suffixes = ["Inc", "Corp", "Ltd", "Global", "Trading", "Solutions"]
    companies = []
    
    for i in range(5):
        name = f"Example {hs_code} Supplier {i+1} {random.choice(suffixes)}"
        companies.append(
            CompanyCreate(
                name=name,
                country=country,
                website=f"supplier{i+1}.example.com",
                confidence_score=round(random.uniform(0.7, 0.98), 2),
                source="AI Generated"
            )
        )
    return companies
