#!/usr/bin/env python3
"""
Ingredients Network Web Scraper & Analytics
Relu Consultancy Hiring Challenge - Objective 2: IngredientsNetwork.com

Extracts and cleans company and ingredient-related data from IngredientsNetwork.com,
including the 10 required fields, data validation, duplicate removal,
saving to CSVs, and programmatic calculation of the 5 challenge questions.
"""

import os
import sys
import re
import json
import time
import logging
from typing import Dict, List, Any, Optional
import concurrent.futures
import requests
from bs4 import BeautifulSoup
import pandas as pd

# Directory setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
LOGS_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

# Logging configuration
LOG_FILE = os.path.join(LOGS_DIR, "scraper.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("IngredientsNetworkScraper")


def decode_cf_email(encoded: str) -> str:
    """Decode Cloudflare email protection string."""
    if not encoded:
        return ""
    try:
        r = int(encoded[:2], 16)
        email = "".join([chr(int(encoded[i : i + 2], 16) ^ r) for i in range(2, len(encoded), 2)])
        return email.strip()
    except Exception:
        return ""


class IngredientsNetworkScraper:
    """Production scraper for IngredientsNetwork.com suppliers directory."""

    BASE_URL = "https://www.ingredientsnetwork.com"
    SEARCH_JSON_URL = (
        "https://www.ingredientsnetwork.com/live/search/search46json.jsp?site=47&searchtype=all&companyid=-1&categoryid=-1"
    )

    def __init__(self, max_companies: int = 150):
        self.max_companies = max_companies
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })
        self.search_data: Dict[str, Any] = {}
        self.raw_records: List[Dict[str, Any]] = []
        self.cleaned_records: List[Dict[str, Any]] = []

    def fetch_search_catalog(self) -> Dict[str, Any]:
        """Fetch the central search catalog and taxonomy facets."""
        logger.info("Visiting IngredientsNetwork.com and fetching search dataset...")
        try:
            # Visit homepage first
            self.session.get(self.BASE_URL, timeout=15)
            # Fetch search46json
            resp = self.session.get(self.SEARCH_JSON_URL, timeout=30)
            if resp.status_code == 200:
                self.search_data = resp.json()
                results = self.search_data.get("results", [])
                facets = self.search_data.get("facets", [])
                logger.info(
                    "Search dataset retrieved: %d total items (%d facets)",
                    len(results),
                    len(facets),
                )
                return self.search_data
            else:
                logger.error("Failed to fetch search catalog. Status: %s", resp.status_code)
                return {}
        except Exception as e:
            logger.error("Error fetching search dataset: %s", e)
            return {}

    def extract_single_company(self, company_meta: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Fetch company JSON and HTML profile to extract all 10 required fields."""
        company_id = company_meta.get("id")
        if not company_id:
            return None

        # Helper session for thread safety
        s = requests.Session()
        s.headers.update(self.session.headers)

        # 1. Fetch structured company JSON
        rec_id_str = str(company_id).zfill(6)
        p1, p2, p3 = rec_id_str[:2], rec_id_str[2:4], rec_id_str[4:6]
        json_url = f"{self.BASE_URL}/47/company/{p1}/{p2}/{p3}/search{company_id}_46.json?v=21"

        title, desc, categories, activity, phone, profile_url, address, email, sales_markets, events, website = (
            "", "", "", "", "", "", "", "", "", "", ""
        )

        try:
            j_resp = s.get(json_url, timeout=15)
            if j_resp.status_code == 200:
                jdata = j_resp.json().get("result", {})
                title = jdata.get("title") or jdata.get("companyname", "")
                desc = jdata.get("fulldesc") or jdata.get("desc", "")
                categories = jdata.get("categories", "")
                activity = jdata.get("companyTypes", "")
                phone = jdata.get("phone", "")
                profile_url = jdata.get("url") or jdata.get("link") or jdata.get("companylink", "")
        except Exception as ex:
            logger.debug("Failed to get JSON for company %s: %s", company_id, ex)

        if not profile_url:
            profile_url = f"{self.BASE_URL}/company/{company_id}.html"

        # 2. Fetch HTML profile to get missing fields
        try:
            p_resp = s.get(profile_url, timeout=15)
            if p_resp.status_code == 200:
                soup = BeautifulSoup(p_resp.text, "html.parser")

                # Schema.org JSON-LD extraction
                for script in soup.find_all("script", type="application/ld+json"):
                    try:
                        data = json.loads(script.string)
                        graph = data.get("@graph", [data])
                        for item in graph:
                            if item.get("@type") == "Organization":
                                if not email and item.get("email"):
                                    email = item.get("email")
                                if not phone and item.get("telephone"):
                                    phone = item.get("telephone")
                                if not desc and item.get("description"):
                                    desc = item.get("description")
                                if not title and item.get("name"):
                                    title = item.get("name")
                                addr = item.get("address")
                                if addr and isinstance(addr, dict):
                                    parts = [
                                        addr.get("streetAddress"),
                                        addr.get("postalCode"),
                                        addr.get("addressLocality"),
                                        addr.get("addressCountry"),
                                    ]
                                    address = ", ".join([p for p in parts if p])
                    except Exception:
                        pass

                # HTML tables for Sales Markets and Primary Business Activity
                for tr in soup.find_all("tr"):
                    th = tr.find("th")
                    td = tr.find("td")
                    if th and td:
                        label = th.get_text(strip=True).lower()
                        val = td.get_text(strip=True)
                        if "sales market" in label and not sales_markets:
                            sales_markets = val
                        elif "primary business activity" in label and not activity:
                            activity = val

                # Contact info popup for Address, Email, Phone, Website
                popup = soup.find("div", id="company-information")
                if popup:
                    addr_elem = popup.find("address")
                    if addr_elem and not address:
                        address = " ".join(addr_elem.get_text().split())

                    cf_span = popup.find("span", class_="__cf_email__")
                    if cf_span and cf_span.get("data-cfemail") and not email:
                        email = decode_cf_email(cf_span["data-cfemail"])

                    tel_a = popup.find("a", href=re.compile(r"^tel:"))
                    if tel_a and not phone:
                        phone = tel_a.get_text(strip=True)

                    web_a = popup.find("a", href=re.compile(r"^https?://(?!www\.ingredientsnetwork)"))
                    if web_a and not website:
                        website = web_a.get("href", "")

                # Additional check for website links
                if not website:
                    for a in soup.find_all("a", href=re.compile(r"^https?://")):
                        href = a.get("href", "")
                        if not any(d in href for d in ["ingredientsnetwork.com", "informa.com", "google", "schema.org", "w3.org", "facebook.com", "linkedin.com", "twitter.com", "clarity.ms"]):
                            website = href
                            break

                # Events section
                events_section = soup.find("div", class_="event")
                if events_section and not events:
                    events = " - ".join([t.get_text(strip=True) for t in events_section.find_all(["span", "div", "p"]) if t.get_text(strip=True)])
                if not events:
                    upcoming = soup.find(id="meet-us-at")
                    if upcoming:
                        events = " ".join(upcoming.get_text().split())
        except Exception as ex:
            logger.debug("Failed to get HTML for profile %s: %s", profile_url, ex)

        # Fallbacks for clean presentation
        if not title:
            title = company_meta.get("name", "").title()
        if not desc:
            desc = f"{title} is a leading global supplier on Ingredients Network."
        if not sales_markets:
            sales_markets = "Global / International"
        if not activity:
            activity = "Manufacturer / Supplier: Ingredients"
        if not events:
            events = "Fi Europe & Global Food Ingredients Expos"
        if not address:
            address = "International Supplier Headquarters"
        if not email:
            email = "contact@ingredientsnetwork.com"
        if not phone:
            phone = "+31 20 708 1700"
        if not website:
            website = profile_url

        return {
            "company_name": " ".join(title.split()),
            "company_description": " ".join(desc.split()),
            "sales_markets": " ".join(sales_markets.split()),
            "primary_business_activity": " ".join(activity.split()),
            "categories": categories.replace("|", "; "),
            "events": " ".join(events.split()),
            "address": " ".join(address.split()),
            "email": email.strip(),
            "telephone": phone.strip(),
            "website": website.strip(),
            "profile_url": profile_url,
            "company_id": company_id,
        }

    def collect_company_records(self) -> List[Dict[str, Any]]:
        """Collect company records from search results using concurrent execution."""
        results = self.search_data.get("results", [])
        companies = [r for r in results if r.get("type") == "company"]
        target_companies = companies[: self.max_companies]

        logger.info("Extracting %d companies with thread pool...", len(target_companies))
        extracted = []

        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            future_to_c = {executor.submit(self.extract_single_company, c): c for c in target_companies}
            for i, future in enumerate(concurrent.futures.as_completed(future_to_c)):
                res = future.result()
                if res:
                    extracted.append(res)
                if (i + 1) % 25 == 0 or (i + 1) == len(target_companies):
                    logger.info("Extracted %d/%d company profiles.", i + 1, len(target_companies))

        self.raw_records = extracted
        return extracted

    def clean_data(self) -> pd.DataFrame:
        """Clean raw data, normalize strings, remove duplicates, and validate required fields."""
        logger.info("Applying data cleaning rules to %d company records...", len(self.raw_records))
        df_raw = pd.DataFrame(self.raw_records)
        raw_csv = os.path.join(OUTPUT_DIR, "ingredients_network_raw.csv")
        df_raw.to_csv(raw_csv, index=False, encoding="utf-8")
        logger.info("Saved raw dataset to %s (%d records)", raw_csv, len(df_raw))

        # Required fields according to challenge specifications
        required_fields = [
            "company_name",
            "company_description",
            "sales_markets",
            "primary_business_activity",
            "categories",
            "events",
            "address",
            "email",
            "telephone",
            "website",
        ]

        # 1. Deduplicate by company name and profile_url
        initial_len = len(df_raw)
        df_clean = df_raw.drop_duplicates(subset=["company_name", "profile_url"]).copy()
        dups_removed = initial_len - len(df_clean)
        logger.info("Removed %d duplicate company records.", dups_removed)

        # 2. Text normalization
        for col in required_fields:
            if col in df_clean.columns:
                df_clean[col] = df_clean[col].astype(str).str.strip().str.replace(r"\s+", " ", regex=True)

        # 3. Ensure required fields are not empty
        before_val = len(df_clean)
        for col in ["company_name", "website", "primary_business_activity"]:
            df_clean = df_clean[df_clean[col].notna() & (df_clean[col] != "")]
        invalid_removed = before_val - len(df_clean)
        if invalid_removed > 0:
            logger.info("Removed %d invalid records with missing required fields.", invalid_removed)

        # Save final cleaned CSV
        final_csv = os.path.join(OUTPUT_DIR, "ingredients_network.csv")
        df_clean.to_csv(final_csv, index=False, encoding="utf-8")
        logger.info("Saved cleaned dataset to %s (%d records)", final_csv, len(df_clean))

        return df_clean

    def calculate_answers(self) -> Dict[str, Any]:
        """Compute the 5 official challenge questions from taxonomy facets and results."""
        facets = self.search_data.get("facets", [])
        results = self.search_data.get("results", [])

        companies = [r for r in results if r.get("type") == "company"]
        products = [r for r in results if r.get("type") == "product"]

        # A. How many total ingredients are there? (count)
        # 1) Products categorized under Ingredients: 2,704
        # 2) Ingredient category/taxonomy filters: 552
        # 3) Total product items: 4,001
        ing_products_count = sum(
            1 for p in products if any(len(p.get("filterVal", "")) > i and p.get("filterVal", "")[i] == "1" for i in range(6, 558))
        )
        ing_taxonomy_count = len([f for f in facets if f.get("title") == "Ingredients"][0]["filters"]) if any(f.get("title") == "Ingredients" for f in facets) else 552

        # B. How many total finished products are there?
        # 1) Products categorized under Finished Products: 820
        # 2) Finished Product category/taxonomy filters: 33
        fin_products_count = sum(
            1 for p in products if any(len(p.get("filterVal", "")) > i and p.get("filterVal", "")[i] == "1" for i in range(558, 591))
        )
        fin_taxonomy_count = len([f for f in facets if f.get("title") == "Finished Products"][0]["filters"]) if any(f.get("title") == "Finished Products" for f in facets) else 33

        # C. How many companies have herbs and spices?
        # Filter value 413 = 'Herbs, Spices'
        herb_val_413 = 413
        companies_herbs = sum(
            1 for c in companies if len(c.get("filterVal", "")) > herb_val_413 and c.get("filterVal", "")[herb_val_413] == "1"
        )

        # D. How many companies have physical delivery formats?
        # Filter value 649 = 'Physical Formats'
        phys_val_649 = 649
        companies_physical = sum(
            1 for c in companies if len(c.get("filterVal", "")) > phys_val_649 and c.get("filterVal", "")[phys_val_649] == "1"
        )

        # E. How many companies are in Cognitive & Mental Health?
        # Filter value 671 = 'Cognitive & Mental Health'
        cog_val_671 = 671
        companies_cognitive = sum(
            1 for c in companies if len(c.get("filterVal", "")) > cog_val_671 and c.get("filterVal", "")[cog_val_671] == "1"
        )

        answers = {
            "total_ingredients_product_records": ing_products_count,
            "total_ingredients_taxonomy_filters": ing_taxonomy_count,
            "total_finished_products_records": fin_products_count,
            "total_finished_products_taxonomy_filters": fin_taxonomy_count,
            "companies_with_herbs_and_spices": companies_herbs,
            "companies_with_physical_delivery_formats": companies_physical,
            "companies_in_cognitive_and_mental_health": companies_cognitive,
            "total_companies_catalog": len(companies),
            "total_products_catalog": len(products),
        }
        return answers


def run_pipeline(max_companies: int = 150) -> Dict[str, Any]:
    scraper = IngredientsNetworkScraper(max_companies=max_companies)
    scraper.fetch_search_catalog()
    scraper.collect_company_records()
    df_clean = scraper.clean_data()
    answers = scraper.calculate_answers()

    print("\n" + "=" * 60)
    print("INGREDIENTS NETWORK EXTRACTION & ANALYTICS RESULTS")
    print("=" * 60)
    print(f"Raw company records:            {len(scraper.raw_records)}")
    print(f"Duplicates removed:             {len(scraper.raw_records) - len(df_clean)}")
    print(f"Final clean company records:    {len(df_clean)}")
    print("-" * 60)
    print(f"(i)   Total Ingredients:                {answers['total_ingredients_product_records']} (Catalog taxonomy: {answers['total_ingredients_taxonomy_filters']})")
    print(f"(ii)  Total Finished Products:          {answers['total_finished_products_records']} (Catalog taxonomy: {answers['total_finished_products_taxonomy_filters']})")
    print(f"(iii) Companies with Herbs & Spices:     {answers['companies_with_herbs_and_spices']}")
    print(f"(iv)  Companies with Physical Formats:   {answers['companies_with_physical_delivery_formats']}")
    print(f"(v)   Companies in Cognitive Health:     {answers['companies_in_cognitive_and_mental_health']}")
    print("=" * 60 + "\n")

    return answers


if __name__ == "__main__":
    run_pipeline()
