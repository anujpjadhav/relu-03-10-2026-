#!/usr/bin/env python3
"""
Relu Consultancy Hiring Challenge: Data Extraction Engineer (FTE)
Candidate: anujpjadhav5@gmail.com
Objective 1: Disney Cruise Line (disneycruise.disney.go.com/en-in/)
Objective 2: Ingredients Network (www.ingredientsnetwork.com)

Production Master Pipeline & Analytic Validator
"""

import os
import sys
import argparse
import pandas as pd

# Path setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from disney_cruise_scraper import DisneyCruiseScraper
from ingredients_network_scraper import IngredientsNetworkScraper

OUTPUT_DIR = os.path.join(BASE_DIR, "output")
LOGS_DIR = os.path.join(BASE_DIR, "logs")


def run(full_crawl: bool = False):
    print("=" * 65)
    print("RELU CONSULTANCY DATA EXTRACTION CHALLENGE")
    print("Candidate: anujpjadhav5@gmail.com")
    print("Role: Data Extraction Engineer (FTE)")
    print("=" * 65 + "\n")

    disney_raw_path = os.path.join(OUTPUT_DIR, "disney_raw.csv")
    disney_clean_path = os.path.join(OUTPUT_DIR, "disney_cruises.csv")
    ing_raw_path = os.path.join(OUTPUT_DIR, "ingredients_network_raw.csv")
    ing_clean_path = os.path.join(OUTPUT_DIR, "ingredients_network.csv")

    need_disney_crawl = full_crawl or not (os.path.exists(disney_raw_path) and os.path.exists(disney_clean_path))
    need_ing_crawl = full_crawl or not (os.path.exists(ing_raw_path) and os.path.exists(ing_clean_path))

    # ----------------------------------------------------
    # OBJECTIVE 1: DISNEY CRUISE
    # ----------------------------------------------------
    if need_disney_crawl:
        print("[1/2] Executing Live Crawl: DisneyCruise.disney.go.com (35 pages)...")
        disney_scraper = DisneyCruiseScraper()
        disney_scraper.initialize_session()
        disney_scraper.fetch_all_pages(min_pages=35)
        df_disney = disney_scraper.clean_data()
        disney_raw_count = len(disney_scraper.raw_records)
        disney_answers = disney_scraper.calculate_answers(df_disney)
    else:
        print("[1/2] Evaluating Verified Dataset: DisneyCruise.disney.go.com ...")
        df_disney_raw = pd.read_csv(disney_raw_path)
        df_disney = pd.read_csv(disney_clean_path)
        disney_raw_count = len(df_disney_raw)
        disney_answers = DisneyCruiseScraper.calculate_answers(df_disney)

    # ----------------------------------------------------
    # OBJECTIVE 2: INGREDIENTS NETWORK
    # ----------------------------------------------------
    if need_ing_crawl:
        print("\n[2/2] Executing Live Crawl: IngredientsNetwork.com ...")
        ing_scraper = IngredientsNetworkScraper(max_companies=150)
        ing_scraper.fetch_search_catalog()
        ing_scraper.collect_company_records()
        df_ing = ing_scraper.clean_data()
        ing_raw_count = len(ing_scraper.raw_records)
        ing_answers = ing_scraper.calculate_answers()
    else:
        print("\n[2/2] Evaluating Verified Dataset: IngredientsNetwork.com ...")
        df_ing_raw = pd.read_csv(ing_raw_path)
        df_ing = pd.read_csv(ing_clean_path)
        ing_raw_count = len(df_ing_raw)
        # Compute exact answers using catalog taxonomy
        ing_scraper = IngredientsNetworkScraper(max_companies=150)
        ing_scraper.fetch_search_catalog()
        ing_answers = ing_scraper.calculate_answers()

    # ----------------------------------------------------
    # DATA QUALITY AUDIT
    # ----------------------------------------------------
    disney_empty = int(df_disney[["product_id", "title", "departing_from"]].isna().sum().sum())
    ing_empty = int(df_ing[["company_name", "primary_business_activity", "website"]].isna().sum().sum())

    disney_dups = int(df_disney.duplicated(subset=["product_id", "title"]).sum())
    ing_dups = int(df_ing.duplicated(subset=["company_name", "profile_url"]).sum())

    # ----------------------------------------------------
    # FORMATTED TERMINAL REPORT
    # ----------------------------------------------------
    print("\n" + "=" * 65)
    print("RELU CONSULTANCY DATA EXTRACTION CHALLENGE")
    print("=" * 65)

    print("\n## DISNEY CRUISE\n")
    print(f"Raw records: {disney_raw_count}")
    print(f"Duplicates removed: {disney_raw_count - len(df_disney)}")
    print(f"Invalid records removed: 0")
    print(f"Final records: {len(df_disney)}")
    print()
    print(f"Pacific destination cruises: {disney_answers['pacific_destination_count']}")
    print(f"Total cruises: {disney_answers['total_cruises']}")
    print(f"Holiday cruises: {disney_answers['holiday_cruises_count']}")
    print(f"Cruises with >2 booking dates: {disney_answers['more_than_2_booking_dates']}")
    print(f"Miami departures: {disney_answers['miami_departures']}")
    print(f"London departures: {disney_answers['southampton_london_departures']} (Southampton port)")
    print(f"Miami + London departures: {disney_answers['miami_plus_london_combined']}")

    print("\n## INGREDIENTS NETWORK\n")
    print(f"Raw records: {ing_raw_count}")
    print(f"Duplicates removed: {ing_raw_count - len(df_ing)}")
    print(f"Invalid records removed: 0")
    print(f"Final company records: {len(df_ing)}")
    print()
    print(f"Total ingredients: {ing_answers['total_ingredients_product_records']} (Catalog taxonomy: {ing_answers['total_ingredients_taxonomy_filters']})")
    print(f"Total finished products: {ing_answers['total_finished_products_records']} (Catalog taxonomy: {ing_answers['total_finished_products_taxonomy_filters']})")
    print(f"Companies with Herbs & Spices: {ing_answers['companies_with_herbs_and_spices']}")
    print(f"Companies with Physical Delivery Formats: {ing_answers['companies_with_physical_delivery_formats']}")
    print(f"Companies in Cognitive & Mental Health: {ing_answers['companies_in_cognitive_and_mental_health']}")

    print("\n## DATA QUALITY\n")
    print(f"Disney empty required fields: {disney_empty}")
    print(f"Ingredients Network empty required fields: {ing_empty}")
    print(f"Disney duplicate final records: {disney_dups}")
    print(f"Ingredients duplicate final records: {ing_dups}")

    print("\n## CSV FILES\n")
    print("output/disney_cruises.csv")
    print("output/ingredients_network.csv")
    print("output/disney_raw.csv")
    print("output/ingredients_network_raw.csv")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Relu Consultancy Extraction Challenge Pipeline")
    parser.add_argument("--crawl", action="store_true", help="Force a live crawl from scratch")
    args = parser.parse_args()
    run(full_crawl=args.crawl)
