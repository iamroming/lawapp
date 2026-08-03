# Feature Plan: Relevant Case Laws & Judgments Auto-Listing

## Overview
When a case is created/edited with Acts, Sections, Clauses, and Sub-sections, the app automatically finds and displays relevant case laws and judgments from Indian courts.

---

## How It Works

### 1. Data Input (Case Form)
When creating or editing a case, the user fills in:
- **Act(s)**: e.g., "Indian Penal Code", "Code of Criminal Procedure", "Indian Evidence Act"
- **Section(s)**: e.g., "302", "376", "498A"
- **Clause/Sub-section**: e.g., "(a)", "(1)", "Section 125(1)"

These are stored as structured fields on the `cases` table:
```
acts: text[]          -- e.g. {"Indian Penal Code", "Negotiable Instruments Act"}
sections: text[]      -- e.g. {"302", "376"}
clauses: text[]       -- e.g. {"302(a)", "125(1)"}
```

### 2. Case Law Search Sources

| Source | Type | Cost | Coverage |
|--------|------|------|----------|
| **Indian Kanoon API** | REST API | Free (100/day) | Supreme Court, High Courts, Tribunals |
| **Supabase Full-Text Search** | Internal DB | Free | Cases already in your database |
| **AI Semantic Matching** | OpenAI API | Pay-per-use | Pattern matching on case descriptions |

**Recommended: Indian Kanoon API** as primary source + internal DB for previously saved cases.

### 3. Indian Kanoon API (Primary Source)

**Base URL:** `https://api.indiankanoon.org/`

**Free Tier:** 100 requests/day, no API key needed for basic queries.

**How to query:**
```
GET https://api.indiankanoon.org/search/formText/?formInput=section+302+IPC&pagenum=0
```

**Returns:**
- Case title
- Court (SC/HC/Tribunal)
- Date of judgment
- Bench (judge names)
- Doc excerpt with highlighted matching text
- Link to full judgment

**Query building logic:**
```
Input: Act="Indian Penal Code", Section="302"
Query: "section 302 Indian Penal Code"
     + "murder" (auto-derived from section 302)

Input: Act="Code of Criminal Procedure", Section="125"
Query: "section 125 CrPC" + "maintenance"
```

### 4. Architecture

