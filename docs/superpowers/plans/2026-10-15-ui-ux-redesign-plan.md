# DokanSaathi — UI/UX Redesign Implementation Plan (v1.0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing DokanSaathi MVP into a competition-grade, mobile-first, highly polished SME Finance Copilot matching the 7-screen reference visual mockup and `DokanSaathi_UI_UX_Blueprint_v1.md`, while resolving all identified bugs (`Period: undefined`, clipped mobile ledger filters, silent full-payment default, unsupported readiness claims, and voice insecure-context failure).

**Architecture:** Light-first, calm financial design tokens (Tailwind + CSS variables); global floating quick actions (Voice FAB + Manual Entry FAB) with mobile bottom-navigation integration; robust client-side browser capability and secure-context diagnostics for voice; deterministic period calculations with human-readable date formatting; strict separation of draft states from persisted ledger records.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS, shadcn/ui primitives (Radix), Lucide React, Vitest.

**Spec Authorities:**
1. `DokanSaathi_UI_UX_Blueprint_v1.md` (Design and Interaction Authority)
2. `01_dokansaathi_master_prd_v2.md` (Product Scope Authority)
3. `02_dokansaathi_agent_architecture_v2.md` (Technical Architecture Authority)
4. `03_dokansaathi_competition_and_field_research_guide_v2.md` (Domain & SME Authority)

---

## Global Constraints

- **Language:** 100% English UI text, transcripts, errors, labels, tooltips, and dialogues. No multilingual mixing in MVP.
- **Approved Transaction Types:** Strictly the 5 approved types: `SALE`, `CUSTOMER_PAYMENT`, `SUPPLIER_BILL`, `SUPPLIER_PAYMENT`, `EXPENSE`.
- **Zero Silent Persistence:** No financial record may be committed to the database without explicit user execution of `Confirm and Save`.
- **Deterministic Math:** Pure server/application calculation functions; the language model is never permitted to perform authoritative math or ledger mutations.
- **Strict Scope Boundaries:** No inventory or stock tracking, no 7-day cash flow forecast, no automated loan-approval predictions, no payment execution, no native mobile apps.
- **Responsive Viewport Support:** Flawless rendering from $320\text{px}$ up to $1440\text{px}$ without horizontal page scrolling or clipped controls.

---

## Review Focus (Root Cause Investigations & High-Risk Failure Modes)

1. **Voice Insecure Context Failure (`http://192.168.0.117:3000` vs `https://`)**:
   - *Root Cause:* Per W3C Media Capture specification, `navigator.mediaDevices` is restricted to secure contexts (`window.isSecureContext === true`). When a mobile phone accesses the local network via plain HTTP (`http://192.168.0.117:3000`), `navigator.mediaDevices` is `undefined`. The previous code threw a generic *"Voice recording is not supported in this browser"*, misleading the user into thinking the browser or transcription service failed.
   - *Resolution:* Implement explicit pre-flight diagnostic in `VoiceRecorder` distinguishing: (a) Insecure HTTP context (`!window.isSecureContext`) with clear guidance and immediate text fallback, (b) Missing hardware (`NotFoundError`), (c) Permission denied (`NotAllowedError`), (d) Unsupported MIME types with multi-codec detection (`audio/webm`, `audio/mp4`, `audio/aac`), (e) Network/upload error, and (f) Transcription service status.
2. **Dashboard `Period: undefined (undefined to undefined)` Bug**:
   - *Root Cause:* In `src/app/api/dashboard/route.ts`, `boundaries` returns `{ period, periodStart, periodEnd }`. In `src/app/(dashboard)/dashboard/page.tsx`, the client component expected `{ formattedRange, startDate, endDate }`, resulting in `undefined` values being rendered directly to the user.
   - *Resolution:* Add human-friendly range formatting to `getPeriodBoundaries` (e.g. `Today · 15 Oct 2026`, `This Week · 13–19 Oct 2026`, `This Month · October 2026`) and align client types with the exact API contract.
3. **Silent Full-Payment Default in Manual Form**:
   - *Root Cause:* In `src/components/ManualTransactionForm.tsx` (lines 55–57), leaving `amountCollected` blank silently defaulted to 100% full payment (`collectedStr = parsedAmount.toFixed(2)`), silently distorting credit sales (*bakir khata*).
   - *Resolution:* Make cash collected explicit with clear choices and auto-calculate remaining customer due in real-time, preventing silent assumptions.
