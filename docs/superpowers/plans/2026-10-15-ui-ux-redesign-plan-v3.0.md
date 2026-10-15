# DokanSaathi — UI/UX Redesign Implementation Plan (v3.0 — Final Consistency Audit)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the UI/UX redesign and bug fixes for DokanSaathi strictly following `DokanSaathi_UI_UX_Blueprint_v1.md`, the 7-screen reference design mockup, and all three approved Master Specifications. Integrate Google Gemini API Free Tier as the development/demo AI runtime using `gemini-3.5-transcribe` (Files API) and `gemini-3.5-flash-lite` (Structured Outputs), provide an evidence-based Financing Readiness checklist with zero fabricated rules, define exact period-end balance drill-downs, fix date formatting shifts, and maintain strict scope boundaries.

**Architecture:**
- **App Shell & Design Tokens:** Light-first financial style (`#F8FAFC`, `#FFFFFF`, `#2563EB`, `#16A34A`, `#F59E0B`, `#EF4444`, `#E2E8F0`). Shared layout shell with desktop sidebar / mobile sticky bottom navigation and collision-free floating action buttons (FABs).
- **Three-State AI Pipeline:**
  1. `LIVE_GEMINI_FREE_TIER`: Real user speech uploaded to authenticated server route -> Google Files API -> `gemini-3.5-transcribe` -> English transcript -> `gemini-3.5-flash-lite` (JSON Schema) -> structured draft.
  2. `MOCK_DEMO`: Explicitly toggled demo sample for competition judges without live quota consumption. Returns clearly badged *"Synthetic Demo Sample"*.
  3. `PROVIDER_ERROR`: Accurate error state (missing key, 429 quota exhaustion, network error, unsupported audio) with immediate English text fallback. Never returns mock output as fake live speech.
- **Zero-Direct Persistence & Pure Math:** LLM is strictly prohibited from doing authoritative calculations or database writes. User must explicitly execute `Confirm & Save`.
- **Evidence-Based Readiness:** 6 SME categories distinguishing application-record-derived counts, user-reported statuses, and independently verified evidence. No invented 10-day or 30-day thresholds.
- **Period-End Balance Semantics:** Customer Due and Supplier Due represent cumulative outstanding balances as of selected period end (`asOf=periodEnd`). Passed explicitly to ledger drill-downs.

**Tech Stack & Dependency Preservation:**
- Next.js: `15.1.6` (runtime `15.5.28`; preserved for stability; no unapproved major upgrade).
- React: `19.0.0`, React DOM: `19.0.0`.
- TypeScript: `5.7.3`, Tailwind CSS: `3.4.17`.
- AI Provider: Google Gemini API via official `@google/genai` SDK or direct REST Files/Interactions API (`GEMINI_API_KEY` server-only secret).
- Database: Supabase / PostgreSQL with RLS.
- Testing: Vitest `3.0.4` (`--pool=forks --no-color`).

**Spec Authorities:**
1. `DokanSaathi_UI_UX_Blueprint_v1.md` (Design and Interaction Authority)
2. `01_dokansaathi_master_prd_v2.md` (Product Scope Authority)
3. `02_dokansaathi_agent_architecture_v2.md` (Technical Architecture Authority)
4. `03_dokansaathi_competition_and_field_research_guide_v2.md` (Domain & SME Authority)

---

## Global Constraints & Scope Boundaries

