# DokanSaathi — UI/UX Redesign Implementation Plan (v2.0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the UI/UX redesign and bug fixes for DokanSaathi strictly following `DokanSaathi_UI_UX_Blueprint_v1.md`, the 7-screen reference design mockup, and the three Master Specifications. Integrate Google Gemini API (Free Tier) as the development/demo AI runtime, provide evidence-based readiness scoring, fix all identified bugs (including the `data.transcription` vs `data.transcript` mismatch and `Period: undefined`), and preserve all core financial invariants.

**Architecture:**
- **App Shell & Design System:** Light-first financial tokens (`#F8FAFC`, `#FFFFFF`, `#2563EB`, `#16A34A`, `#F59E0B`, `#EF4444`, `#E2E8F0`). Shared layout shell with desktop sidebar / mobile sticky bottom navigation and collision-free floating action buttons (FABs).
- **Two-Stage AI Pipeline (Gemini Free Tier):**
  1. *Stage 1 (Transcription):* Browser mic → audio blob → authenticated server route `/api/voice/transcribe` → Gemini audio model → English transcript review.
  2. *Stage 2 (Extraction):* English transcript / text note → authenticated server route `/api/transactions/extract` → Gemini Flash model (JSON schema mode) → structured draft → server deterministic validation → unsaved review card.
- **Zero-Direct Persistence & Pure Math:** LLM is strictly prohibited from doing authoritative calculations or database writes. User must explicitly execute `Confirm and Save`.
- **Evidence-Based Readiness:** 6 SME categories distinguishing application-derived counts, user-reported statuses, and independently verified evidence. Non-predicative disclaimer banner.

