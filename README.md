# DokanSaathi — English-first SME Finance Copilot for Small Businesses

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Tests Passing](https://img.shields.io/badge/tests-68%20passing-brightgreen)](#)
[![TypeScript](https://img.shields.io/badge/typescript-strict%205.7-blue)](#)
[![Next.js](https://img.shields.io/badge/next.js-15%20App%20Router-black)](#)
[![FinTechathon 2026](https://img.shields.io/badge/FinTechathon%202026-Topic%20E%20%7C%20International%20Track-blueviolet)](https://fintechathon.g-ican.com/#/en)

> **2026 Shenzhen International FinTech Competition (FinTechathon), International Track**  
> **Topic E:** SME Finance Copilot — *AI as a Financial Participant*  
> **Target Segment:** Micro-merchants and small retail shopkeepers in emerging economies (initial market: Bangladesh)  
> **Language Baseline:** 100% English UI for international competition evaluation  

---

## 1. Executive Summary

Micro-merchants and neighborhood retail shopkeepers drive the informal economies of developing nations. Yet millions remain locked out of formal banking and credit facilities because their financial transactions are recorded in informal paper books (*"bakir khata"*), paper memos, or fragmented memory.

Traditional commercial accounting software requires shopkeepers to understand double-entry bookkeeping, chart of accounts, and debit/credit ledger structures. Conversely, unconstrained generic AI chat models introduce hallucinations, floating-point precision loss, and data privacy risks.

**DokanSaathi** bridges this divide as an English-first SME Finance Copilot founded on an unyielding architectural principle:  
**The language model generates structured drafts, but deterministic code computes all finances and the human business owner retains authoritative control.**

---

## 2. Core Architectural Principles & Invariants

```
[Shopkeeper Speech / Voice]        [Text Note / Manual Form]
            │                                  │
            ▼                                  │
[Ephemeral Audio File]                         │
            │                                  │
            ▼                                  │
[Gemini 3.5 Transcribe / STT]                 │
            │                                  │
            ▼                                  ▼
   [English Natural Text] ────────► [AI Structured Extractor]
                                    (gemini-3.5-flash-lite / Mock)
                                    (Zero DB write access)
                                               │
                                               ▼
                                    [In-Memory Draft Payload]
                                    (Zero direct DB persistence)
                                               │
                                               ▼
                                    [TransactionReviewCard in UI]
                                       ┌───────┴───────┐
                                    [Cancel]    [Confirm and Save]
                                       │               │
                                   (Discarded)   (Idempotency Key)
                                                       │
                                                       ▼
                                          [Server Invariant Validation]
                                                       │
                                                       ▼
                                          [PostgreSQL Audited Insert]
                                                       │
                                                       ▼
                                          [Ledger & Dashboard Update]
```

### The 5 Approved Transaction Types
1. **`SALE`**: Retail customer sale. Splits into upfront cash collected vs. customer receivable (credit due).
2. **`CUSTOMER_PAYMENT`**: Customer pays toward past credit owed. Increases cash collected; **does not increase sales**.
3. **`SUPPLIER_BILL`**: Wholesale inventory purchased on credit. Creates a supplier payable.
4. **`SUPPLIER_PAYMENT`**: Payment made against an outstanding supplier bill. Reduces supplier payable; **does not create an operating expense**.
5. **`EXPENSE`**: Operating shop costs (rent, electricity, transport, wages).

### Critical Invariants Verified by Automated Tests
- **Zero Hallucinated Math:** The LLM does not perform financial arithmetic. Application code computes all totals using `decimal.js`.
- **Zero Unconfirmed Persistence:** No transaction can ever enter the database without explicit user confirmation.
- **Tenant Isolation:** PostgreSQL Row-Level Security (RLS) policies and server middleware guarantee User A can never inspect or alter User B's financial data.
- **Audited Soft-Deletes Only:** Physical database deletion is permanently blocked (`USING (false)` on DELETE). Voiding updates status to `voided` and logs to `transaction_audit_events`.
- **Truthful Profit Reporting:** Estimated profit is withheld (`insufficient_cost_data` / `null`) when wholesale item cost data is incomplete. DokanSaathi refuses to invent estimated numbers.

---

## 3. UI/UX Redesign Scope (Tasks 1–8 Fully Implemented)

| Screen / Feature | Implementation Details | Verified Commit |
| :--- | :--- | :--- |
| **Task 1: Calendar & Periods** | Monday-start week (`12–18 Oct 2026`), human formattedRange, `asOf` date balance query, timezone safety | `b4eeb7f` |
| **Task 2: Voice Diagnostics** | Multi-layer client/server voice diagnostics, `data.transcript` payload key fix, 10MB limit, 3-state transcription | `957e69a` |
| **Task 3: Gemini Integration** | GeminiProvider for `gemini-3.5-flash-lite` (extraction) and `gemini-3.5-transcribe` (Files API STT) | `62d36ce` |
| **Task 4: Global Floating Actions** | Fixed-bottom floating action buttons (`FloatingActions.tsx`, `VoiceCaptureDialog.tsx`, `pb-28` collision avoidance) | `1e4467c` |
| **Task 5: Manual Entry Form** | Redesigned manual form eliminating silent payment defaults, explicit payment status and due breakdown | `6de2fb5` |
| **Task 6: Dashboard Redesign** | Screen 1 redesign with Net Cash Flow banner, exact drill-down URLs, and period boundary sync | `3064007` |
| **Task 7: Responsive Ledger** | Responsive 2-column filter grid (`grid-cols-2`), chronological date grouping, drill-down integration, `<Suspense>` | `322fb9c` |
| **Task 8: Financing Readiness** | 6 evidence-based readiness categories, source provenance, dynamic score & statutory disclaimer | `870115a` |

---

## 4. Technology Stack

- **Framework:** Next.js 15 (App Router) with React 19 & TypeScript 5.7 (Strict Mode)
- **Styling & UI:** Tailwind CSS, shadcn/ui accessible primitives, Lucide icons
- **Database & Auth:** Supabase (PostgreSQL with Row-Level Security)
- **Math Engine:** `decimal.js` (Exact decimal arithmetic, zero IEEE 754 precision loss)
- **AI Runtime:** Dual-mode architecture supporting offline mock provider and Google Gemini (`gemini-3.5-flash-lite`, `gemini-3.5-transcribe`)
- **Testing:** Vitest with jsdom & forks worker pool

---

## 5. Quickstart & Local Installation

### Prerequisites
- Node.js 18.18+ or 20+
- npm 9+ or pnpm 8+

### Step-by-Step Setup
```bash
# 1. Clone the repository
git clone https://github.com/MAARCoder2/DokanSaathi-SME-Finance-Copilot.git
cd DokanSaathi-SME-Finance-Copilot

# 2. Install dependencies
npm install

# 3. Configure environment variables (runs with offline mock provider by default)
cp .env.example .env.local

# 4. Run development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 6. Runtime Provider Configuration

DokanSaathi includes a zero-dependency **offline mock provider** for instant demonstration and automated testing, alongside live cloud integrations.

### Mode A: Offline Mock Provider (Default)
In `.env.local`:
```env
AI_PROVIDER=mock
SPEECH_PROVIDER=mock
```
- No external API keys required.
- Extracts standard retail patterns (`"sold rice for 500 cash"`, `"paid 1000 rent"`).
- Enables 100% test suite execution offline.

### Mode B: Live Google Gemini Integration
In `.env.local`:
```env
AI_PROVIDER=gemini
AI_API_KEY=your_google_gemini_api_key
AI_MODEL_NAME=gemini-3.5-flash-lite
SPEECH_PROVIDER=gemini
SPEECH_API_KEY=your_google_gemini_api_key
```
- Uses `gemini-3.5-flash-lite` for high-speed structured English draft extraction.
- Uses `gemini-3.5-transcribe` via the Google Generative AI Files API for voice transcription.
- **Privacy Notice:** Free-tier Gemini endpoints may log prompts for model improvement under Google's standard terms. Enterprise accounts should use paid Tier 1 with data-sharing disabled.

### Microphone Secure Context & Manual Fallback
Web Audio capture (`MediaRecorder`) requires a secure browser context:
- Supported on `localhost` or HTTPS domains.
- If microphone access is denied or unavailable, DokanSaathi provides instant fallback:
  1. English Text Note input (`/transactions/new`).
  2. Structured Manual Entry form (`/transactions/new?tab=manual`).

---

## 7. Supabase Database Setup & Migrations

For live PostgreSQL persistence:
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Run the versioned migration:
   ```sql
   -- File: supabase/migrations/001_initial_schema.sql
   ```
4. Configure keys in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

---

## 8. Verification Commands & Test Results

Run all test suites and static checks:
```bash
# Run unit tests (50 tests across 8 files)
npm run test:unit

# Run integration tests (18 tests across 5 files)
npm run test:integration

# Run entire test suite (68 tests across 13 files)
npm test

# Run strict TypeScript typecheck
npm run typecheck

# Run production build
npm run build
```

### Verified Test Summary (100% Passing)
```text
 ✓ tests/unit/finance-calculator.test.ts (12 tests)
 ✓ tests/unit/manual-form-calculation.test.ts (8 tests)
 ✓ tests/unit/mock-ai.test.ts (7 tests)
 ✓ tests/unit/periods.test.ts (6 tests)
 ✓ tests/unit/voice-diagnostics.test.ts (5 tests)
 ✓ tests/unit/validation.test.ts (5 tests)
 ✓ tests/unit/ledger-invariants.test.ts (4 tests)
 ✓ tests/unit/gemini-provider.test.ts (3 tests)
 ✓ tests/integration/ledger-drilldown.test.ts (4 tests)
 ✓ tests/integration/readiness-audit.test.ts (4 tests)
 ✓ tests/integration/rls-isolation.test.ts (4 tests)
 ✓ tests/integration/api-endpoints.test.ts (4 tests)
 ✓ tests/integration/dashboard-periods.test.ts (2 tests)

 Test Files  13 passed (13)
      Tests  68 passed (68)
   Duration  44.41s
```

---

## 9. Project Documentation Suite

- [`docs/core-algorithms.md`](docs/core-algorithms.md): Full mathematical formulations, invariant proofs, and period boundary definitions.
- [`docs/security-design.md`](docs/security-design.md): Database RLS policies, multi-tenant isolation, and audit trail architecture.
- [`docs/security-self-assessment.md`](docs/security-self-assessment.md): Threat modeling, OWASP mitigation, prompt injection defense.
- [`docs/deployment-guide.md`](docs/deployment-guide.md): Production deployment guide for Vercel and Supabase.
- [`docs/demo-script.md`](docs/demo-script.md): 3-minute pitch and live walkthrough for FinTechathon 2026 International Track Topic E.

---

## 10. Compliance & MVP Scope Boundaries

DokanSaathi is an organizational financial copilot and recordkeeping system.
- **No Loan Guarantees:** The Financing Record Readiness Checklist prominently displays the statutory disclaimer:
  > *"This checklist helps you prepare your business records. DokanSaathi does not approve loans or guarantee financing. Final decisions are made by financial institutions."*
- **No Direct Money Movement:** DokanSaathi does not process payments, handle money transfers, or hold bank deposits.
- **Scope Discipline:** Inventory tracking, 7-day cash flow forecasting, and automated loan approval algorithms are strictly excluded from the MVP scope.

---

## 11. Competition Submission & License

Developed for the **2026 Shenzhen International FinTech Competition (FinTechathon), International Track (Topic E)**.  
All rights reserved by the author.