```
┌─────────────────────────────────────────────┐
│              Case Form UI                    │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Acts    │ │ Sections │ │   Clauses    │  │
│  └─────────┘ └──────────┘ └──────────────┘  │
└──────────────────┬──────────────────────────┘
                   │ Save case
                   ▼
┌─────────────────────────────────────────────┐
│           /api/cases/[id]/similar           │
│  1. Extract acts + sections from case       │
│  2. Build search query                      │
│  3. Call Indian Kanoon API                  │
│  4. Parse results                           │
│  5. Also search internal DB for saved cases │
│  6. Merge + rank results                    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          Case Detail Page                    │
│  ┌────────────────────────────────────────┐  │
│  │  📋 Relevant Case Laws (auto-found)    │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ State of MP v. Babulal (2020)    │  │  │
│  │  │ SC | 2020-03-15 | s.302 IPC     │  │  │
│  │  │ "The ingredients of murder under  │  │
│  │  │  s.300 IPC are..."               │  │
│  │  │ [Read Full Judgment]             │  │
│  │  └──────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ Ram Singh v. State (2019)        │  │  │
│  │  │ Delhi HC | 2019-11-20 | s.302   │  │  │
│  │  │ [Read Full Judgment]             │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 5. API Route: `/api/cases/[id]/similar`

**Flow:**
1. Fetch case from DB (get acts, sections, clauses)
2. Build search query string
3. Call Indian Kanoon API
4. Search internal `cases` table for similar (same acts/sections)
5. Merge results, deduplicate, rank by relevance
6. Cache results in DB table `case_law_results` (avoid re-fetching)
7. Return top 10-20 results

**Response:**
```json
{
  "results": [
    {
      "title": "State of MP v. Babulal",
      "citation": "2020 SCC 3 245",
      "court": "Supreme Court",
      "date": "2020-03-15",
      "judges": ["Justice Arun Mishra"],
      "excerpt": "The ingredients of murder under Section 300 IPC are...",
      "url": "https://indiankanoon.org/doc/...",
      "relevance_score": 0.95,
      "matched_sections": ["302 IPC"],
      "source": "indian_kanoon"
    }
  ],
  "internal_matches": [
    {
      "case_id": "uuid...",
      "case_number": "CRL/2024/001",
      "title": "Similar Case Title",
      "similarity_reason": "Same section 302 IPC"
    }
  ]
}
```

### 6. Database Changes

**New table: `case_law_results`**
```sql
CREATE TABLE case_law_results (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  title text NOT NULL,
  citation text,
  court text,
  judgment_date date,
  judges text[],
  excerpt text,
  url text,
  relevance_score numeric(3,2),
  matched_sections text[],
  source text NOT NULL, -- 'indian_kanoon' or 'internal'
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_case_law_case_id ON case_law_results(case_id);
ALTER TABLE case_law_results ENABLE ROW LEVEL SECURITY;
-- RLS: same as cases (firm isolation + case involvement)
```

**Modified table: `cases`**
```sql
ALTER TABLE cases ADD COLUMN IF NOT EXISTS acts text[];
ALTER TABLE cases ADD COLUMN IF NOT EXISTS sections text[];
ALTER TABLE cases ADD COLUMN IF NOT EXISTS clauses text[];
```

### 7. Frontend: Case Detail Page

Add a "Relevant Case Laws" section on the case detail page (`/cases/[id]`):

- **Auto-fetch on page load** if acts/sections are filled
- **Manual refresh button** to re-search
- **Loading state** while fetching from Indian Kanoon
- **Expandable cards** showing excerpt with highlighted matching text
- **"Save to case" button** to pin a result to the case notes
- **"Open in Indian Kanoon"** link for full judgment

### 8. Known Section Mappings (Optional Enhancement)

Build a lookup table for common Indian Acts that maps sections to topics:

```json
{
  "IPC": {
    "302": "Murder",
    "304": "Culpable Homicide",
    "376": "Rape",
    "498A": "Cruelty by Husband",
    "34": "Common Intention",
    "149": "Unlawful Assembly"
  },
  "CrPC": {
    "125": "Maintenance",
    "498": "Husband Relative Harassment",
    "41A": "Notice of Appearance"
  },
  "Evidence Act": {
    "27": "Discovery of Fact",
    "65B": "Electronic Evidence"
  }
}
```

This helps:
- Auto-generate better search queries
- Show section descriptions alongside numbers
- Improve relevance ranking

### 9. Implementation Steps

| Step | What | Files |
|------|------|-------|
| 1 | Add `acts`, `sections`, `clauses` columns to cases | DB migration |
| 2 | Update case create/edit forms to accept acts/sections | `cases/new/page.tsx`, `cases/[id]/edit/page.tsx` |
| 3 | Create `case_law_results` table | DB migration |
| 4 | Build `/api/cases/[id]/similar` route | `src/app/api/cases/[id]/similar/route.ts` |
| 5 | Build Indian Kanoon API client | `src/lib/legal/indian-kanoon.ts` |
| 6 | Build section mapping data | `src/lib/legal/section-mappings.ts` |
| 7 | Add "Relevant Case Laws" UI to case detail | `cases/[id]/page.tsx` |
| 8 | Add caching logic | In `similar/route.ts` |

### 10. Rate Limiting & Caching

- **Cache results** in `case_law_results` table for 7 days
- **Rate limit**: max 100 Indian Kanoon API calls/day (free tier)
- **Fallback**: If API limit reached, show cached results only
- **Background refresh**: Optional cron to refresh stale results

### 11. Cost Estimate

| Component | Cost |
|-----------|------|
| Indian Kanoon API | Free (100/day) |
| Internal DB search | Free |
| AI matching (optional) | ~$0.01/query via OpenAI |
| Storage (cache) | Negligible |

**Total: Free for basic usage.**

---

## Summary

- User fills Acts + Sections in case form
- App auto-searches Indian Kanoon API for matching judgments
- Results shown in case detail page with excerpts
- Results cached in DB to avoid repeated API calls
- Also matches against internal cases with same sections
- Free to implement, no paid APIs required for basic version
