# Relu Consultancy Hiring Challenge: Data Extraction Engineer (FTE)

**Candidate Email**: `anujpjadhav5@gmail.com`  
**Role**: Data Extraction Engineer (Full-Time Employee)  
**Deliverable**: Production-Ready Automated Web Scraping & Analytic Pipeline  

---

## Executive Summary

This repository contains the complete, production-grade automated extraction and analytics solution for the Relu Consultancy Data Extraction Challenge, covering both required target objectives:

1. **Objective 1: Disney Cruise Line (`disneycruise.disney.go.com/en-in/`)**
   - Traversing **at least 35 pages** of cruise product listings as specified in the brief.
   - Extracting all required fields: Title, Ship, Departing From, Destination, Duration, Ports of Call, Booking Dates Count, Prices, Booking URL, and What's Included.
   - Performing robust deduplication (identifying and resolving 60 duplicate cruise products across pagination).
   - Programmatically answering all 5 Disney Cruise analytical questions.

2. **Objective 2: Ingredients Network (`www.ingredientsnetwork.com`)**
   - Programmatically querying the supplier and product catalog.
   - Concurrently extracting all 10 required company profile fields:
     1. Company Name
     2. Company Description
     3. Sales Markets
     4. Primary Business Activity
     5. Categories
     6. Events
     7. Address
     8. Email (including Cloudflare email protection decoding)
     9. Telephone
     10. Website
   - Validating 100% data completeness (0 null / empty values in all 10 required fields).
   - Programmatically answering all 5 Ingredients Network analytical questions.

---

## Directory Structure

```text
relu_data_extraction_challenge/
├── disney_cruise_scraper.py         # Production scraper & analyzer for Objective 1
├── ingredients_network_scraper.py    # Multi-threaded scraper & analyzer for Objective 2
├── main.py                          # Master execution & validation runner
├── requirements.txt                 # Pinned project dependencies
├── README.md                        # Technical documentation & results
├── output/
│   ├── disney_cruises.csv           # Cleaned, deduplicated Disney Cruise dataset (111 rows)
│   ├── disney_raw.csv               # Raw Disney Cruise pagination dataset (171 rows across 35 pages)
│   ├── ingredients_network.csv      # Cleaned, validated Ingredients Network dataset (150 rows)
│   └── ingredients_network_raw.csv  # Raw Ingredients Network supplier dataset (150 rows)
└── logs/
    └── scraper.log                  # Comprehensive execution logs
```

---

## Official Challenge Answers

### Objective 1: Disney Cruise Line

| # | Challenge Question | Result | Technical Explanation |
|---|--------------------|:------:|-----------------------|
| **(i)** | **How many total cruises are there for the Pacific as a destination? (count)** | **2** | The two Pacific Coast cruises are: <br>1. *4-Night Pacific Coast Cruise from San Diego ending in Vancouver*<br>2. *4-Night Pacific Coast Cruise from Vancouver ending in San Diego*. |
| **(ii)** | **How many total cruises are there?** | **111** *(Unique Cleaned)*<br>**171** *(Raw Across 35 Pages)* | Across all 35 pagination pages, the site renders 171 product cards. After deduplicating by unique `product_id` and canonical cruise route, exactly **111 unique cruises** remain. |
| **(iii)** | **How many holiday cruises are there?** | **26** | Disney Cruise Line brands its holiday cruises as **"Very Merrytime"** cruises. Exactly 26 unique Very Merrytime holiday itineraries are scheduled across the fleet. |
| **(iv)** | **How many Cruises offer more than 2 dates for booking?** | **48** | 48 of the 111 unique cruises (43.2%) have `booking_dates_count > 2` (e.g. 64 sailings for Singapore, 36 sailings for Bahamas from Port Canaveral). In the raw 35-page dataset, 85 cards offer >2 booking dates. |
| **(v)** | **How many cruises do Miami and London have as departure ports?** | **7** *(London via Southampton)*<br>**0** *(Strict literal "Miami" / "London")* | **Miami departures: 0.** (Disney Cruise Line relocated South Florida operations from PortMiami to Port Everglades / Fort Lauderdale, `PEF`).<br>**London departures: 7.** (London cruise departures are exclusively handled through Southampton port, `SOU`).<br>Combined: **0 + 7 = 7**. |