4. **Clipped Mobile Ledger Filters**:
   - *Root Cause:* In `src/app/(dashboard)/transactions/page.tsx`, the search and filter bar used `flex gap-2` with two `<select>` dropdowns and a search button on a single line, causing horizontal overflow and clipped text on $320\text{px}$ mobile screens.
   - *Resolution:* Implement responsive grid layout (`grid-cols-2 gap-2` for dropdowns, full-width search input) ensuring zero overflow at $320\text{px}$.
5. **Unsupported Readiness Verification Claims**:
   - *Root Cause:* `src/app/api/readiness/route.ts` marked Owner KYC as `"ready"` with evidence `"Owner account authenticated"`, and claimed configured currency proved a bank account. It also invented an unapproved 30-day minimum record rule.
   - *Resolution:* Strictly align readiness statuses with `DokanSaathi_UI_UX_Blueprint_v1.md`: KYC remains `"Needs Attention / Unverified"` until verified, currency configuration does not imply a bank account, remove arbitrary rules, and enforce the mandatory non-predicative disclaimer.

---

## Visual Design Reference & Color Tokens (Blueprint v1.0)

| Token Name | Proposed Value | Usage |
| :--- | :--- | :--- |
| `--background` | `#F8FAFC` | Calm light app background |
| `--card` | `#FFFFFF` | Primary card & surface background |
| `--primary` | `#2563EB` | DokanSaathi signature blue (FAB, primary CTAs) |
| `--success` | `#16A34A` | Sale, verified records, positive cash flow |
| `--warning` | `#F59E0B` | Customer receivables, pending review, attention |
| `--error` | `#EF4444` | Recording stop, expense, void actions, errors |
| `--border` | `#E2E8F0` | Subtle clean card and control borders |
| `--text-primary` | `#0F172A` | High contrast, accessible slate text |
| `--text-muted` | `#64748B` | Secondary explanations and timestamps |

---

## File-by-File Implementation Tasks

### Task 1: Design Tokens & Global Floating Action Buttons (FAB)

**Files:**
- Modify: `src/app/globals.css` (align tokens with `#F8FAFC`, `#2563EB`, `#16A34A`, `#F59E0B`, `#EF4444`)
- Create: `src/components/FloatingActions.tsx` (stacked Voice FAB & Manual Entry FAB)
- Create: `src/components/VoiceActionDialog.tsx` (accessible bottom-sheet / modal for quick voice entry)
- Modify: `src/app/(dashboard)/layout.tsx` (integrate FloatingActions with bottom nav and mobile safe area)
- Test: `tests/unit/floating-actions.test.tsx`

**Key Behavior:**
- Stacked floating actions on bottom-right (`right-4 bottom-20 md:bottom-6 z-40`).
- Primary FAB: Blue circular button (`w-14 h-14`), mic icon, label `Record a transaction`.
- Secondary FAB: White/light outlined circular button (`w-12 h-12`), pen icon, label `Enter a transaction manually`.
- Automatically hidden on `/transactions/new` (to prevent duplicate entry controls) and when modals are active.
- Tapping Mic opens `VoiceActionDialog` with full recording waveform, live timer, and instant text fallback.
- Tapping Pen navigates directly to `/transactions/new?tab=manual` or opens manual entry.

---

### Task 2: Fix Dashboard Date Period Bug & Implement Blueprint Layout

**Files:**
- Modify: `src/lib/finance/periods.ts` (enrich `PeriodBoundaries` with `formattedRange`, `label`, and human dates)
- Modify: `src/app/api/dashboard/route.ts` (return enriched boundaries and validated metrics)
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (redesign to match Screen 1: greeting, date pill dropdown, 6 metric cards, click-to-drill-down)
- Test: `tests/unit/periods.test.ts` (verify human-readable formatting across daily, weekly, monthly in `Asia/Dhaka`)
- Test: `tests/integration/dashboard-api.test.ts` (verify no `undefined` values returned)