**Tech Stack & Dependency Preservation:**
- Next.js: `15.1.6` (resolves to `15.5.28` runtime; preserved for stability; no unapproved major upgrade).
- React: `19.0.0`, React DOM: `19.0.0`.
- TypeScript: `5.7.3`, Tailwind CSS: `3.4.17`.
- AI Provider: Google Gemini API via `@google/genai` or direct REST fetch (`GEMINI_API_KEY` server-only secret).
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
3. **Zero Silent Persistence:** No financial record is committed to the database without explicit user execution of `Confirm and Save`.
4. **Deterministic Math:** Pure server calculation functions ([`calculator.ts`](file:///e:/code%20files/confitation%20project/src/lib/finance/calculator.ts)).
5. **Strict Scope Exclusions:** No inventory/stock tracking, no 7-day cash flow forecast, no loan-approval predictions, no payment execution, no native mobile apps, no offline sync.
6. **Responsive Support:** Flawless rendering from $320\text{px}$ up to $1440\text{px}$ without horizontal page scrolling or clipped controls.

---

## Review Focus & Root Cause Evidence

### 1. Weekly Date Calculation (Monday-Start Convention)
- **Evidence:** 15 October 2026 is a Thursday.
- **Rule:** Under the standard Monday-to-Sunday business week convention in `Asia/Dhaka`:
  - Week Start (Monday): `2026-10-12`
  - Week End (Sunday): `2026-10-18`
- **Resolution:** Correct the previous plan's typo (`13–19 Oct`). Add unit tests in `tests/unit/periods.test.ts` verifying boundary calculation for Thursdays, Sundays (week-end edge case), and month transitions across weekly boundaries.

### 2. Dashboard `Period: undefined (undefined to undefined)` Bug
- **Evidence:** `src/app/api/dashboard/route.ts` returned `{ period, periodStart, periodEnd }`, while `src/app/(dashboard)/dashboard/page.tsx` line 35 expected `{ formattedRange, startDate, endDate }`.
- **Resolution:** Align client and server interfaces. In `src/lib/finance/periods.ts`, generate `formattedRange` (e.g. `Today · 15 Oct 2026`, `This Week · 12–18 Oct 2026`, `This Month · 1–31 Oct 2026`).

### 3. Voice Recording: Multi-Layer Diagnostics & Transcription Response Key Mismatch
- **Evidence 1 (Key Mismatch):** In `src/app/api/voice/transcribe/route.ts` line 25, the API returns `{ transcript: string }`. In `src/components/VoiceRecorder.tsx` line 113, the code checked `if (data.transcription)`. Because `data.transcription` was `undefined`, line 116 executed: `setErrorMessage("No clear speech detected...")`!
- **Evidence 2 (Layered Diagnostics):** Treat LAN HTTP as a hypothesis until verified at runtime. Inspect each layer independently:
  1. `window.isSecureContext` (boolean).
  2. `navigator.mediaDevices` presence.
  3. `getUserMedia` function presence.
  4. Microphone hardware presence (`enumerateDevices()`).
  5. Permission state (`permissions.query({ name: 'microphone' })`).
  6. Multi-codec support (`audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, `audio/aac`).
  7. Audio blob generation (`size > 0`).
  8. Network request to `/api/voice/transcribe`.
  9. Alignment of response JSON key (`data.transcript`).
  10. Server-side provider execution (Gemini vs Mock).

### 4. Silent Full-Payment Default in Manual Form
- **Evidence:** `ManualTransactionForm.tsx` lines 55–57 silently set `collectedStr = parsedAmount.toFixed(2)` if `amountCollected` was blank, assuming 100% cash collection.
- **Resolution:** Make cash collected an explicit required input with helper choices. Automatically compute and display `Customer Due (BDT)` in real time (`Total Amount - Cash Collected`).

### 5. Clipped Mobile Ledger Filters
- **Evidence:** `src/app/(dashboard)/transactions/page.tsx` packed two `<select>` dropdowns and a search button on one row with `flex gap-2`. At $320\text{px}$ width, options clipped off-screen.
- **Resolution:** Reorganize filter bar into a responsive grid: full-width search input on top, and `grid grid-cols-2 gap-2` for Type and Status dropdowns.

### 6. Evidence-Based Financing Readiness Checklist
- **Evidence:** `src/app/api/readiness/route.ts` claimed email authentication proved NID/KYC documents, and claimed currency configuration proved a dedicated bank account. It also invented an unapproved 30-day minimum rule.
- **Resolution:**
  - Classify each item into: `Documented`, `Needs Attention`, or `Unverified`.
  - Disclose exact data sources (ledger record counts vs user-reported status).
  - Calculate completion percentage dynamically from actual item statuses.
  - Retain mandatory non-predicative disclaimer banner.

---

## Architecture: Google Gemini API Free-Tier Integration

```mermaid
sequenceDiagram
    autonumber
    actor User as Shop Owner (Browser)
    participant Client as Next.js Client
    participant ServerVoice as POST /api/voice/transcribe
    participant ServerExtract as POST /api/transactions/extract
    participant GeminiAPI as Google Gemini API (Server Secret)
    participant Calc as Deterministic Calculator & Validator

    Note over User,Client: Stage 1: Audio Capture & Transcription
    User->>Client: Speaks English transaction (or clicks Mic FAB)
    Client->>Client: Captures audio blob via MediaRecorder
    Client->>ServerVoice: Multipart FormData (audio blob)
    alt Gemini API Configured (GEMINI_API_KEY)
        ServerVoice->>GeminiAPI: Audio payload -> gemini-1.5-flash / gemini-2.0-flash
        GeminiAPI--ServerVoice: English Transcript text
    else Dev / Demo Mock Fallback
        ServerVoice--ServerVoice: Returns labelled synthetic demo transcript
    end
    ServerVoice-->>Client: { transcript, provider, is_demo }
    Client->>User: Displays English transcript for user review

    Note over User,Client: Stage 2: Structured Draft Extraction
    Client->>ServerExtract: POST { raw_text: transcript, currency, timezone }
    alt Gemini API Configured (GEMINI_API_KEY)
        ServerExtract->>GeminiAPI: Prompt + JSON Schema -> gemini-1.5-flash
        GeminiAPI--ServerExtract: Structured JSON draft
    else Dev / Demo Mock Fallback
        ServerExtract--ServerExtract: Deterministic rule extraction
    end
    ServerExtract->>Calc: Zod schema validation & balance check
    Calc--ServerExtract: Verified unsaved draft payload
    ServerExtract-->>Client: { draft, status: 'ready_for_review' }

    Note over User,Client: Stage 3: Explicit User Review & Confirm
    Client->>User: Displays TransactionReviewCard (Confirm / Edit / Cancel)
    User->>Client: Clicks "Confirm & Save"
    Client->>Client: Sends POST /api/transactions/confirm
    Note over Client: Record persisted to Supabase Ledger ONLY after explicit click!
```

### Free-Tier Transparency & Privacy Protections
1. **Demo Mode Notice:** Displayed in voice dialog:  
   *“Demo Mode (Google Gemini Free Tier): Use synthetic test transactions only. Do not speak or enter real confidential business records, National ID numbers, or personal banking details.”*
2. **Server-Only Secret:** `GEMINI_API_KEY` stored exclusively in `.env.local` and accessed in server route handlers. Never exposed in `NEXT_PUBLIC_*` or client bundles.
3. **Safe Error Handling:**
   - Missing key: Displays clear instructions to configure `GEMINI_API_KEY` or test in demo mock mode.
   - HTTP 429 Quota Exhaustion: Displays friendly message: *"AI quota exceeded. Please type your note or enter manually."*
   - Network failure: Offers instant retry or manual form switch.
   - Never masquerade mock data as live Gemini output!

---

## File-by-File Implementation Tasks

### Task 1: Timezone-Aware Period Math & Dashboard Date Fix

**Files:**
- Modify: `src/lib/finance/periods.ts`
- Modify: `src/app/api/dashboard/route.ts`
- Test: `tests/unit/periods.test.ts`
- Test: `tests/integration/dashboard-periods.test.ts`

**Changes & Interfaces:**
- Update `PeriodBoundaries` interface:
  ```typescript
  export interface PeriodBoundaries {
    period: PeriodType;
    periodStart: string; // YYYY-MM-DD
    periodEnd: string;   // YYYY-MM-DD
    formattedRange: string; // e.g. "12–18 Oct 2026"
    label: string;          // e.g. "This Week"
  }
  ```
- Implement Monday-start weekly calculation:
  ```typescript
  // Monday is day 1, Sunday is day 0
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  // Start: Monday, End: Monday + 6 days (Sunday)
  ```
- Generate localized formatting using `Intl.DateTimeFormat` with `timeZone: business.timezone`.
- Daily: `Today · 15 Oct 2026`
- Weekly: `This Week · 12–18 Oct 2026`
- Monthly: `This Month · 1–31 Oct 2026`
- Eliminate all `undefined` date renderings.

---

### Task 2: Unified Voice Recorder & Multi-Layer Browser Diagnostics

**Files:**
- Create: `src/lib/voice/diagnostics.ts` (pure diagnostic helper)
- Modify: `src/components/VoiceRecorder.tsx` (waveform pulse, suggestion chips, diagnostic integration)
- Modify: `src/app/api/voice/transcribe/route.ts` (fix `transcript` response key, Gemini audio adapter integration)
- Test: `tests/unit/voice-diagnostics.test.ts`

**Changes & Interfaces:**
- Multi-layer diagnostic function:
  ```typescript
  export interface VoiceDiagnosticResult {
    canRecord: boolean;
    reason?: "INSECURE_CONTEXT" | "API_UNSUPPORTED" | "NO_MICROPHONE" | "PERMISSION_DENIED" | "UNKNOWN";
    message: string;
    suggestedAction: "USE_TEXT" | "ENABLE_HTTPS" | "GRANT_PERMISSION";
  }
  ```
- Check `window.isSecureContext`: If false, explain HTTPS requirement on LAN/mobile and provide instant text fallback button.
- Support multiple audio MIME types: `['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac']`.
- Fix JSON key alignment: Client expects `data.transcript` and server returns `data.transcript`.
- Support Google Gemini transcription model on server when `GEMINI_API_KEY` is present, with clear `provider: 'gemini' | 'mock'` return field.

---

### Task 3: Global Floating Action Buttons (FAB) & Collision Prevention

**Files:**
- Create: `src/components/FloatingActions.tsx`
- Create: `src/components/VoiceCaptureDialog.tsx` (shared modal reused across FAB and New Entry page)
- Modify: `src/app/(dashboard)/layout.tsx`
- Test: `tests/unit/floating-actions.test.ts`

**Changes & Interfaces:**
- Stacked FAB on bottom-right:
  - Container: `fixed right-4 bottom-20 md:bottom-6 z-40 flex flex-col items-center gap-2.5`
  - Voice FAB: Blue circle (`w-14 h-14 bg-primary text-white shadow-lg`), accessible label: `Record a transaction`.
  - Manual FAB: White/light circle (`w-12 h-12 bg-card border text-foreground shadow-md`), accessible label: `Enter a transaction manually`.
- Collision Prevention:
  - Hidden on `/transactions/new` (prevents redundant controls).
  - Hidden when any modal or dialog is open.
  - Hidden when mobile virtual keyboard is active (via `focusin` / `focusout` on text inputs).
  - Content bottom padding `pb-28 md:pb-12` ensures bottom cards scroll completely free of FABs.
- Unified Workflow: Tapping Voice FAB opens `VoiceCaptureDialog`. When transcription finishes, transitions directly to `TransactionReviewCard`.

---

### Task 4: Fix Manual Form Silent Payment Default (Screen 5)

**Files:**
- Modify: `src/components/ManualTransactionForm.tsx`
- Test: `tests/unit/manual-form.test.ts`

**Changes & Interfaces:**
- Remove silent default (lines 55–57).
- For `SALE` transactions:
  - `Total Sale Amount`: Required.
  - `Payment Status at Sale`: Radio / toggle with 3 explicit choices:
    1. `Fully Paid (Cash Received = Total Amount)`
    2. `Partially Paid (Enter Cash Collected)`
    3. `Unpaid / Credit (Cash Collected = 0)`
  - Real-time auto-calculation of `Customer Due (BDT)` displayed directly below: `Total - Cash Collected`.
  - Prevent user from submitting without selecting payment status or entering valid cash collected ($0 \le \text{collected} \le \text{total}$).

---

### Task 5: Dashboard Redesign & Exact Ledger Drill-Down (Screen 1)

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Test: `tests/unit/dashboard-drilldown.test.ts`

**Changes & Interfaces:**
- Layout matching Screen 1 of visual mockup:
  - Header: DS avatar, shop name, notification bell, menu icon.
  - Greeting: "Good morning! Here's your business summary".
  - Date Pill: Dropdown selector (Daily, Weekly, Monthly) with exact human range (`This Week · 12–18 Oct 2026`).
  - 6 Metric Cards with distinct icons, color borders, and drill-down links:
    1. **Sales:** `/transactions?type=SALE&start=${periodStart}&end=${periodEnd}`
    2. **Cash Collected:** `/transactions?view=cash_collected&start=${periodStart}&end=${periodEnd}`
    3. **Customer Due:** `/transactions?type=SALE&status=active&unpaid=true`
    4. **Supplier Due:** `/transactions?type=SUPPLIER_BILL&status=active&unpaid=true`
    5. **Operating Expenses:** `/transactions?type=EXPENSE&start=${periodStart}&end=${periodEnd}`
    6. **Estimated Profit:** Badged `Unavailable` with click-to-open explanatory modal.

---

### Task 6: Responsive Ledger & Filter Overflow Fix (Screen 6)

**Files:**
- Modify: `src/app/(dashboard)/transactions/page.tsx`
- Modify: `src/components/TransactionList.tsx`
- Test: `tests/unit/ledger-responsive.test.ts`

**Changes & Interfaces:**
- Reorganize search and filter container:
  - Row 1: Full-width search bar with leading search icon.
  - Row 2: `grid grid-cols-2 gap-2` containing Type select and Status select. Zero horizontal scroll at $320\text{px}$.
- Support incoming query params: `type`, `view`, `start`, `end`, `unpaid` to support exact dashboard drill-downs.
- Group transactions chronologically with date section headers (e.g. `October 15, 2026 (4 records)`).
- Mobile cards show clean split breakdown: `Cash: 1,500 | Due: 500`.

---

### Task 7: Evidence-Based Financing Readiness (Screen 7)

**Files:**
- Modify: `src/app/api/readiness/route.ts`
- Modify: `src/app/(dashboard)/readiness/page.tsx`
- Test: `tests/unit/readiness-logic.test.ts`

**Changes & Interfaces:**
- 6 Evidence-Based Categories:
  1. `Trade License & Business Registration`: Status derived from user-reported license number or documented toggle. Not inferred from profile name.
  2. `Bookkeeping Records`: Status derived from active transaction count in ledger ($\ge 10$ records across categories).
  3. `Customer Credit & Receivables`: Status derived from credit sales and reconciled repayments.
  4. `Supplier Invoices & Payments`: Status derived from supplier bills and recorded payments.
  5. `Owner Identity & KYC Records`: Marked `Needs Attention` with guidance to prepare Smart NID and utility bills. Never claims email auth proves NID.
  6. `Bank or Merchant MFS Account`: Marked `Needs Attention` with guidance to maintain dedicated business accounts. Never claims currency proves an account.
- Dynamic completion calculation: $N$ documented out of 6 items ($\text{round}((N / 6) \times 100)\%$).
- Prominent non-predicative disclaimer banner:
  *"This checklist helps you prepare your records. It does not predict or guarantee loan approval."*

---

### Task 8: Gemini API Runtime Adapter & Structured Extraction

**Files:**
- Create: `src/lib/ai/gemini-provider.ts`
- Modify: `src/lib/ai/adapter.ts`
- Modify: `src/app/api/transactions/extract/route.ts`
- Modify: `src/app/api/voice/transcribe/route.ts`
- Test: `tests/unit/gemini-provider.test.ts`

**Changes & Interfaces:**
- Implement `GeminiProvider` implementing `TextExtractionProvider` and `SpeechTranscriptionProvider`:
  - Transcription: Calls Gemini model with audio buffer.
  - Extraction: Uses structured JSON schema mode enforcing `transactionDraftSchema`.
- Server-side fallback: If `GEMINI_API_KEY` is not present, cleanly falls back to `MockProvider` and tags response with `provider: "mock"`.
- Never perform math in the LLM. Server validates $0 \le \text{collected} \le \text{total}$ and derives customer due.

---

## Complete End-to-End Verification Plan

### Automated Test Suite
```powershell
# Run complete test suite (unit + integration)
npm.cmd test

# Run TypeScript static check
npm.cmd run typecheck

# Run production build
npm.cmd run build
```

### End-to-End User Flow Tests (Automated & Probed)
1. **Flow A (Voice FAB Flow):**
   - Click Voice FAB -> Modal opens -> Recording waveform activates -> Stop recording -> `/api/voice/transcribe` returns English transcript -> `/api/transactions/extract` returns structured draft -> `TransactionReviewCard` displays fields -> User clicks `Confirm & Save` -> Persisted to ledger.
2. **Flow B (Manual FAB Flow):**
   - Click Manual FAB -> Manual form opens -> User enters Sale 2,000, selects Partially Paid, enters 1,500 cash -> Customer Due displays 500 automatically -> Click Review -> Review card verifies balance -> Confirm & Save.
3. **Flow C (Dashboard Drill-Down Flow):**
   - Dashboard Weekly view (12–18 Oct 2026) -> Click Sales card -> Opens `/transactions?type=SALE&start=2026-10-12&end=2026-10-18` -> Ledger displays exactly the transactions summed in the dashboard total.
4. **Flow D (Period Selection Flow):**
   - Switch Daily -> Weekly -> Monthly.
   - Verify Daily shows `Today · 15 Oct 2026`.
   - Verify Weekly shows `This Week · 12–18 Oct 2026` (Monday-start).
   - Verify Monthly shows `This Month · 1–31 Oct 2026`.
   - Verify zero `undefined` values appear in DOM.
5. **Flow E (Insecure Context & Diagnostic Flow):**
   - Simulate `window.isSecureContext === false` -> Voice recorder displays clear HTTPS notice with instant "Type Note" action -> User types note and proceeds smoothly.
6. **Flow F (Readiness Checklist State Flow):**
   - Add transactions -> Bookkeeping records status updates -> Dynamic percentage updates ($N/6$).
   - Confirm KYC and Bank Account items show `Needs Attention` without false claims.

---

## Known Blockers & Limitations
- **Google Gemini API Key:** Requires `GEMINI_API_KEY` in `.env.local`. When not provided, application runs in fully functional synthetic demo mode using `MockProvider`.
- **LAN Mobile Microphone Access:** Mobile browsers require HTTPS or localhost port forwarding for `getUserMedia`. In plain HTTP LAN testing, the diagnostic will guide the user to text entry fallback.
