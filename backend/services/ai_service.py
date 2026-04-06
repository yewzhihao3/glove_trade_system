import os
import requests
import re
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

# --- PROMPT TEMPLATES ---

LEAD_FINDER_PROMPT = """You are a trade researcher. Given the following HS Code, product keyword, and country/region, search for as many real-world companies as possible that import or buy these products.

HS Code: {hs_code}
Product: {keyword}
Country/Region: {country}

IMPORTANT: Return a numbered list of all real, verifiable, and currently active companies you can find (minimum 20, ideally more). If the list is long, return results in multiple parts (Part 1, Part 2, etc.), or chunked by region. Do not stop at 10.

For each company, you MUST provide ALL of the following information in this exact format:

1. **Company Name**: [Full company name]
   - **Country**: [Country where the company is located]
   - **Website**: [Company website URL - if no website, write "No website available"]
   - **Description**: [Brief description of what the company does, their business focus, and why they would import/buy this product]

REQUIREMENTS:
- Only include importers, buyers, and distributors (not manufacturers)
- Only return real, verifiable information
- Each company MUST have all 4 fields: Company Name, Country, Website, Description
- If you cannot find a website, write "No website available"
- If you cannot find a description, write "Import/distribution company"
- Prioritize companies with recent activity in the last 3 years

If none is found, respond: "No verified buyers found."
"""

HS_CODE_PROMPT = """I need to find the most relevant HS tariff codes for {product_type} in {country}, with PRIORITY on latex and nitrile gloves.

Please provide a list of HS tariff codes that are commonly used for {product_type} in {country}, along with their descriptions. Focus on the most relevant codes that would be used for importing or exporting to/from {country}.

IMPORTANT: Please format your response EXACTLY as follows:

1. HS Code: [8-10 digit tariff code] - Description: [detailed description]
2. HS Code: [8-10 digit tariff code] - Description: [detailed description]

Please provide 5-10 most relevant HS tariff codes.

Requirements:
- Use full 8-10 digit HS tariff codes (e.g., 4015.12.1000)
- Provide clear, concise descriptions
- Focus on codes commonly used in {country}
- Do not include any additional formatting, notes, or explanations after the numbered list.
"""

# --- AI QUERY LOGIC ---

def query_deepseek(prompt: str) -> str:
    if not DEEPSEEK_API_KEY:
        raise ValueError("DEEPSEEK_API_KEY is not set in environment variables.")

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "model": "deepseek-reasoner",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2
    }

    all_parts = []
    part_number = 1
    
    while True:
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data)
        if not response.ok:
            raise Exception(f"DeepSeek API Error: {response.text}")
            
        result = response.json()
        content = result['choices'][0]['message']['content']
        all_parts.append(content)
        
        # Multi-part handling
        if re.search(rf'Part\s*{part_number}', content, re.IGNORECASE):
            if re.search(rf'Part\s*{part_number + 1}', content, re.IGNORECASE):
                break
            part_number += 1
            data["messages"].append({"role": "assistant", "content": content})
            data["messages"].append({"role": "user", "content": f"Please continue with Part {part_number}."})
        else:
            break
            
    return "\n".join(all_parts)

# --- PARSING LOGIC ---

def parse_leads(output: str) -> List[Dict]:
    output = output.replace('**', '')
    companies = []
    blocks = re.split(r'\n\d+\. ', '\n' + output)
    for block in blocks:
        if not block.strip(): continue
        company = {}
        # Name
        m = re.search(r'Company Name:?.*?([\w\W]*?)(?:\n|$)', block)
        if m and m.group(1).strip():
            company['company_name'] = m.group(1).strip().replace('\n', ' ')
        else:
            m = re.match(r'(.+)', block)
            if m: company['company_name'] = m.group(1).strip().replace('\n', ' ')
        
        # Country
        m = re.search(r'Country:?.*?([\w\W]*?)(?:\n|$)', block)
        if m: company['company_country'] = m.group(1).strip()
        
        # Website
        m = re.search(r'Website:?.*?([\w\W]*?)(?:\n|$)', block)
        if m:
            url_match = re.search(r'(https?://[\w\.-]+[\w\d/#?&=\.-]*)', m.group(1))
            company['company_website_link'] = url_match.group(1).strip() if url_match else "No website available"
            
        # Description
        m = re.search(r'Description:?.*?([\w\W]*?)(?=\n- |$)', block, re.DOTALL)
        if m: company['description'] = m.group(1).strip().replace('\n', ' ')
        
        if company.get('company_name'):
            companies.append(company)
    return companies

def parse_hscodes(output: str) -> List[Dict]:
    output = output.replace('**', '').replace('*', '')
    codes = []
    blocks = re.split(r'\n\d+\. ', '\n' + output)
    for block in blocks:
        if not block.strip(): continue
        m_code = re.search(r'HS Code:\s*([\d\.]+)', block, re.IGNORECASE)
        m_desc = re.search(r'Description:\s*(.+?)(?=\n|$)', block, re.IGNORECASE)
        
        if m_code and m_desc:
            codes.append({
                "hs_code": m_code.group(1).strip(),
                "description": m_desc.group(1).strip()
            })
    return codes

# --- PUBLIC API ---

def get_ai_buyer_leads(hs_code: str, keyword: str, country: str) -> List[Dict]:
    prompt = LEAD_FINDER_PROMPT.format(hs_code=hs_code, keyword=keyword, country=country)
    raw_output = query_deepseek(prompt)
    return parse_leads(raw_output)

def get_ai_hscodes(product_type: str, country: str) -> List[Dict]:
    region_text = "globally" if country == "Worldwide" else f"in {country}"
    prompt = HS_CODE_PROMPT.format(product_type=product_type, country=region_text)
    raw_output = query_deepseek(prompt)
    return parse_hscodes(raw_output)