**Key Behavior:**
- Fix `Period: undefined (undefined to undefined)`: Render `Today · 15 Oct 2026`, `This Week · 13–19 Oct 2026`, `This Month · October 2026`.
- 6 Metric Cards with distinct, accessible icons and clean borders:
  1. **Sales** (`#16A34A` trending up icon): Period total goods & services sold.
  2. **Cash Collected** (`#2563EB` wallet icon): Cash at sale + customer payments received.
  3. **Customer Due** (`#F59E0B` user group icon): Cumulative unpaid customer credit.
  4. **Supplier Due** (`#8B5CF6` box icon): Cumulative unpaid supplier payables.
  5. **Operating Expenses** (`#EF4444` receipt icon): Period operating overheads.
  6. **Estimated Profit** (`#64748B` chart icon): Clearly badges `Unavailable` with reason: *"Cost data is incomplete. DokanSaathi does not invent estimated figures."*
- Click any card to drill down directly into `/transactions?type=...` or `/transactions?metric=...`.

---

### Task 3: Robust Voice Diagnostics & Modern Recording Interface

**Files:**
- Modify: `src/components/VoiceRecorder.tsx` (full diagnostic engine, waveform visualization, suggestion chips)
- Modify: `src/app/api/voice/transcribe/route.ts` (improved status signaling and mock identification)
- Test: `tests/unit/voice-diagnostics.test.ts` (mock secure vs insecure context, permissions, and fallbacks)

**Key Behavior:**
- Pre-flight diagnostic:
  - Check `window.isSecureContext`: If `false` (e.g. LAN IP over HTTP), display: *"Microphone access requires a secure HTTPS connection or localhost on mobile devices. Please type your transaction note or use manual entry below."* with an instant "Type Note" action button.
  - Check `navigator.mediaDevices?.getUserMedia`: Display capability-specific guidance if missing.
  - Multi-MIME type fallback: Detect `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, `audio/aac` via `MediaRecorder.isTypeSupported()`.
- Recording UI (matches Screen 3):
  - Large pulsing circular mic button with dynamic waveform bars.
  - Elapsed timer display (`00:08`).
  - Helpful English prompt examples:
    - *"Sold groceries for 1200 taka, Rahim paid 800 cash"*
    - *"Paid 3000 to Meghna for goods"*
    - *"Paid 450 for electricity bill"*
  - Prominent red `Stop Recording` button.
  - One-tap Cancel and Switch to Text buttons.

---

### Task 4: Fix Manual Form Silent Payment Default & Implement Screen 5

**Files:**
- Modify: `src/components/ManualTransactionForm.tsx` (eliminate silent default, add real-time Customer Due calculation)
- Test: `tests/unit/manual-form.test.ts` (verify partial payment balancing and no silent full payment)

**Key Behavior:**
- Under `SALE`:
  - `Cash Collected at Sale` is an explicit input field with helper: *"Enter the amount actually received now. If customer owes money, enter the collected amount."*
  - Leaving blank displays validation warning or requires selecting `"Paid in Full"`, `"Partially Paid"`, or `"Unpaid / Credit"`.
  - Real-time auto-calculation of `Customer Due (BDT)` displayed directly below: `Total Amount - Cash Collected`.
- Preserves business currency dynamically from shop profile (no hardcoded BDT in field keys).
- Clear, step-by-step layout with accessible form controls and review CTA (`Review Draft ->`).

---

### Task 5: Enhance Review & Edit Draft Experience (Screen 4)

**Files:**
- Modify: `src/components/TransactionReviewCard.tsx` (match Screen 4 design, inline field editing badges, derived balances)
- Test: `tests/unit/review-card.test.ts`

**Key Behavior:**
- Badge: Sparkle icon with *"AI draft from your speech"* or *"Draft from note"*.
- Clean, structured card with clear row labels:
  - Transaction Type with `[Change]` trigger.
  - Total Amount with `[Edit]` trigger.
  - Cash Collected with `[Edit]` trigger.
  - Customer Due: Auto-calculated with badge: *"Will be tracked as receivable"*.
  - Transaction Date with `[Edit]` trigger.
  - Customer / Supplier Name with `[Edit]` trigger.
  - Note / Description.
- Primary Action: Large blue button: `✓ Confirm & Save`.
- Secondary Actions: `✎ Edit Details` and `✕ Cancel`.

---

### Task 6: Responsive Ledger & Fix Clipped Mobile Filters (Screen 6)

**Files:**
- Modify: `src/app/(dashboard)/transactions/page.tsx` (responsive 2-column filter grid on mobile)
- Modify: `src/components/TransactionList.tsx` (section transactions grouped by date, e.g. `October 15, 2026`)
- Test: `tests/unit/ledger-responsive.test.ts`

**Key Behavior:**
- Filter Bar at $320\text{px}$–$430\text{px}$:
  - Top row: Full-width search bar with leading search icon.
  - Bottom row: `grid grid-cols-2 gap-2` containing `Type` dropdown and `Status` dropdown.
  - Zero horizontal overflow, zero clipping of option text.
- Transaction Grouping:
  - Group transactions chronologically with date headers (`October 15, 2026 (4 records)`).
  - Cards highlight key details: Counterparty, Type badge, Total Amount, and split breakdown (*"Cash: 1,500 | Due: 500"*).
  - Floating Action Buttons remain active on Ledger screen for quick transaction entry.

---

### Task 7: Fix Unsupported Readiness Claims & Polish Screen 7

**Files:**
- Modify: `src/app/api/readiness/route.ts` (remove false claims, align statuses with real evidence)
- Modify: `src/app/(dashboard)/readiness/page.tsx` (match Screen 7: progress card, 6 verified SME items, disclaimer)
- Test: `tests/unit/readiness-logic.test.ts`

**Key Behavior:**
- Progress Card: *"4 of 6 Items Documented (67% complete)"* with progress bar.
- Statuses: Strictly `Documented`, `Needs Attention`, or `Unverified`.
- Items:
  1. Trade License & Business Registration: Status based on user documentation, not inferred from profile creation.
  2. Bookkeeping Records: Status based on active verified transaction count.
  3. Customer Credit & Receivables: Status based on credit sales and reconciled repayments.
  4. Supplier Invoices & Payments: Status based on supplier bills and reconciled payments.
  5. Owner Identity & KYC Records: Set to `Needs Attention` with guidance to prepare Smart NID and utility bills (removes the false claim that email auth proves NID).
  6. Bank or MFS Account: Set to `Needs Attention` with guidance to operate dedicated business accounts (removes the false claim that currency config proves a bank account).
  7. Remove invented 30-day minimum rule.
- Prominent non-predicative disclaimer: *"This checklist helps you prepare your records. It does not predict or guarantee loan approval."*

---

## Verification Plan

### Automated Tests
```powershell
# 1. Run all unit and integration tests
npm.cmd test

