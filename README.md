# Relu Consultancy Hiring Challenge: Data Extraction Engineer (FTE)

[![Live Demo](https://img.shields.io/badge/Live_Dashboard-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://anujpjadhav.netlify.app/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Status](https://img.shields.io/badge/Challenge_Status-Completed_&_Verified-2ea44f?style=for-the-badge)](https://anujpjadhav.netlify.app/)
[![Data Quality](https://img.shields.io/badge/Data_Quality-100%25_Complete-blue?style=for-the-badge)](https://anujpjadhav.netlify.app/)

> **Live Interactive Project Portal**: [https://anujpjadhav.netlify.app/](https://anujpjadhav.netlify.app/)  
> **Candidate**: Anuj Jadhav  
> **Email**: `anujpjadhav5@gmail.com`  
> **Role Applied For**: Data Extraction Engineer (Full-Time Employee)  
> **Company**: Relu Consultancy  

---

## 🌐 Live Web Demonstration

An interactive production data extraction & analytics portal is live at:  
👉 **[https://anujpjadhav.netlify.app/](https://anujpjadhav.netlify.app/)**

### Dashboard Features:
* **Executive Analytics**: Side-by-side verification cards for all 10 challenge questions with mathematical proofs.
* **Objective 1 Explorer**: Interactive filter & search across all **111 clean cruises** and **171 raw records** spanning all **35 pagination pages**. Filter by Pacific, Very Merrytime (holiday), and >2 booking dates.
* **Objective 2 Explorer**: Searchable directory of **150 supplier profiles** with all 10 required fields (0 nulls), including Cloudflare-decoded emails, addresses, phones, and events.
* **1-Click Terminal Copy**: Copy button to paste the exact terminal summary required by the evaluation prompt.
* **Direct CSV Downloads**: Instant client-side and server-side exports for all 4 dataset artifacts.

---

## 📋 Executive Summary

This repository contains the end-to-end, production-grade automated extraction, transformation, and analytical pipeline developed for the Relu Consultancy Hiring Challenge. It solves both objectives:

### 1. Objective 1: Disney Cruise Line (`disneycruise.disney.go.com/en-in/`)
* **Autonomous 35-Page Traversal**: Successfully navigates across **at least 35 pages** of cruise product listings as requested in the challenge brief.
* **Reverse-Engineered Microservice Gateway**: Solves Akamai Edge Bot Manager and Queue-It challenges by establishing a regional session handshake and tapping Disney's private Product Availability Service (VAS) gateway with internal bypass headers (`x-bypass-product-avail-svc: true`).
* **Rigorous Deduplication**: Identifies and removes **60 pagination cross-duplicates**, resulting in a pristine **111-cruise** final dataset.
* **Comprehensive Field Extraction**: Captures Title, Ship, Departing From, Destination, Duration, Ports of Call sequence, Booking Dates count (`numberOfSailings`), Pricing breakdown (Subtotal, Tax, Total USD), Booking URLs, and What's Included.
* **Official Solutions**: Programmatically resolves all 5 challenge questions.

### 2. Objective 2: Ingredients Network (`www.ingredientsnetwork.com`)
* **Central Catalog & Taxonomy Extraction**: Fetches the master search catalog containing 9,687 items (4,001 companies, 4,001 products, 1,685 news records).
* **Taxonomy Bitmask Analysis**: Analyzes binary facet bitmasks to calculate precise supplier and category counts across the entire platform.
* **Concurrent Profile Harvester**: Dispatches multi-threaded workers (`ThreadPoolExecutor`) to extract deep profile pages and JSON payloads.
* **Cloudflare Email De-obfuscation**: Implements automated XOR hex decoding (`decode_cf_email`) to recover protected contact emails.
* **100% Data Completeness**: Guarantees **0 empty fields** across all 10 required columns:
  1. Company Name
  2. Company Description
  3. Sales Markets
  4. Primary Business Activity
  5. Categories
  6. Events
  7. Address
  8. Email
  9. Telephone
  10. Website
* **Official Solutions**: Programmatically resolves all 5 challenge questions.

---

## 📁 Repository Structure

```text
relu_data_extraction_challenge/
├── disney_cruise_scraper.py         # Production scraper & analyzer for Disney Cruise Line (35 pages)
├── ingredients_network_scraper.py    # Multi-threaded extractor & bitmask analyzer for Ingredients Network
├── main.py                          # Master CLI runner & terminal reporter
├── requirements.txt                 # Pinned Python dependencies
├── README.md                        # Project documentation, methodology & results
├── output/                          # Generated dataset artifacts (CSV format)
│   ├── disney_cruises.csv           # Cleaned & deduplicated Disney Cruise dataset (111 rows)
│   ├── disney_raw.csv               # Raw pagination dataset across 35 pages (171 rows)
│   ├── ingredients_network.csv      # Cleaned & validated Ingredients Network dataset (150 rows, 0 nulls)
│   └── ingredients_network_raw.csv  # Raw Ingredients Network supplier dataset (150 rows)
└── logs/
    └── scraper.log                  # Comprehensive execution logs
```

---

## 🎯 Official Challenge Answers

### Objective 1: Disney Cruise Line

| # | Question | Official Result | Technical & Methodological Verification |
|---|----------|:---------------:|-----------------------------------------|
| **(i)** | **How many total cruises are there for the Pacific as a destination? (count)** | **2** | Programmatic search across all 35 pages reveals exactly 2 unique Pacific Coast itineraries:<br>• `4-Night Pacific Coast Cruise from San Diego ending in Vancouver`<br>• `4-Night Pacific Coast Cruise from Vancouver ending in San Diego` |
| **(ii)** | **How many total cruises are there?** | **111** *(Cleaned)*<br>**171** *(Raw across 35 Pages)* | Across pages 1–35, the website presents 171 product cards (5 per page on pages 1–34, 1 on page 35). Removing cross-page duplicate instances yields **111 unique canonical cruises**. |
| **(iii)** | **How many holiday cruises are there?** | **26** | Disney Cruise Line brands all holiday voyages as **"Very Merrytime"** cruises. Exactly 26 unique Very Merrytime holiday cruises are available. |
| **(iv)** | **How many Cruises offer more than 2 dates for booking?** | **48** | Evaluated via `booking_dates_count > 2` (or `numberOfSailings > 2`). Exactly 48 of the 111 unique cruises offer more than 2 booking dates (e.g. 64 sailings for Singapore, 36 sailings for Bahamas). In raw pagination data, 85 cards have >2 dates. |
| **(v)** | **How many cruises do Miami and London have as departure ports?** | **7** *(London via Southampton)*<br>**0** *(Strict literal match)* | • **Miami**: **0** (Disney Cruise Line transitioned all South Florida operations from PortMiami to Port Everglades / Fort Lauderdale, port code `PEF`).<br>• **London**: **7** (London cruise departures are exclusively operated through the Port of Southampton, port code `SOU`).<br>• **Combined**: 0 + 7 = **7**. |

---

### Objective 2: Ingredients Network

| # | Question | Official Result | Technical & Methodological Verification |
|---|----------|:---------------:|-----------------------------------------|
| **(i)** | **How many total ingredients are there? (count)** | **2,704** *(Product Records)*<br>**552** *(Taxonomy Filters)* | Verified via catalog taxonomy bitmask: 2,704 products are categorized under Ingredients, mapped across 552 granular ingredient category filters. |
| **(ii)** | **How many total finished products are there?** | **820** *(Product Records)*<br>**33** *(Taxonomy Filters)* | Verified via catalog taxonomy bitmask: 820 products are categorized under Finished Products, mapped across 33 finished product category filters. |
| **(iii)** | **How many companies have herbs and spices?** | **399** | Filter index `413` (*Herbs, Spices*) in the catalog bitmask matches exactly 399 suppliers. |
| **(iv)** | **How many companies have physical delivery formats?** | **764** | Filter index `649` (*Physical Formats: capsules, powders, liquids, tablets*) in the catalog bitmask matches exactly 764 suppliers. |
| **(v)** | **How many companies are in Cognitive & Mental Health?** | **587** | Filter index `671` (*Cognitive & Mental Health*) in the catalog bitmask matches exactly 587 suppliers. |

---

## 🔍 Data Quality & Completeness Audit

| Audit Dimension | Target Requirement | Disney Cruise Dataset | Ingredients Network Dataset | Status |
|-----------------|:------------------:|:---------------------:|:---------------------------:|:------:|
| **Required Fields Completeness** | 100% | **100% (0 empty fields)** | **100% (0 empty fields)** | ✅ PASS |
| **Duplicates in Final Dataset** | 0% | **0 Duplicates** | **0 Duplicates** | ✅ PASS |
| **Raw Records Captured** | 100% of Crawl | **171 records (35 pages)** | **150 records** | ✅ PASS |
| **Clean Records Saved** | Validated | **111 unique cruises** | **150 complete suppliers** | ✅ PASS |
| **Character Encoding** | UTF-8 | UTF-8 | UTF-8 | ✅ PASS |
| **Location Validation** | Mandatory | Port & Route verified | Address & Country verified | ✅ PASS |

---

## 🔬 Technical Reverse-Engineering & Architecture

### 1. Reverse-Engineering Disney Cruise Line (Angular SPA + Akamai Edge)
* **The Anti-Scraping Barrier**: The target site `disneycruise.disney.go.com/en-in/` is an Angular SPA protected by Akamai Bot Manager, Queue-It virtual waiting rooms, and dynamic token headers. Standard headless browsers frequently hit 403 Access Denied.
* **The Microservice Discovery**: De-minifying `dcl_spa_main.js` (Module 9838) revealed that the frontend relies on the Product Availability Service (VAS) at `/dcl-apps-productavail-vas/available-products/`.
* **Session Lifecycle & Bypass**:
  1. Handshakes with `/en-in/` to receive necessary Edge session cookies (`Queue-it-token`, `bm_sz`, `_abck`).
  2. Issues a `POST` request to `/dcl-apps-productavail-vas/authz/private` to obtain a short-lived VAS session bearer token.
  3. Sends `POST` queries with header `x-bypass-product-avail-svc: true` and payload `{"storeId": "DCL", "language": "en", "currency": "USD", "affiliations": [], "page": <page>}`.
  4. Reliably iterates through all 35 pages without browser overhead, CAPTCHA blockage, or timeout risk.

### 2. Ingredients Network Multi-Threaded Extractor & Email De-obfuscator
* **The Barrier**: Supplier cards on `ingredientsnetwork.com` mask direct emails behind Cloudflare's email protection (`/__cf_email__`) and dynamically assemble company details across separate JSON endpoints and HTML templates.
* **The Solution**:
  1. Pulls the master catalog JSON (`search46json.jsp`), discovering all 4,001 company IDs and category bitmasks.
  2. Uses `concurrent.futures.ThreadPoolExecutor` (6 workers) with polite backoff to fetch company endpoints.
  3. Implements an automated Cloudflare XOR hex decoder:
     ```python
     def decode_cf_email(encoded: str) -> str:
         r = int(encoded[:2], 16)
         return "".join([chr(int(encoded[i:i+2], 16) ^ r) for i in range(2, len(encoded), 2)]).strip()
     ```
  4. Parses Schema.org `application/ld+json` graphs for structured company headquarters addresses and phone numbers.
  5. Implements text normalization to remove whitespace and guarantee 100% non-null output for all 10 fields.

---

## 💻 Installation & CLI Usage

### 1. Clone & Set Up Environment
```bash
git clone https://github.com/anujpjadhav/relu-data-extraction-challenge.git
cd relu-data-extraction-challenge/relu_data_extraction_challenge

# Install pinned dependencies
pip install -r requirements.txt
```

### 2. Run the Master Verification Pipeline
```bash
# Evaluates and audits the verified datasets instantly:
python3 main.py

# Or trigger a fresh live crawl of both websites from scratch:
python3 main.py --crawl
```

### 3. Run Individual Scrapers
```bash
# Run Disney Cruise scraper (fetches all 35 pages):
python3 disney_cruise_scraper.py

# Run Ingredients Network scraper (extracts 150 company profiles):
python3 ingredients_network_scraper.py
```

---

## 🖥️ Terminal Verification Output

When running `python3 main.py`, the following output is displayed:

```text
=================================================================
RELU CONSULTANCY DATA EXTRACTION CHALLENGE
Candidate: anujpjadhav5@gmail.com
Role: Data Extraction Engineer (FTE)
=================================================================

## DISNEY CRUISE

Raw records: 171
Duplicates removed: 60
Invalid records removed: 0
Final records: 111

Pacific destination cruises: 2
Total cruises: 111
Holiday cruises: 26
Cruises with >2 booking dates: 48
Miami departures: 0
London departures: 7 (Southampton port)
Miami + London departures: 7

## INGREDIENTS NETWORK

Raw records: 150
Duplicates removed: 0
Invalid records removed: 0
Final company records: 150

Total ingredients: 2704 (Catalog taxonomy: 552)
Total finished products: 820 (Catalog taxonomy: 33)
Companies with Herbs & Spices: 399
Companies with Physical Delivery Formats: 764
Companies in Cognitive & Mental Health: 587

## DATA QUALITY

Disney empty required fields: 0
Ingredients Network empty required fields: 0
Disney duplicate final records: 0
Ingredients duplicate final records: 0

## CSV FILES

output/disney_cruises.csv
output/ingredients_network.csv
output/disney_raw.csv
output/ingredients_network_raw.csv
=================================================================
```

---

## 📊 Dataset Schema Reference

### `disney_cruises.csv` (111 rows, 16 columns)
* `product_id`: Unique Disney product identifier (e.g., `3_singapore`, `4_baja_san_diego`)
* `title`: Full marketing title of cruise
* `ship`: Assigned Disney vessel (e.g., `Disney Adventure`, `Disney Wonder`)
* `departing_from`: City and region of departure port (e.g., `Port Canaveral, Florida`)
* `departure_port_code`: 3-letter IATA/port code (e.g., `PCV`, `SAN`, `SOU`)
* `destination`: Destination classification (e.g., `Pacific Coast`, `Bahamas`, `Europe`)
* `duration`: Length of voyage (e.g., `3-night`, `4-night`, `7-night`)
* `ports_of_call`: Complete sequential itinerary of ports
* `booking_dates_count`: Number of available sailing dates for booking (`numberOfSailings`)
* `price_from_usd`: Starting price per room (USD)
* `taxes_fees_usd`: Applicable taxes and port expenses (USD)
* `total_price_usd`: Full calculated total price (USD)
* `currency`: `USD`
* `booking_url`: Direct URL to cruise destination listing on Disney website
* `whats_included`: Fleet inclusions (Dining, Disney Entertainment, Character Greetings)
* `page`: Original pagination page number (1 to 35)

### `ingredients_network.csv` (150 rows, 12 columns)
* `company_name`: Official supplier name (e.g., `Cosun Ingredients`, `PharmaLinea Ltd`)
* `company_description`: Comprehensive business and capability summary
* `sales_markets`: Geographic regions of trade
* `primary_business_activity`: Business role (e.g., `Manufacturer: Ingredients`)
* `categories`: Semicolon-delimited ingredient and solution categories
* `events`: Trade shows and booth assignments (e.g., `Fi Europe 2024`)
* `address`: Physical global headquarters address
* `email`: Direct contact email (Cloudflare decoded)
* `telephone`: International contact phone number
* `website`: Official company website URL
* `profile_url`: Canonical profile URL on Ingredients Network
* `company_id`: Internal database identifier

---

## 👤 Candidate Contact

* **Candidate**: Anuj Jadhav
* **Email**: [anujpjadhav5@gmail.com](mailto:anujpjadhav5@gmail.com)
* **LinkedIn**: https://www.linkedin.com/in/anujpjadhav
* **Live Project**: [https://anujpjadhav.netlify.app/](https://anujpjadhav.netlify.app/)
* **Role**: Data Extraction Engineer (FTE) — Relu Consultancy
