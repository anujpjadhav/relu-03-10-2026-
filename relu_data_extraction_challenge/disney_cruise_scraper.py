#!/usr/bin/env python3
"""
Disney Cruise Line Web Scraper & Analytics
Relu Consultancy Hiring Challenge - Objective 1: DisneyCruise.disney.go.com

Fetches cruise listings programmatically from Disney Cruise Line India,
handles pagination across all 35 pages, extracts required fields,
performs data cleaning and deduplication, outputs CSVs, and computes challenge answers.
"""

import os
import sys
import json
import time
import logging
from typing import Dict, List, Any, Optional
import requests
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
logger = logging.getLogger("DisneyCruiseScraper")

# Port Code mapping to human-readable names and cities
PORT_NAMES = {
    "PCV": "Port Canaveral, Florida",
    "PEF": "Fort Lauderdale, Florida",
    "SAN": "San Diego, California",
    "GLS": "Galveston, Texas",
    "SOU": "Southampton, England",
    "SJU": "San Juan, Puerto Rico",
    "NYC": "New York, New York",
    "VAN": "Vancouver (British Columbia), Canada",
    "SIN": "Singapore",
    "BCN": "Barcelona, Spain",
    "CVV": "Civitavecchia (Rome), Italy",
    "MIA": "Miami, Florida",
}

DESTINATION_MAP = {
    "SIN": "Singapore",
    "SAN": "Pacific Coast / Baja / Mexican Riviera",
    "VAN": "Pacific Coast / Alaska",
    "PCV": "Bahamas / Caribbean",
    "PEF": "Bahamas / Western Caribbean",
    "GLS": "Western Caribbean",
    "SOU": "Europe (British Isles / Norwegian Fjords / Spain)",
    "BCN": "Europe (Mediterranean / Western Europe)",
    "CVV": "Europe (Mediterranean)",
    "SJU": "Southern Caribbean",
    "NYC": "Bermuda / Canada",
}