# 2. Run TypeScript strict typecheck
npm.cmd run typecheck

# 3. Verify production build
npm.cmd run build
```

### Mobile & Responsive Verification (Simulated & Device Probing)
- Verify viewport widths: $320\text{px}$, $360\text{px}$, $390\text{px}$, $430\text{px}$, $768\text{px}$, $1024\text{px}$, $1440\text{px}$.
- Verify FAB positioning: Floating action buttons sit $\ge 16\text{px}$ above bottom navigation and never overlap list items or form action buttons.
- Test voice diagnostic states: Insecure context banner appears on HTTP LAN URL, with instant fallback to text entry note.
- Verify manual form sale entry: Enter sale 2000 with cash 1500; verify customer due shows 500 automatically.
- Verify dashboard date display: Ensure `formattedRange` displays proper human date ranges without `undefined`.
- Verify ledger search & filters: Ensure filter dropdowns fit cleanly at $320\text{px}$ without horizontal page scroll.
- Verify readiness screen: Confirm no false verification claims appear, and the disclaimer is prominently displayed.

---

## Unresolved Blockers & Dependencies
- **SSL / HTTPS on Local Mobile Device:** Browsers enforce `window.isSecureContext` for microphone capture. Over plain LAN HTTP (`http://192.168.0.117:3000`), mobile browsers disable `getUserMedia`. Our diagnostic will clearly explain this and provide instant text entry fallback. For live microphone testing on physical mobile phones, HTTPS (e.g. ngrok or Cloudflare tunnel) or Chrome flag `unsafely-treat-insecure-origin-as-secure` is required.