---

### Objective 2: Ingredients Network

| # | Challenge Question | Result | Technical Explanation |
|---|--------------------|:------:|-----------------------|
| **(i)** | **How many total ingredients are there? (count)** | **2,704** *(Product Records)*<br>**552** *(Taxonomy Filters)* | Verified via catalog taxonomy: 2,704 products are categorized under Ingredients, mapped across 552 granular ingredient category filters. |
| **(ii)** | **How many total finished products are there?** | **820** *(Product Records)*<br>**33** *(Taxonomy Filters)* | Verified via catalog taxonomy: 820 products are categorized under Finished Products, mapped across 33 finished product category filters. |
| **(iii)** | **How many companies have herbs and spices?** | **399** | Filter index `413` (*Herbs, Spices*) in the catalog bitmask matches exactly 399 suppliers. |
| **(iv)** | **How many companies have physical delivery formats?** | **764** | Filter index `649` (*Physical Formats: capsules, powders, liquids, tablets*) matches exactly 764 suppliers. |
| **(v)** | **How many companies are in Cognitive & Mental Health?** | **587** | Filter index `671` (*Cognitive & Mental Health*) matches exactly 587 suppliers. |

---

## Data Quality & Completeness Audit

| Metric | Target Standard | Disney Cruise Dataset | Ingredients Network Dataset |
|--------|:---------------:|:---------------------:|:---------------------------:|
| **Required Fields Populated** | 100% | **100% (0 empty fields)** | **100% (0 empty fields)** |
| **Duplicate Records in Final CSV** | 0% | **0 Duplicates** | **0 Duplicates** |
| **Total Rows (Clean)** | Complete | **111 rows** | **150 rows** |
| **Total Rows (Raw)** | Complete | **171 rows (35 pages)** | **150 rows** |
| **Encoding** | UTF-8 | UTF-8 | UTF-8 |

---

## Technical Architecture & Engineering Innovations

### 1. Reverse-Engineering Disney Cruise Line's Microservice Architecture
- **Challenge**: Navigating client-side Single Page Application (SPA) protected by Akamai Bot Manager and Queue-It token challenges.
- **Discovery**: In `dcl_spa_main.js`, the Angular client utilizes a private service gateway (`/dcl-apps-productavail-vas/`) backed by internal microservices (`prices/lowest/products`).
- **Bypass & Session Lifecycle**:
  1. Handshakes with regional endpoint `https://disneycruise.disney.go.com/en-in/` to acquire Edge cookies.
  2. Authenticates against `/dcl-apps-productavail-vas/authz/private` to obtain a session token.
  3. Uses internal header `x-bypass-product-avail-svc: true` with `page` parameter to extract all 35 pages of product cards with zero browser overhead and 100% deterministic reliability.

### 2. Ingredients Network Concurrent Extractor
- **Challenge**: The supplier profiles require dynamic contact extraction, schema parsing, and Cloudflare email de-obfuscation.
- **Solution**:
  1. Retrieves central catalog metadata containing company IDs, taxonomy bitmasks, and categories.
  2. Concurrently fetches individual company profiles and JSON payloads using `ThreadPoolExecutor`.
  3. Implements an automated Cloudflare XOR email decoder (`decode_cf_email`) to convert obfuscated hex strings into clean email addresses.
  4. Parses Schema.org `application/ld+json` graphs for structured organization addresses, phone numbers, and websites.

---

## Installation & Execution

### Prerequisites
- Python 3.10+
- Internet access

### Setup
```bash
cd /app/applet/relu_data_extraction_challenge
pip install -r requirements.txt
```

### Run Master Pipeline
```bash
# Run validation and analytics on existing datasets:
python3 main.py

# Or force a live crawl of both websites from scratch:
python3 main.py --crawl
```

### Run Individual Scrapers
```bash
# Run Disney Cruise scraper:
python3 disney_cruise_scraper.py

# Run Ingredients Network scraper:
python3 ingredients_network_scraper.py
```

---

## Terminal Verification Output

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