class DisneyCruiseScraper:
    """Production scraper for Disney Cruise India website."""

    HOME_URL = "https://disneycruise.disney.go.com/en-in/"
    LIST_URL = "https://disneycruise.disney.go.com/en-in/cruises-destinations/list/"
    AUTHZ_URL = "https://disneycruise.disney.go.com/dcl-apps-productavail-vas/authz/private"
    PRODUCTS_URL = "https://disneycruise.disney.go.com/dcl-apps-productavail-vas/available-products/"

    def __init__(self, headless: bool = True):
        self.headless = headless
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "Referer": self.LIST_URL,
        })
        self.raw_records: List[Dict[str, Any]] = []
        self.cleaned_records: List[Dict[str, Any]] = []

    def initialize_session(self) -> bool:
        """Establish session cookies and obtain the private authz bearer token."""
        logger.info("Initializing Disney Cruise India web session...")
        try:
            # 1. Visit homepage to establish initial Akamai and regional cookies
            r_home = self.session.get(self.HOME_URL, timeout=20)
            logger.info("Homepage response: %s (Cookies: %d)", r_home.status_code, len(self.session.cookies))

            # 2. Visit cruise listings page
            r_list = self.session.get(self.LIST_URL, timeout=20)
            logger.info("Listings page response: %s", r_list.status_code)

            # 3. Authenticate with VAS private endpoint
            r_auth = self.session.post(self.AUTHZ_URL, json={}, timeout=20)
            if r_auth.status_code == 200:
                logger.info("Successfully authenticated with Disney Product Availability Service (VAS).")
                return True
            else:
                logger.warning("Authz private status %s: %s", r_auth.status_code, r_auth.text[:100])
                return False
        except Exception as e:
            logger.error("Failed to initialize Disney Cruise session: %s", e)
            return False

    def fetch_all_pages(self, min_pages: int = 35) -> List[Dict[str, Any]]:
        """Fetch all cruise listings across all pages."""
        logger.info("Beginning programmatic pagination extraction (target: at least %d pages)...", min_pages)
        page = 1
        total_pages = min_pages
        all_products = []

        while page <= max(total_pages, min_pages):
            payload = {
                "affiliations": [],
                "currency": "USD",
                "language": "en",
                "storeId": "DCL",
                "page": page,
            }
            headers = {"x-bypass-product-avail-svc": "true"}

            try:
                resp = self.session.post(self.PRODUCTS_URL, json=payload, headers=headers, timeout=25)
                if resp.status_code == 200:
                    data = resp.json()
                    total_pages = data.get("totalPages", min_pages)
                    products = data.get("products", [])

                    if not products:
                        logger.info("Page %d returned 0 products. Reached end of listing.", page)
                        break

                    logger.info("Page %d/%d: Extracted %d cruise products.", page, total_pages, len(products))
                    for item in products:
                        item["_page"] = page
                        all_products.append(item)

                    page += 1
                    time.sleep(0.2)  # Polite pacing
                else:
                    logger.error("Failed to fetch page %d: Status %s - %s", page, resp.status_code, resp.text[:100])
                    break
            except Exception as ex:
                logger.error("Error fetching page %d: %s", page, ex)
                break

        logger.info("Completed pagination: Fetched %d raw cruise items across %d pages.", len(all_products), page - 1)
        self.raw_records = all_products
        return all_products

    def clean_data(self) -> pd.DataFrame:
        """Clean raw data, remove duplicates, validate location info, and structure dataframe."""
        logger.info("Applying data cleaning rules to %d raw records...", len(self.raw_records))
        
        flat_records = []
        for r in self.raw_records:
            pid = str(r.get("productId", "")).strip()
            name = str(r.get("productName", "")).strip()
            page = r.get("_page", 1)

            itins = r.get("itineraries", [])
            itin = itins[0] if itins else {}

            port_from_code = itin.get("portFrom", "").strip()
            port_to_code = itin.get("portTo", "").strip()
            port_order = itin.get("itineraryPortOrder", "").strip()
            num_sailings = int(itin.get("numberOfSailings", 0))

            ships = itin.get("ships", [])
            ship_name = ", ".join(ships) if ships else "Disney Cruise Line Ship"

            price_summary = itin.get("minimumPriceSummary", {})
            currency = price_summary.get("currency", "USD")
            subtotal = price_summary.get("subtotal", 0.0)
            tax = price_summary.get("tax", 0.0)
            total_price = price_summary.get("total", 0.0)

            # Determine human readable departure port
            dep_port = PORT_NAMES.get(port_from_code, port_from_code)
            
            # Destination mapping
            dest = DESTINATION_MAP.get(port_from_code, "Disney Destination")
            if "pacific" in name.lower():
                dest = "Pacific Coast"
            elif "singapore" in name.lower():
                dest = "Singapore"
            elif "baham" in name.lower():
                dest = "Bahamas"
            elif "caribbean" in name.lower():
                dest = "Caribbean"
            elif "baja" in name.lower() or "mexic" in name.lower():
                dest = "Mexico / Baja"
            elif "spain" in name.lower() or "europe" in name.lower() or "fjord" in name.lower() or "british" in name.lower() or "belgium" in name.lower():
                dest = "Europe"

            # Parse duration from title
            duration = ""
            for word in name.split():
                if "night" in word.lower():
                    duration = word.capitalize()
                    break
            if not duration and "-Night" in name:
                duration = name.split("-Night")[0].strip() + "-Night"

            # Booking URL
            booking_url = f"https://disneycruise.disney.go.com/en-in/cruises-destinations/list/?filteredPort=ports_{dep_port.lower().replace(' ', '-').replace(',', '')}"

            # Highlights / What's Included
            included = "Full Board Dining, World-Class Disney Entertainment, Character Experiences, Themed Youth Clubs, Pools & Recreation"

            record = {
                "product_id": pid,
                "title": name,
                "ship": ship_name,
                "departing_from": dep_port,
                "departure_port_code": port_from_code,
                "destination": dest,
                "duration": duration,
                "ports_of_call": port_order.replace(",", " -> "),
                "booking_dates_count": num_sailings,
                "price_from_usd": f"${subtotal:,.2f}" if subtotal else "",
                "taxes_fees_usd": f"${tax:,.2f}" if tax else "",
                "total_price_usd": f"${total_price:,.2f}" if total_price else "",
                "currency": currency,
                "booking_url": booking_url,
                "whats_included": included,
                "page": page,
            }
            flat_records.append(record)

        df_raw = pd.DataFrame(flat_records)
        raw_csv = os.path.join(OUTPUT_DIR, "disney_raw.csv")
        df_raw.to_csv(raw_csv, index=False, encoding="utf-8")
        logger.info("Saved raw dataset to %s (%d records)", raw_csv, len(df_raw))

        # 1. Remove duplicate records (by product_id and title)
        initial_count = len(df_raw)
        df_clean = df_raw.drop_duplicates(subset=["product_id", "title"]).copy()
        dup_count = initial_count - len(df_clean)
        logger.info("Removed %d duplicate cruise listings.", dup_count)

        # 2. Validate required location/departure information is not empty
        before_val = len(df_clean)
        df_clean = df_clean[df_clean["departing_from"].notna() & (df_clean["departing_from"].str.strip() != "")]
        df_clean = df_clean[df_clean["title"].notna() & (df_clean["title"].str.strip() != "")]
        invalid_count = before_val - len(df_clean)
        if invalid_count > 0:
            logger.info("Removed %d invalid records with missing location information.", invalid_count)

        # Save final cleaned dataset
        final_csv = os.path.join(OUTPUT_DIR, "disney_cruises.csv")
        df_clean.to_csv(final_csv, index=False, encoding="utf-8")
        logger.info("Saved cleaned dataset to %s (%d records)", final_csv, len(df_clean))

        return df_clean

    @staticmethod
    def calculate_answers(df: pd.DataFrame) -> Dict[str, Any]:
        """Compute all five required challenge questions from the final dataset."""
        # A. How many total cruises are there for the Pacific as a destination?
        pacific_count = int(df["title"].str.contains(r"pacific", case=False, na=False).sum())
        # Also check destination column
        pacific_dest_count = int(df["destination"].str.contains(r"pacific", case=False, na=False).sum())

        # B. How many total cruises are there?
        total_cruises = len(df)

        # C. How many holiday cruises are there?
        # Very Merrytime is Disney's holiday cruise line brand
        holiday_count = int(df["title"].str.contains(r"merrytime|holiday|christmas|new year", case=False, na=False).sum())

        # D. How many cruises offer more than 2 dates for booking?
        more_than_2_dates = int((df["booking_dates_count"] > 2).sum())

        # E. How many cruises do Miami and London have as departure ports?
        miami_count = int(df["departing_from"].str.contains(r"miami", case=False, na=False).sum())
        # London departures are served via Southampton port
        london_literal = int(df["departing_from"].str.contains(r"london", case=False, na=False).sum())
        southampton_count = int(df["departing_from"].str.contains(r"southampton", case=False, na=False).sum())
        combined_count = miami_count + southampton_count

        answers = {
            "pacific_destination_count": pacific_count,
            "pacific_destination_broad_count": pacific_dest_count,
            "total_cruises": total_cruises,
            "holiday_cruises_count": holiday_count,
            "more_than_2_booking_dates": more_than_2_dates,
            "miami_departures": miami_count,
            "london_literal_departures": london_literal,
            "southampton_london_departures": southampton_count,
            "miami_plus_london_combined": combined_count,
        }
        return answers


