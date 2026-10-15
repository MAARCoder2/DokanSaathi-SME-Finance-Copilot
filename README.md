# DokanSaathi — English-first SME Finance Copilot for Small Businesses

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Tests Passing](https://img.shields.io/badge/tests-40%20passing-brightgreen)](#)
[![TypeScript](https://img.shields.io/badge/typescript-strict%205.7-blue)](#)
[![Next.js](https://img.shields.io/badge/next.js-15%20App%20Router-black)](#)
[![FinTechathon 2026](https://img.shields.io/badge/FinTechathon%202026-Topic%20E%20%7C%20International%20Track-blueviolet)](https://fintechathon.g-ican.com/#/en)

> **2026 Shenzhen International FinTech Competition (FinTechathon), International Track**  
> **Topic E:** SME Finance Copilot — *AI as a Financial Participant*  
> **Market Focus:** Micro and small retail shopkeepers in emerging economies (initially Bangladesh)  
> **Language:** English-only MVP baseline  

---

## 1. Executive Summary

Small retail shops and micro-merchants in emerging markets drive neighborhood commerce, yet millions remain excluded from formal finance. Their financial records are often trapped in informal paper credit books (*"bakir khata"*), paper memos, or fragmented memory.

Traditional accounting software requires shopkeepers to understand double-entry bookkeeping, chart of accounts, and debit/credit nomenclature. Conversely, unconstrained generic AI chat models introduce hallucinations, floating-point calculation errors, and data privacy risks.

**DokanSaathi** bridges this divide as an English-first SME Finance Copilot founded on an unyielding principle:  
**The language model generates structured drafts, but deterministic code executes calculations and the human business owner retains authoritative control.**

---

## 2. Core Architectural Principles & Invariants

```
[Shopkeeper Speech / Text]
           │
           ▼
[Ephemeral Transcription] (Voice boundary)
           │
           ▼
[AI Structured Extractor] (Prompt enforces strict schema; zero DB access)
           │
           ▼
[Unsaved Draft Payload] (In-memory only; zero persistence)
           │
           ▼
[Editable Review Card in UI] (Confirm / Edit / Cancel)
     ┌─────┴─────┐
  [Cancel]    [Confirm and Save]
     │           │
 (Discarded)  (Client Idempotency Key)
                 │
                 ▼
     [Server Zod & Invariant Validation]
                 │
                 ▼
     [Audited Database Insert] ──► [Ledger & Dashboard Update]
```

### The 5 Approved Transaction Types
1. `SALE`: Retail customer purchase. Splits into cash collected upfront vs. customer credit due.
2. `CUSTOMER_PAYMENT`: A customer pays toward past credit owed. Increases cash collected; **does not increase sales**.
3. `SUPPLIER_BILL`: Wholesale inventory purchased on credit. Creates a supplier payable.
4. `SUPPLIER_PAYMENT`: Payment made against an outstanding supplier bill. Reduces supplier payable; **does not create an operating expense**.
5. `EXPENSE`: Operating shop costs (rent, electricity, transport, wages).

### Critical Invariants Verified by Automated Tests
- **Zero Hallucinated Math:** The LLM does not perform financial arithmetic. Application code computes all totals using `decimal.js`.
- **Zero Unconfirmed Persistence:** No transaction can ever enter the database without explicit user confirmation.
- **Tenant Isolation:** PostgreSQL Row-Level Security (RLS) policies and server middleware guarantee User A can never inspect or alter User B's financial data.
- **Audited Soft-Deletes Only:** Physical database deletion is permanently blocked (`USING (false)` on DELETE). Voiding updates status to `voided` and logs to `transaction_audit_events`.
- **Truthful Profit Reporting:** Estimated profit is withheld (`insufficient_cost_data` / `null`) when wholesale item cost data is incomplete. DokanSaathi refuses to invent estimated numbers.

---

## 3. Technology Stack

- **Framework:** Next.js 15 (App Router) with React 19 & TypeScript 5.7 (Strict Mode)
- **Styling & UI:** Tailwind CSS, shadcn/ui accessible primitives, Lucide icons
- **Database & Auth:** Supabase (PostgreSQL with Row-Level Security)
- **Math Engine:** `decimal.js` (Exact decimal arithmetic, zero IEEE 754 precision loss)
- **AI Interface:** Provider-neutral LLM & Speech adapters with built-in offline mock provider
- **Testing:** Vitest with jsdom & forks worker pool

---

## 4. Quickstart & Local Run

### Prerequisites
- Node.js 18.18+ or 20+
- npm 9+ or pnpm 8+

### Step-by-Step Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd dokansaathi

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local

# 4. Run development server (runs with offline mock provider by default)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 5. Verification Commands & Test Results

Run all test suites and static checks:
```bash
# Run unit & integration test suite (40 tests across 7 test files)
npm test

# Run TypeScript type safety verification
npm run typecheck

# Run production build
npm run build
```

### Verified Test Summary (100% Passing)
```text
 ✓ tests/unit/finance-calculator.test.ts (12 tests)
 ✓ tests/unit/periods.test.ts (4 tests)
 ✓ tests/integration/api-endpoints.test.ts (4 tests)
 ✓ tests/unit/validation.test.ts (5 tests)
 ✓ tests/unit/mock-ai.test.ts (7 tests)
 ✓ tests/integration/rls-isolation.test.ts (4 tests)
 ✓ tests/unit/ledger-invariants.test.ts (4 tests)

 Test Files  7 passed (7)
      Tests  40 passed (40)
```

---

## 6. Project Documentation Suite

- [`docs/core-algorithms.md`](docs/core-algorithms.md): Full mathematical formulas, invariant proofs, and period boundary definitions.
- [`docs/security-design.md`](docs/security-design.md): Database RLS policies, multi-tenant isolation, and audit trail design.
- [`docs/security-self-assessment.md`](docs/security-self-assessment.md): Threat model, OWASP Top 10 mitigation, prompt injection defense.
- [`docs/deployment-guide.md`](docs/deployment-guide.md): Production deployment guide for Vercel and Supabase.
- [`docs/demo-script.md`](docs/demo-script.md): 3-minute pitch and live walkthrough for FinTechathon 2026 International Track Topic E.

---

## 7. Compliance & Regulatory Boundaries

DokanSaathi is an organizational financial copilot and recordkeeping system.
- **No Loan Guarantees:** The Financing Record Readiness Checklist provides transparent record organization criteria. It prominently displays disclaimers that it does not guarantee loan approval or credit scoring from any financial institution.
- **No Payment Execution:** DokanSaathi does not process payments, handle money transfers, or hold deposits.
- **No Unapproved Features:** Inventory tracking and 7-day cash flow forecasting are strictly excluded from the MVP scope.

---

## 8. License

Developed for the 2026 Shenzhen International FinTech Competition (FinTechathon), International Track.
