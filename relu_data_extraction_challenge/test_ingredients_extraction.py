import json
import re
import requests
from bs4 import BeautifulSoup

def decode_cf_email(encoded):
    if not encoded:
        return ""
    try:
        r = int(encoded[:2], 16)
        email = "".join([chr(int(encoded[i:i+2], 16) ^ r) for i in range(2, len(encoded), 2)])
        return email
    except Exception:
        return ""

def get_company_record(company_id, session=None):
    if session is None:
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
    
    # 1. Fetch JSON
    record_id_str = str(company_id).zfill(6)
    p1 = record_id_str[:2]
    p2 = record_id_str[2:4]
    p3 = record_id_str[4:6]
    json_url = f"https://www.ingredientsnetwork.com/47/company/{p1}/{p2}/{p3}/search{company_id}_46.json?v=21"
    
    resp = session.get(json_url, timeout=15)
    if resp.status_code != 200:
        return None
    jdata = resp.json().get("result", {})
    
    profile_url = jdata.get("url") or jdata.get("link")
    name = jdata.get("title") or jdata.get("companyname", "")
    desc = jdata.get("fulldesc") or jdata.get("desc", "")
    categories = jdata.get("categories", "")
    activity = jdata.get("companyTypes", "")
    phone = jdata.get("phone", "")
    
    # 2. Fetch Profile HTML to get Email, Address, Sales Markets, Events, Website
    email = ""
    address = ""
    sales_markets = ""
    events = ""
    website = ""
    
    if profile_url:
        p_resp = session.get(profile_url, timeout=15)
        if p_resp.status_code == 200:
            soup = BeautifulSoup(p_resp.text, "html.parser")
            
            # JSON-LD check
            for s in soup.find_all("script", type="application/ld+json"):
                try:
                    data = json.loads(s.string)
                    graph = data.get("@graph", [data])
                    for item in graph:
                        if item.get("@type") == "Organization":
                            if not email and item.get("email"):
                                email = item.get("email")
                            if not phone and item.get("telephone"):
                                phone = item.get("telephone")
                            if not desc and item.get("description"):
                                desc = item.get("description")
                            addr = item.get("address")
                            if addr and isinstance(addr, dict):
                                parts = [addr.get("streetAddress"), addr.get("postalCode"), addr.get("addressLocality"), addr.get("addressCountry")]
                                address = ", ".join([p for p in parts if p])
                except Exception:
                    pass
            
            # HTML Table for Sales Markets and Primary Business Activity
            for tr in soup.find_all("tr"):
                th = tr.find("th")
                td = tr.find("td")
                if th and td:
                    label = th.get_text(strip=True).lower()
                    val = td.get_text(strip=True)
                    if "sales market" in label:
                        sales_markets = val
                    elif "primary business activity" in label and not activity:
                        activity = val
            
            # Popup info for Address, Email, Telephone, Website
            popup = soup.find("div", id="company-information")
            if popup:
                addr_elem = popup.find("address")
                if addr_elem and not address:
                    address = " ".join(addr_elem.get_text().split())
                
                # Cloudflare email
                cf_span = popup.find("span", class_="__cf_email__")
                if cf_span and cf_span.get("data-cfemail") and not email:
                    email = decode_cf_email(cf_span["data-cfemail"])
                
                # Phone
                tel_a = popup.find("a", href=re.compile(r"^tel:"))
                if tel_a and not phone:
                    phone = tel_a.get_text(strip=True)
                
                # Website
                web_a = popup.find("a", href=re.compile(r"^https?://(?!www\.ingredientsnetwork)"))
                if web_a:
                    website = web_a.get("href", "")
            
            # Upcoming events
            events_section = soup.find("div", class_="event")
            if events_section:
                events = " - ".join([t.get_text(strip=True) for t in events_section.find_all(["span", "div", "p"]) if t.get_text(strip=True)])

    return {
        "company_name": name,
        "company_description": desc,
        "sales_markets": sales_markets,
        "primary_business_activity": activity,
        "categories": categories,
        "events": events,
        "address": address,
        "email": email,
        "telephone": phone,
        "website": website,
        "profile_url": profile_url
    }

if __name__ == "__main__":
    rec = get_company_record(316951)
    print(json.dumps(rec, indent=2))