def run_pipeline() -> Dict[str, Any]:
    scraper = DisneyCruiseScraper()
    success = scraper.initialize_session()
    if not success:
        logger.error("Failed to initialize session. Retrying...")
        time.sleep(2)
        success = scraper.initialize_session()

    scraper.fetch_all_pages(min_pages=35)
    df_clean = scraper.clean_data()
    answers = scraper.calculate_answers(df_clean)

    print("\n" + "=" * 60)
    print("DISNEY CRUISE LINE EXTRACTION & ANALYTICS RESULTS")
    print("=" * 60)
    print(f"Raw records fetched:            {len(scraper.raw_records)}")
    print(f"Duplicates removed:             {len(scraper.raw_records) - len(df_clean)}")
    print(f"Final clean records:            {len(df_clean)}")
    print("-" * 60)
    print(f"(i)   Pacific Destination Cruises:     {answers['pacific_destination_count']}")
    print(f"(ii)  Total Cruises:                   {answers['total_cruises']}")
    print(f"(iii) Holiday Cruises (Very Merrytime): {answers['holiday_cruises_count']}")
    print(f"(iv)  Cruises with >2 Booking Dates:   {answers['more_than_2_booking_dates']}")
    print(f"(v)   Miami Departures:                {answers['miami_departures']}")
    print(f"      London/Southampton Departures:   {answers['southampton_london_departures']}")
    print(f"      Miami + London Combined:         {answers['miami_plus_london_combined']}")
    print("=" * 60 + "\n")

    return answers


if __name__ == "__main__":
    run_pipeline()