1. **Language:** 100% English UI text, transcripts, errors, labels, tooltips, dialogs, and AI prompts.
2. **Approved Transaction Types:** Strictly 5 types: `SALE`, `CUSTOMER_PAYMENT`, `SUPPLIER_BILL`, `SUPPLIER_PAYMENT`, `EXPENSE`.
3. **Zero Silent Persistence:** No financial record is committed to the database without explicit user execution of `Confirm & Save`.
4. **Deterministic Math:** Pure server calculation functions ([`calculator.ts`](file:///e:/code%20files/confitation%20project/src/lib/finance/calculator.ts)).
5. **Strict Scope Exclusions:** No inventory/stock tracking, no 7-day cash flow forecast, no loan-approval predictions, no payment execution, no native mobile apps, no offline sync.
6. **Responsive Support:** Flawless rendering from $320\text{px}$ up to $1440\text{px}$ without horizontal page scrolling or clipped controls.

---

## Review Focus & Audit Resolutions

### 1. Official Gemini Models & Server-Side Integration Pattern
- **Transcription Model:** `gemini-3.5-transcribe` (using server-side Files API upload + audio transcription prompt).
- **Extraction Model:** `gemini-3.5-flash-lite` (using JSON Schema mode enforcing `transactionDraftSchema`).
- **Removed:** All references to legacy / deprecated models (e.g. `gemini-2.0-flash`, `gemini-1.5-flash`).
- **SDK & API Pattern:**
  - Client sends audio blob via multipart `FormData` to `/api/voice/transcribe`.
  - Route handler validates audio size ($\le 10\text{MB}$), duration ($\le 60\text{s}$), and authentication.
  - Route handler uploads audio buffer via Google AI Files API (`https://generativelanguage.googleapis.com/upload/v1beta/files?key=GEMINI_API_KEY`), then calls `gemini-3.5-transcribe`.
  - Ephemeral: Files API asset deleted immediately after transcription completes.

### 2. Three Distinct Runtime States (No Masquerading)
- **`LIVE_GEMINI_FREE_TIER`**: Active when `GEMINI_API_KEY` is present. User audio is transcribed and extracted via live Google Gemini endpoints. Response returns `{ provider: "gemini", mode: "live", transcript: "..." }`.
- **`MOCK_DEMO`**: Active only when explicitly requested (e.g. Judge Demo button or `AI_PROVIDER=mock`). Returns a predefined synthetic audio test case with explicit UI badge: `[Synthetic Demo Sample]`. Never claims to have listened to the user's microphone.
- **`PROVIDER_ERROR`**: Active when API key is missing, network fails, quota is exhausted (HTTP 429), or model rejects payload. UI displays exact error message (e.g. *"AI quota reached. Please use text entry."*) with an instant "Type Note" action.

### 3. Free-Tier Data Privacy Warning
- In `LIVE_GEMINI_FREE_TIER`, UI displays prominent notice:  
  *“Notice: Powered by Google Gemini API (Free Tier). Google's free-tier terms state that prompts and audio may be reviewed by human reviewers to train products. Do not speak or enter real confidential business records, National ID numbers, or personal banking details. Use synthetic demo data only.”*

### 4. Evidence-Based Financing Readiness (No Fabricated Thresholds)
- **Removed:** Fabricated rule requiring $\ge 10$ or $30$ transactions.
- **Evidence Sources:**
  - `Bookkeeping Records`: Derived from active ledger records: `"${count} active ledger records saved (${salesCount} sales, ${expenseCount} expenses, ${paymentsCount} payments, ${billsCount} bills)"`. Status: `Documented` if count $> 0$, else `Missing`.
  - `Customer Credit & Receivables`: Derived from credit sales and repayments: `"${reconciledCount} credit repayments reconciled against customer sales"`. Status: `Documented` if $> 0$, else `Needs Attention`.
  - `Supplier Invoices & Payments`: Derived from supplier bills and payments recorded in ledger. (Explicitly notes: *"Physical invoice attachments are not uploaded"*). Status: `Documented` if bills $> 0$, else `Needs Attention`.
  - `Trade License`: User-reported license number / status. Not inferred from shop profile.
  - `Owner Identity & KYC`: User-reported status only. Email authentication does NOT prove NID or address proof.
  - `Bank / Merchant MFS Account`: User-reported status only. Currency configuration does NOT prove a bank account exists.
- **Completion Calculation:** Dynamically computed from the 6 items: $\text{round}((\text{count of Documented items} / 6) \times 100)\%$.
- **Mandatory Disclaimer:** Prominently retained:  
  *“This checklist helps you prepare your records. It does not predict or guarantee loan approval.”*

### 5. Period-End Balance Semantics & Exact Drill-Down
- **Definition:**
  - `Sales` & `Expenses`: Flow totals over the period `[periodStart, periodEnd]`.
  - `Cash Collected`: Cash received at sale + customer payments received during `[periodStart, periodEnd]`.
  - `Customer Due`: Cumulative outstanding customer receivable balance **as of period end** (`asOf=periodEnd`).
  - `Supplier Due`: Cumulative outstanding supplier payable balance **as of period end** (`asOf=periodEnd`).
  - `Estimated Profit`: Badged `Unavailable` with clear explanation when cost data is incomplete.
- **Drill-Down Query URLs:**
  - Sales: `/transactions?type=SALE&start=${periodStart}&end=${periodEnd}`
  - Cash Collected: `/transactions?view=cash_collected&start=${periodStart}&end=${periodEnd}`
  - Customer Due: `/transactions?type=SALE&asOf=${periodEnd}&unpaid=true`
  - Supplier Due: `/transactions?type=SUPPLIER_BILL&asOf=${periodEnd}&unpaid=true`
  - Expenses: `/transactions?type=EXPENSE&start=${periodStart}&end=${periodEnd}`
  - Estimated Profit: Opens explanatory calculation modal.

### 6. Currency-Aware Labels & Timezone-Safe Date Parsing
- All currency displays use dynamic `business.currency` (e.g. `Customer Due (BDT)`, `Total Amount (USD)`).
- Timezone shift bug avoided: Date strings are treated as pure calendar dates (`YYYY-MM-DD`). Split by `"-"` into `[year, month, day]` and formatted using UTC date methods (`Date.UTC(...)`), preventing unexpected -1 day offsets in negative timezone environments.

---

## Architecture: Multi-State Gemini & Voice Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as Shop Owner (Browser)
    participant Client as Next.js Client
    participant ServerVoice as POST /api/voice/transcribe
    participant GeminiFiles as Google AI Files API (v1beta)
    participant GeminiTranscribe as gemini-3.5-transcribe
    participant ServerExtract as POST /api/transactions/extract
    participant GeminiExtract as gemini-3.5-flash-lite (JSON Schema)
    participant Calc as Server Validator (calculator.ts)

    Note over User,Client: State Selection & Voice Capture
    User->>Client: Speaks English transaction (or taps Mic FAB)
    Client->>Client: Verifies browser capability & window.isSecureContext
    Client->>ServerVoice: Multipart FormData (audio blob)

    alt State 1: LIVE_GEMINI_FREE_TIER (GEMINI_API_KEY present)
        ServerVoice->>GeminiFiles: Upload audio buffer (ephemeral)
        GeminiFiles--ServerVoice: file_uri
        ServerVoice->>GeminiTranscribe: Transcribe audio file to English
        GeminiTranscribe--ServerVoice: English transcript text
        ServerVoice->>GeminiFiles: Delete ephemeral audio file
        ServerVoice-->>Client: { provider: "gemini", mode: "live", transcript: "..." }
    else State 2: MOCK_DEMO (Explicit Demo Mode requested)
        ServerVoice-->>Client: { provider: "mock", mode: "demo", transcript: "[Synthetic Demo] Sold rice for 2000..." }
    else State 3: PROVIDER_ERROR (Quota 429, missing key, network failure)
        ServerVoice-->>Client: HTTP 429 / 500 { error: "AI_QUOTA_EXHAUSTED", message: "Quota reached" }
        Client->>User: Displays clear error with "Type Note Instead" action
    end

    Note over User,Client: Structured Extraction
    Client->>ServerExtract: POST { raw_text: transcript, currency, timezone }
    alt Live Gemini Mode
        ServerExtract->>GeminiExtract: Prompt + Zod JSON Schema -> gemini-3.5-flash-lite
        GeminiExtract--ServerExtract: Structured JSON draft
    else Mock / Fallback Mode
        ServerExtract--ServerExtract: Deterministic rule-based extraction
    end
    ServerExtract->>Calc: Zod validation & balance check (0 <= cash <= total)
    Calc--ServerExtract: Validated unsaved draft
    ServerExtract-->>Client: { draft, status: 'ready_for_review' }

    Note over User,Client: User Confirmation Gate
    Client->>User: Displays TransactionReviewCard (Confirm / Edit / Cancel)
    User->>Client: Clicks "Confirm & Save"
    Client->>Client: Sends POST /api/transactions/confirm
    Note over Client: Record committed to Supabase ledger ONLY upon explicit click!
```

---

## File-by-File Implementation Tasks

### Task 1: Timezone Math, Monday-Start Week, and asOf Period Semantics

**Files:**
- Modify: `src/lib/finance/periods.ts`
- Modify: `src/app/api/dashboard/route.ts`
- Modify: `src/app/api/transactions/route.ts`
- Test: `tests/unit/periods.test.ts`
- Test: `tests/integration/dashboard-periods.test.ts`

**Specifications:**
- Update `PeriodBoundaries` to include human-readable `formattedRange`:
  - Daily: `Today · 15 Oct 2026`
  - Weekly (Monday-start): `This Week · 12–18 Oct 2026`
  - Monthly: `This Month · 1–31 Oct 2026`
- Support `asOf` query parameter in `/api/transactions`: When `asOf=YYYY-MM-DD` is present with `unpaid=true`, compute remaining balance taking into account only repayments recorded on or before `asOf`.
- Use a controlled clock (fixed Date) in unit tests to prevent environment drift.

---

### Task 2: Multi-Layer Voice Diagnostics & Transcription Route Refactor

**Files:**
- Create: `src/lib/voice/diagnostics.ts`
- Modify: `src/components/VoiceRecorder.tsx`
- Modify: `src/app/api/voice/transcribe/route.ts`
- Test: `tests/unit/voice-diagnostics.test.ts`

**Specifications:**
- Pure diagnostic helper checks:
  1. `window.isSecureContext` (boolean).
  2. `navigator.mediaDevices` & `getUserMedia` presence.
  3. Microphone device enumeration.
  4. Permission state (`prompt`, `granted`, `denied`).
  5. Multi-codec support (`audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, `audio/aac`).
- Fix response key alignment: client consumes `data.transcript` returned from server.
- Server validates audio file size ($\le 10\text{MB}$) and returns three explicit states: `LIVE_GEMINI_FREE_TIER`, `MOCK_DEMO`, or `PROVIDER_ERROR`. Never masks errors as fake transcripts.

---

### Task 3: Gemini API Provider (`gemini-3.5-transcribe` & `gemini-3.5-flash-lite`)

**Files:**
- Create: `src/lib/ai/gemini-provider.ts`
- Modify: `src/lib/ai/adapter.ts`
- Modify: `src/app/api/transactions/extract/route.ts`
- Test: `tests/unit/gemini-provider.test.ts`

**Specifications:**
- Implement `GeminiProvider`:
  - Transcription: Calls Google AI Files API to upload audio, requests transcription via `gemini-3.5-transcribe`, deletes uploaded file.
  - Extraction: Calls `gemini-3.5-flash-lite` with strict JSON schema enforcing `transactionDraftSchema`.
- Handle error codes: `429` (Quota Exhausted), `401` (Invalid Key), `503` (Service Unavailable).
- Server-side secret: `GEMINI_API_KEY` stored exclusively in `.env.local`.

---

### Task 4: Global Floating Action Buttons (FAB) & Collision Prevention

**Files:**
- Create: `src/components/FloatingActions.tsx`
- Create: `src/components/VoiceCaptureDialog.tsx` (single shared dialog)
- Modify: `src/app/(dashboard)/layout.tsx`
- Test: `tests/unit/floating-actions.test.ts`

**Specifications:**
- Stacked FAB on bottom-right (`right-4 bottom-20 md:bottom-6 z-40`):
  - Primary Mic FAB: `w-14 h-14 bg-primary text-white shadow-lg`.
  - Secondary Pen FAB: `w-12 h-12 bg-card border text-foreground shadow-md`.
- Safe Spacing & Collision Prevention:
  - $\ge 24\text{px}$ clearance above mobile bottom navigation bar (`h-14` + `safe-area-inset-bottom`).
  - Automatically hidden on `/transactions/new`.
  - Automatically hidden when dialogs are open or virtual keyboard is active.
  - Page content container padded with `pb-28 md:pb-12`.
- Unified flow: Tapping Mic FAB opens `VoiceCaptureDialog`. On transcription completion, transitions directly to `TransactionReviewCard`.

---

### Task 5: Manual Form Redesign & Silent Payment Default Fix (Screen 5)

**Files:**
- Modify: `src/components/ManualTransactionForm.tsx`
- Test: `tests/unit/manual-form.test.ts`

**Specifications:**
- Remove silent default (lines 55–57).
- For `SALE` transactions:
  - Total Amount (`${currency}`): Required.
  - Explicit Payment Status: Radio / segmented control with 3 options:
    1. `Fully Paid (Cash = Total Amount)`
    2. `Partially Paid (Enter Cash Collected)`
    3. `Unpaid / Credit (Cash = 0)`
  - Real-time auto-calculation of `Customer Due (${currency})` displayed dynamically: `Total Amount - Cash Collected`.
  - Enforce $0 \le \text{cash collected} \le \text{total amount}$.

---

### Task 6: Dashboard Redesign & Exact Drill-Down Links (Screen 1)

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Test: `tests/unit/dashboard-drilldown.test.ts`

**Specifications:**
- Layout matching Screen 1 of visual mockup:
  - Header: DS mark, shop name, notification bell, menu icon.
  - Greeting: "Good morning! Here's your business summary".
  - Date Pill: Dropdown selector (Daily, Weekly, Monthly) with exact human range (`This Week · 12–18 Oct 2026`).
  - 6 Metric Cards with dynamic currency labels and exact drill-down query strings:
    1. **Sales:** `/transactions?type=SALE&start=${periodStart}&end=${periodEnd}`
    2. **Cash Collected:** `/transactions?view=cash_collected&start=${periodStart}&end=${periodEnd}`
    3. **Customer Due:** `/transactions?type=SALE&asOf=${periodEnd}&unpaid=true`
    4. **Supplier Due:** `/transactions?type=SUPPLIER_BILL&asOf=${periodEnd}&unpaid=true`
    5. **Operating Expenses:** `/transactions?type=EXPENSE&start=${periodStart}&end=${periodEnd}`
    6. **Estimated Profit:** Badged `Unavailable` with click-to-open explanatory modal.

---

### Task 7: Responsive Ledger & Filter Overflow Fix (Screen 6)

**Files:**
- Modify: `src/app/(dashboard)/transactions/page.tsx`
- Modify: `src/components/TransactionList.tsx`
- Test: `tests/unit/ledger-responsive.test.ts`

**Specifications:**
- Reorganize search and filter container:
  - Row 1: Full-width search input.
  - Row 2: `grid grid-cols-2 gap-2` containing Type select and Status select. Zero horizontal scroll at $320\text{px}$.
- Consume incoming query parameters (`type`, `view`, `start`, `end`, `asOf`, `unpaid`) to filter records correctly and reconcile with dashboard totals.
- Group transactions chronologically with date section headers (e.g. `October 15, 2026 (4 records)`).
- Cards display dynamic currency and clear split breakdown: `Cash: 1,500 | Due: 500`.

---

### Task 8: Evidence-Based Financing Readiness Checklist (Screen 7)

**Files:**
- Modify: `src/app/api/readiness/route.ts`
- Modify: `src/app/(dashboard)/readiness/page.tsx`
- Test: `tests/unit/readiness-logic.test.ts`

**Specifications:**
- 6 Evidence-Based Categories:
  1. `Trade License & Business Registration`: Status derived from user-reported license number or documented toggle. Not inferred from profile creation.
  2. `Bookkeeping Records`: Status derived from active transaction count in ledger ($> 0$).
  3. `Customer Credit & Receivables`: Status derived from credit sales and reconciled repayments.
  4. `Supplier Invoices & Payments`: Status derived from supplier bills and recorded payments. Notes: *"Physical invoice attachments are not uploaded"*.
  5. `Owner Identity & KYC Records`: Marked `Needs Attention` with guidance to prepare Smart NID and utility bills. Never claims email auth proves NID.
  6. `Bank or Merchant MFS Account`: Marked `Needs Attention` with guidance to operate separate business accounts. Never claims currency proves an account.
- Dynamic completion calculation: Count of `Documented` items out of 6 ($\text{round}((\text{count} / 6) \times 100)\%$).
- Prominent non-predicative disclaimer banner:  
  *“This checklist helps you prepare your records. It does not predict or guarantee loan approval.”*

---

## Verification Plan

### Automated Test Suite Commands
```powershell
# 1. Run all unit and deterministic integration tests
npm.cmd test

# 2. Run dedicated E2E workflow tests
npm.cmd run test:e2e

# 3. Optional live Gemini smoke test (skipped if GEMINI_API_KEY is not set)
npm.cmd run test:gemini-smoke

# 4. Strict TypeScript typecheck
npm.cmd run typecheck

# 5. Production build
npm.cmd run build
```

### End-to-End Test Matrix
1. **Voice FAB -> Ledger Flow:** Voice FAB click -> modal -> audio capture -> `gemini-3.5-transcribe` -> `gemini-3.5-flash-lite` -> review card -> confirm -> persisted.
2. **Manual FAB -> Ledger Flow:** Manual FAB click -> manual form -> explicit payment selection -> customer due calculation -> review card -> confirm -> persisted.
3. **Dashboard Reconciliation Flow:** Weekly period -> click Sales -> ledger filters to 12–18 Oct 2026 -> sum of transactions equals dashboard total.
4. **Period-End Balance Drill-Down:** Customer Due -> ledger filters with `asOf=periodEnd&unpaid=true` -> sum of unpaid receivables matches dashboard total.
5. **Insecure Context Fallback:** Simulate `window.isSecureContext === false` -> displays HTTPS guidance and instant text fallback.
6. **Provider Error Resilience:** Simulate 429 quota exhaustion -> displays clear English error with manual entry fallback; never returns fake canned text.
7. **Readiness Checklist State:** Verify completion percentage updates dynamically from actual item statuses.

---

## Unresolved Blockers & Dependencies
- **Live Gemini API Key:** Requires `GEMINI_API_KEY` in `.env.local` for `LIVE_GEMINI_FREE_TIER`. If omitted, app operates in synthetic `MOCK_DEMO` mode with clear user labelling.
- **Microphone over LAN IP:** Mobile browsers disable `getUserMedia` over plain HTTP on LAN. The diagnostic guides the user to text entry fallback unless HTTPS or localhost port forwarding is used.
