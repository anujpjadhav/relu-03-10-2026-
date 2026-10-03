import React, { useState, useMemo } from 'react';
import {
  Ship,
  Sparkles,
  Search,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Terminal,
  ShieldCheck,
  Calendar,
  MapPin,
  DollarSign,
  Building2,
  Mail,
  Phone,
  Globe,
  Tag,
  Layers,
  Award,
  Filter,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

import disneyCruisesData from './data/disney_cruises.json';
import disneyRawData from './data/disney_raw.json';
import ingredientsData from './data/ingredients_network.json';
import ingredientsRawData from './data/ingredients_network_raw.json';
import summaryData from './data/challenge_summary.json';

type TabType = 'overview' | 'disney' | 'ingredients' | 'architecture' | 'logs';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [disneyViewMode, setDisneyViewMode] = useState<'clean' | 'raw'>('clean');
  const [disneySearch, setDisneySearch] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<string>('all');
  const [holidayOnly, setHolidayOnly] = useState(false);
  const [moreThanTwoDatesOnly, setMoreThanTwoDatesOnly] = useState(false);
  const [disneyLayout, setDisneyLayout] = useState<'cards' | 'table'>('cards');

  const [ingSearch, setIngSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  // Filtered Disney Cruises
  const currentDisneyList = disneyViewMode === 'clean' ? disneyCruisesData : disneyRawData;
  const filteredDisney = useMemo(() => {
    return currentDisneyList.filter((item: any) => {
      const matchesSearch =
        item.title.toLowerCase().includes(disneySearch.toLowerCase()) ||
        item.ship.toLowerCase().includes(disneySearch.toLowerCase()) ||
        item.departing_from.toLowerCase().includes(disneySearch.toLowerCase());

      const matchesDest =
        selectedDestination === 'all' ||
        item.destination.toLowerCase().includes(selectedDestination.toLowerCase());

      const matchesHoliday = !holidayOnly || item.title.toLowerCase().includes('merrytime');
      const matchesDates = !moreThanTwoDatesOnly || Number(item.booking_dates_count) > 2;

      return matchesSearch && matchesDest && matchesHoliday && matchesDates;
    });
  }, [currentDisneyList, disneySearch, selectedDestination, holidayOnly, moreThanTwoDatesOnly]);

  // Filtered Ingredients Companies
  const filteredIngredients = useMemo(() => {
    return ingredientsData.filter((item: any) => {
      const matchesSearch =
        item.company_name.toLowerCase().includes(ingSearch.toLowerCase()) ||
        item.company_description.toLowerCase().includes(ingSearch.toLowerCase()) ||
        item.primary_business_activity.toLowerCase().includes(ingSearch.toLowerCase()) ||
        item.categories.toLowerCase().includes(ingSearch.toLowerCase()) ||
        item.sales_markets.toLowerCase().includes(ingSearch.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' ||
        item.categories.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [ingSearch, selectedCategory]);

  const copyTerminalOutput = () => {
    const text = `=================================================================
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
=================================================================`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadCSV = (filename: string, data: any[]) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Relu Consultancy</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Data Extraction Challenge
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Candidate: <span className="text-slate-200 font-medium">Anuj Jadhav</span> (anujpjadhav5@gmail.com)
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={copyTerminalOutput}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              {copied ? 'Copied Terminal Format!' : 'Copy Terminal Summary'}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Quality Verified
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-3 flex border-b border-slate-800/80 space-x-1">
          {[
            { id: 'overview', label: 'Official Answers & Executive Summary', icon: Award },
            { id: 'disney', label: 'Objective 1: Disney Cruise Line (35 Pages)', icon: Ship },
            { id: 'ingredients', label: 'Objective 2: Ingredients Network (150 Profiles)', icon: Building2 },
            { id: 'architecture', label: 'Reverse Engineering & Architecture', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                  active
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW & OFFICIAL ANSWERS */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Disney Cruises</span>
                  <Ship className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">111</span>
                  <span className="text-xs text-slate-400">clean (171 raw)</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">35 Pages Scraped • 60 Duplicates Removed</p>
                <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5">
                  <Ship className="w-24 h-24 text-white" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Ingredients Network</span>
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">150</span>
                  <span className="text-xs text-slate-400">suppliers</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">10/10 Required Fields (100% Complete)</p>
                <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5">
                  <Building2 className="w-24 h-24 text-white" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Total Ingredients</span>
                  <Tag className="w-5 h-5 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">2,704</span>
                  <span className="text-xs text-slate-400">products</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">552 Taxonomy Category Filters</p>
                <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5">
                  <Tag className="w-24 h-24 text-white" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Data Quality Score</span>
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400">100%</span>
                  <span className="text-xs text-slate-400">0 nulls</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Zero Duplicates in Final Output</p>
                <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5">
                  <ShieldCheck className="w-24 h-24 text-white" />
                </div>
              </div>
            </div>

            {/* Questions & Solutions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Disney Cruise Questions */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Ship className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-base font-bold text-white">Objective 1: Disney Cruise Line Answers</h2>
                  </div>
                  <button
                    onClick={() => downloadCSV('disney_cruises.csv', disneyCruisesData)}
                    className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV (111 rows)
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      q: 'Q(i): How many total cruises are there for the Pacific as a destination?',
                      ans: '2 Cruises',
                      detail:
                        '1. 4-Night Pacific Coast Cruise from San Diego ending in Vancouver\n2. 4-Night Pacific Coast Cruise from Vancouver ending in San Diego'
                    },
                    {
                      q: 'Q(ii): How many total cruises are there?',
                      ans: '111 Unique Cruises (171 Raw across 35 Pages)',
                      detail:
                        'Pages 1–34 have 5 products each, Page 35 has 1 product (171 raw). Removing pagination cross-duplications yields exactly 111 canonical cruises.'
                    },
                    {
                      q: 'Q(iii): How many holiday cruises are there?',
                      ans: '26 Holiday Cruises',
                      detail:
                        'Disney Cruise Line brands all holiday voyages as "Very Merrytime" cruises. Exactly 26 unique Very Merrytime itineraries are offered.'
                    },
                    {
                      q: 'Q(iv): How many Cruises offer more than 2 dates for booking?',
                      ans: '48 Cruises',
                      detail:
                        '48 of the 111 unique cruises offer >2 booking dates (e.g., 64 dates for Singapore, 36 dates for Bahamas). In raw data, 85 cards have >2 dates.'
                    },
                    {
                      q: 'Q(v): How many cruises do Miami and London have as departure ports?',
                      ans: '7 (London via Southampton) | 0 (Strict Literal)',
                      detail:
                        'Miami: 0 (DCL relocated South Florida operations to Port Everglades / Fort Lauderdale). London: 7 (Operated exclusively via Southampton port SOU). Combined: 0 + 7 = 7.'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-300 leading-snug">{item.q}</span>
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
                          {item.ans}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono whitespace-pre-line leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredients Network Questions */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-base font-bold text-white">Objective 2: Ingredients Network Answers</h2>
                  </div>
                  <button
                    onClick={() => downloadCSV('ingredients_network.csv', ingredientsData)}
                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV (150 rows)
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      q: 'Q(i): How many total ingredients are there? (count)',
                      ans: '2,704 Products (552 Category Filters)',
                      detail:
                        'Verified via central catalog taxonomy: 2,704 products are categorized under Ingredients, mapped across 552 granular category filters.'
                    },
                    {
                      q: 'Q(ii): How many total finished products are there?',
                      ans: '820 Products (33 Category Filters)',
                      detail:
                        'Verified via central catalog taxonomy: 820 products are categorized under Finished Products, mapped across 33 finished product category filters.'
                    },
                    {
                      q: 'Q(iii): How many companies have herbs and spices?',
                      ans: '399 Companies',
                      detail: 'Filter index 413 (Herbs, Spices) in the catalog bitmask matches exactly 399 verified suppliers.'
                    },
                    {
                      q: 'Q(iv): How many companies have physical delivery formats?',
                      ans: '764 Companies',
                      detail:
                        'Filter index 649 (Physical Formats: capsules, powders, liquids, tablets) matches exactly 764 verified suppliers.'
                    },
                    {
                      q: 'Q(v): How many companies are in Cognitive & Mental Health?',
                      ans: '587 Companies',
                      detail:
                        'Filter index 671 (Cognitive & Mental Health) in the catalog bitmask matches exactly 587 verified suppliers.'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-300 leading-snug">{item.q}</span>
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                          {item.ans}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono whitespace-pre-line leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Official Formatted Terminal Output Container */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold text-sm text-white">Live Automated Pipeline Output (Standard Console Format)</span>
                </div>
                <button
                  onClick={copyTerminalOutput}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>

              <div className="bg-black/90 rounded-lg p-4 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto border border-slate-800 shadow-inner">
                <pre>{`=================================================================
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
=================================================================`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: DISNEY CRUISE LINE EXPLORER */}
        {/* ============================================================== */}
        {activeTab === 'disney' && (
          <div className="space-y-5">
            {/* Header & Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-white">Disney Cruise Line Dataset Explorer</h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/30">
                    35 Pages Scraped
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Extracted from <code className="text-cyan-300">disneycruise.disney.go.com/en-in/</code> with itinerary, ship, duration, pricing, and sailings count.
                </p>
              </div>

              {/* View Switcher & CSV Download */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center">
                  <button
                    onClick={() => setDisneyViewMode('clean')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                      disneyViewMode === 'clean' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cleaned (111)
                  </button>
                  <button
                    onClick={() => setDisneyViewMode('raw')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                      disneyViewMode === 'raw' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Raw (171)
                  </button>
                </div>

                <button
                  onClick={() => downloadCSV(disneyViewMode === 'clean' ? 'disney_cruises.csv' : 'disney_raw.csv', currentDisneyList)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  Download CSV
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search cruise name, ship, port..."
                  value={disneySearch}
                  onChange={(e) => setDisneySearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Destination Filter */}
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Destinations</option>
                <option value="pacific">Pacific Coast (Q1)</option>
                <option value="singapore">Singapore</option>
                <option value="bahamas">Bahamas</option>
                <option value="caribbean">Caribbean</option>
                <option value="mexico">Mexico / Baja</option>
                <option value="europe">Europe / UK</option>
              </select>

              {/* Toggle Holiday */}
              <button
                onClick={() => setHolidayOnly(!holidayOnly)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  holidayOnly
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                🎄 Holiday / Merrytime ({summaryData.disney.holiday_cruises})
              </button>

              {/* Toggle >2 Dates */}
              <button
                onClick={() => setMoreThanTwoDatesOnly(!moreThanTwoDatesOnly)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  moreThanTwoDatesOnly
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                📅 &gt; 2 Booking Dates ({summaryData.disney.cruises_with_more_than_2_dates})
              </button>

              <span className="text-xs text-slate-400 ml-auto">
                Showing <strong className="text-white">{filteredDisney.length}</strong> cruises
              </span>
            </div>

            {/* Cruises Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDisney.map((cruise: any, idx: number) => {
                const isPacific = cruise.title.toLowerCase().includes('pacific');
                const isHoliday = cruise.title.toLowerCase().includes('merrytime');
                const isMultiDate = Number(cruise.booking_dates_count) > 2;

                return (
                  <div
                    key={`${cruise.product_id}-${idx}`}
                    className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between transition hover:border-slate-700 shadow-sm ${
                      isPacific ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-slate-800'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded font-semibold bg-slate-800 text-slate-300">
                          {cruise.ship}
                        </span>
                        <span className="px-2 py-0.5 rounded font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {cruise.duration || 'Cruise'}
                        </span>
                        {isPacific && (
                          <span className="px-2 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            ★ PACIFIC (Q1)
                          </span>
                        )}
                        {isHoliday && (
                          <span className="px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            🎄 Merrytime (Q3)
                          </span>
                        )}
                        {cruise.page && (
                          <span className="text-[10px] text-slate-500 ml-auto">Pg {cruise.page}</span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm text-white leading-snug">{cruise.title}</h3>

                      {/* Details */}
                      <div className="space-y-1.5 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            From: <strong className="text-slate-200">{cruise.departing_from}</strong>
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <CompassIcon className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span className="text-[11px] font-mono text-slate-400 truncate">
                            {cruise.ports_of_call}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Pricing & Action */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">Price From</div>
                        <div className="text-sm font-extrabold text-emerald-400">
                          {cruise.total_price_usd || cruise.price_from_usd || 'Contact DCL'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded font-bold ${
                            isMultiDate
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cruise.booking_dates_count} Dates
                        </span>
                        <a
                          href={cruise.booking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="View on Disney Cruise Line"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: INGREDIENTS NETWORK EXPLORER */}
        {/* ============================================================== */}
        {activeTab === 'ingredients' && (
          <div className="space-y-5">
            {/* Header & Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">Ingredients Network Supplier Profiles</h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
                    10/10 Required Fields
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Full company profiles extracted with de-obfuscated Cloudflare emails, addresses, phones, events, and categories.
                </p>
              </div>

              <button
                onClick={() => downloadCSV('ingredients_network.csv', ingredientsData)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Download CSV (150 Profiles)
              </button>
            </div>

            {/* Search Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search company name, category, sales markets, activity..."
                  value={ingSearch}
                  onChange={(e) => setIngSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <span className="text-xs text-slate-400 ml-auto">
                Showing <strong className="text-white">{filteredIngredients.length}</strong> suppliers
              </span>
            </div>

            {/* Company Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIngredients.map((comp: any, idx: number) => {
                const isExpanded = selectedCompanyId === comp.company_id || selectedCompanyId === comp.company_name;

                return (
                  <div
                    key={`${comp.company_id}-${idx}`}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-sm"
                  >
                    <div className="space-y-3">
                      {/* Name & Activity */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-white leading-snug">{comp.company_name}</h3>
                          {comp.website && comp.website.startsWith('http') && (
                            <a
                              href={comp.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-emerald-400 p-1"
                              title="Visit Website"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {comp.primary_business_activity}
                        </div>
                      </div>

                      {/* Description snippet */}
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {comp.company_description}
                      </p>

                      {/* Contact Fields Summary */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                        {comp.email && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="font-mono text-cyan-400 truncate">{comp.email}</span>
                          </div>
                        )}
                        {comp.telephone && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="text-slate-300 truncate">{comp.telephone}</span>
                          </div>
                        )}
                        {comp.address && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="text-slate-400 truncate">{comp.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Sales Markets:
                            </span>
                            <p className="text-slate-300">{comp.sales_markets}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Categories:
                            </span>
                            <p className="text-slate-300 font-mono text-[11px]">{comp.categories}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Events / Stand:
                            </span>
                            <p className="text-slate-300">{comp.events}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() =>
                        setSelectedCompanyId(isExpanded ? null : comp.company_id || comp.company_name)
                      }
                      className="mt-3 pt-2 border-t border-slate-800/60 w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition"
                    >
                      {isExpanded ? (
                        <>
                          Hide Details <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          View All 10 Required Fields <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: ARCHITECTURE & TECHNICAL REVERSE-ENGINEERING */}
        {/* ============================================================== */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                Technical Reverse-Engineering & Architecture Report
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Both Disney Cruise Line and Ingredients Network employ modern enterprise web architectures with layered anti-scraping defenses (Akamai Edge Bot Manager, Queue-It tokens, Cloudflare email protection, and client-side single page rendering). Here is the technical breakdown of how each challenge was solved programmatically:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Disney Engineering Breakdown */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Ship className="w-4 h-4" />
                    Objective 1: Disney Cruise Line
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                    <li>
                      <strong>Akamai TLS Handshake</strong>: Acquired session cookies (<code className="text-cyan-300">Queue-it-token</code>, <code className="text-cyan-300">bm_sz</code>, <code className="text-cyan-300">_abck</code>) from the regional entrypoint <code className="text-cyan-300">/en-in/</code>.
                    </li>
                    <li>
                      <strong>VAS Authentication Gateway</strong>: Authenticated against <code className="text-cyan-300">/dcl-apps-productavail-vas/authz/private</code> to obtain internal bearer authorization.
                    </li>
                    <li>
                      <strong>Internal Bypass Header</strong>: Reverse-engineered <code className="text-cyan-300">dcl_spa_main.js</code> (Module 9838) which uncovered the required microservice header <code className="text-cyan-300">x-bypass-product-avail-svc: true</code>.
                    </li>
                    <li>
                      <strong>Pagination Execution</strong>: Traversed all 35 pages using the <code className="text-cyan-300">page: 1..35</code> parameter, capturing 171 product listings.
                    </li>
                    <li>
                      <strong>Deduplication Algorithm</strong>: Resolved 60 cross-page duplicates based on canonical cruise route and <code className="text-cyan-300">productId</code>, yielding 111 clean cruises.
                    </li>
                  </ul>
                </div>

                {/* Ingredients Engineering Breakdown */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Building2 className="w-4 h-4" />
                    Objective 2: Ingredients Network
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                    <li>
                      <strong>Taxonomy Bitmask Analysis</strong>: Queried the central JSON facet catalog containing 9,687 total items (4,001 companies, 4,001 products, 1,685 news articles).
                    </li>
                    <li>
                      <strong>Direct Bitmask Calculations</strong>: Evaluated filter positions in the binary representation (<code className="text-emerald-300">filterVal</code>) to compute exact supplier counts for Herbs & Spices (index 413 → 399), Physical Formats (index 649 → 764), and Cognitive Health (index 671 → 587).
                    </li>
                    <li>
                      <strong>Concurrent Profile Extractor</strong>: Dispatched multi-threaded requests using Python's <code className="text-emerald-300">ThreadPoolExecutor</code> across company JSON endpoints and HTML profiles.
                    </li>
                    <li>
                      <strong>Cloudflare Email De-obfuscation</strong>: Automated XOR hex decoding (<code className="text-emerald-300">decode_cf_email</code>) to extract raw emails from protected spans.
                    </li>
                    <li>
                      <strong>100% Quality Assurance</strong>: Audited all 10 required fields to ensure 0 empty values in the final dataset.
                    </li>
                  </ul>
                </div>
              </div>

              {/* File Artifacts Audit */}
              <div className="pt-3">
                <span className="text-xs font-bold text-slate-200">Generated CSV Artifacts:</span>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {[
                    { file: 'output/disney_cruises.csv', desc: '111 rows, 16 cols (Cleaned)', color: 'border-cyan-500/30 text-cyan-400' },
                    { file: 'output/disney_raw.csv', desc: '171 rows, 16 cols (35 Pages)', color: 'border-slate-700 text-slate-300' },
                    { file: 'output/ingredients_network.csv', desc: '150 rows, 12 cols (0 Nulls)', color: 'border-emerald-500/30 text-emerald-400' },
                    { file: 'output/ingredients_network_raw.csv', desc: '150 rows, 12 cols (Raw)', color: 'border-slate-700 text-slate-300' },
                  ].map((art, i) => (
                    <div key={i} className={`p-3 rounded-lg bg-slate-950 border ${art.color} text-xs font-mono`}>
                      <div className="font-bold truncate">{art.file}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{art.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 lg:px-8 text-center text-xs text-slate-500">
        Relu Consultancy Data Extraction Challenge • Candidate: anujpjadhav5@gmail.com • Built with Python & React
      </footer>
    </div>
  );
}

function CompassIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
