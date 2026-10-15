# DokanSaathi — Agent Architecture, Data Contracts & System Prompts

**Project:** DokanSaathi — English-first SME Finance Copilot  
**Competition:** 2026 Shenzhen International FinTech Competition (FinTechathon), International Track  
**Selected track:** Topic E — SME Finance Copilot  
**Document version:** 2.0  
**Status:** Approved architecture baseline for MVP implementation  
**Related source of truth:** `01_dokansaathi_master_prd_v2.md`  
**MVP platform:** Responsive, online-first Web App / PWA; native Android is out of scope  
**MVP language:** English only

> **Authority rule:** The Master PRD defines product scope and financial behavior. This architecture document explains how to implement those requirements. If this document and the Master PRD conflict, follow the Master PRD, stop the conflicting implementation, and record the discrepancy for review. Do not add features that are not approved in the PRD.

---

## 1. Architecture Objectives and Boundaries

DokanSaathi turns a small-business owner's English voice or text description into a structured financial draft, validates it, asks the user to resolve material ambiguity, and saves it only after explicit confirmation. It then shows ledger-backed financial summaries and a transparent financial-record readiness checklist.

The MVP is a recordkeeping and decision-support product, not a bank, payment processor, loan broker, lender, or loan-approval predictor.

### 1.1 Required architecture properties

1. **English-first end to end:** input transcript, visible UI, prompts, clarification questions, errors, and generated explanations are English in the MVP.
2. **One fixed core schema:** transaction types, validation rules, permissions, and calculation rules are version-controlled application code. The model cannot create tables, change database schema, or alter production rules.
3. **Draft before persistence:** extraction and validation endpoints do not write financial transactions. Only an authenticated, validated, user-confirmed save operation may persist a transaction.
4. **Deterministic financial logic:** monetary arithmetic, receivable/payable balances, period totals, and data-completeness calculations come from application code and trusted database records, not free-form LLM responses.
5. **Server-side trust boundary:** API keys and privileged database credentials remain server-side. Client-supplied totals, identities, permissions, and relationship IDs are untrusted until revalidated.
6. **Business-level isolation:** users can access only their authorized businesses and records. Enforce this in server authorization and Supabase Row Level Security (RLS), not merely by hiding UI controls.
7. **Graceful fallback:** if AI or speech transcription fails, the user can use text or manual entry. A failure must never appear as a successful save.
8. **Responsive and accessible:** implement mobile-first layouts and test the full user workflow across representative mobile, tablet, and desktop viewports.

### 1.2 Explicitly excluded from MVP

- Seven-day or other predictive cash-flow forecasting, shortage prediction, liquidity matrices, and forecast recommendation prompts.
- Inventory/stock balances, stock deduction, low-stock alerts, reorder suggestions, or inventory tables.
- Bangla or other non-English UI, prompts, transcription, or responses.
- Native Android/iOS app packaging, robust offline sync, and offline transaction queues.
- Loan eligibility prediction, credit scoring, lender matching, loan submission, loan approval claims, or execution of financial transactions.
- Automatic schema generation, migrations, prompt mutation, or model updates triggered by user corrections.
- Automatic opening balances, automatically seeded transactions, or historical-ledger imports unless separately approved.

Do not create dormant MVP routes or screens for excluded features. Future roadmap notes may describe them but must not be connected to the active user interface or transaction pipeline.

---

## 2. Approved Technology Stack

The following stack is approved for MVP implementation and must be used unless the project owner approves a change after a documented conflict is found in the existing repository.

| Layer | Approved choice | Responsibility |
|---|---|---|
| Web framework | Next.js App Router | Page rendering, routing, server-side endpoints, and application composition |
| Language | TypeScript | Typed contracts for client/server boundaries and transaction payloads |
| Styling | Tailwind CSS | Responsive, mobile-first layout and design tokens |
| UI components | shadcn/ui | Reusable accessible interface components, reviewed and adapted as needed |
| Authentication | Supabase Auth | User authentication and session handling |
| Database | Supabase PostgreSQL | Relational records, constraints, and transaction relationships |
| Data authorization | PostgreSQL constraints and Supabase RLS, plus server-side checks | Business data isolation and least-privilege access |
| Hosting | Vercel | Next.js deployment and server runtime/environment configuration |
| AI and speech providers | Not yet selected | Provider adapters must remain replaceable; credentials and calls are server-side |

### 2.1 Repository-first implementation

Before changing code, inspect the repository, existing framework, installed dependencies, routes, auth setup, database schema/migrations, environment variables, deployment settings, and tests. Do not overwrite functioning work blindly. If the existing repository conflicts with the approved stack, document the specific conflict and request review before migrating or replacing it.

### 2.2 Provider-neutral boundary

Do not hard-code a specific LLM or speech-to-text vendor into the domain model. Add interfaces/adapters such as `TextExtractionProvider` and `SpeechTranscriptionProvider`. The exact provider, service pricing, latency, language support, and operational limits remain implementation decisions to verify before configuration. Do not claim a provider has been selected in the UI or technical documentation until that decision is made.

---

## 3. Component Responsibilities

```text
Browser / PWA
  ├─ English voice capture and transcript review
  ├─ English text and manual transaction forms
  ├─ Draft review: Confirm / Edit / Cancel
  ├─ Daily / Weekly / Monthly dashboard
  └─ Financial-record readiness checklist
              │ authenticated HTTPS requests
              ▼
Next.js Server/API Layer
  ├─ Authentication and business authorization
  ├─ Input validation and fixed-schema parsing
  ├─ AI extraction / clarification provider adapter
  ├─ Optional speech-to-text provider adapter
  ├─ Deterministic financial calculation service
  ├─ Confirmed transaction write service
  └─ Redacted operational logging
              │ user-scoped queries / controlled server access
              ▼
Supabase Auth + PostgreSQL
  ├─ Businesses and user ownership
  ├─ Transactions and linked obligations/payments
  ├─ Audit events for saved-record changes
  ├─ Readiness checklist items
  └─ Correction feedback where consented and configured
```

### 3.1 Client UI

The browser is responsible for capturing user input, showing transcripts, displaying draft fields, collecting edits and explicit confirmation, and rendering server-provided summaries. The client is not a trusted source of financial totals or permissions. Do not store provider API keys in browser storage, client code, or public environment variables.

### 3.2 AI extraction component

The AI extracts candidate information and identifies ambiguity. Its output is untrusted structured data and must pass schema validation. Extraction must not create records, issue schema mutations, access arbitrary businesses, or execute financial actions.

### 3.3 Deterministic financial service

Application code validates decimal values, computes receivables/payables, applies linked payments, derives dashboard totals, filters by period and business time zone, and returns machine-readable results. Do not use an LLM to calculate authoritative totals or replace these computations with natural-language estimates.

### 3.4 Persistence service

A transaction is persisted only after authentication, ownership checks, schema validation, relationship validation, duplicate-prevention/idempotency checks, and explicit confirmation. When an input creates multiple linked records (for example, a supplier bill and an immediate payment), save the whole confirmed batch atomically or save none of it.

### 3.5 Financial-record readiness component

This component reports facts backed by saved records and user-reviewed checklist entries. It must not infer loan approval, creditworthiness, universal lender rules, or mandatory document timelines without specific verified lender/program information.

---

## 4. Workflow Pipeline

### Stage 1 — Input capture

Supported sources:

- `voice`: audio is transcribed to English text by a supported browser capability or selected speech provider.
- `text`: user enters a free-text English description.
- `manual`: user directly fills a transaction form without AI extraction.

The interface must show a transcript before an AI-extracted voice draft is confirmed. If microphone permission is denied, recording is unsupported, no speech is detected, or transcription fails, show an English explanation and allow text/manual entry.

### Stage 2 — Extraction to draft

The extraction component may produce one or more draft transactions from a single statement. Drafts must use only the fixed transaction types listed in Section 5. Do not infer a payment date, due date, opening balance, currency conversion, party name, or payment status that the user has not said or confirmed.

For each material field, the application may track confidence internally for review/clarification routing. Do not imply that a model confidence value proves correctness.

### Stage 3 — Validation and clarification

Run structural and business-rule validation in TypeScript/server code. If a required field is absent or materially ambiguous, return the draft with a focused English clarification question. Do not persist a transaction at this stage.

Examples that require clarification:

- “I sold 2,000 today” without enough information to determine how much was collected and how much remains due.
- “I need to give the supplier 12,000” where it is unclear whether this is a new bill, an existing balance, or a payment.
- A payment could match more than one open receivable/payable.
- The input mentions a currency that differs from the business's configured currency.

Optional information, such as a note or an exact due date, may remain null if it is not necessary for safe recording. Do not invent a due date such as “within seven days” just because one was not provided.

### Stage 4 — Review and confirmation

Show all recognized financial fields, linked-record references, the configured currency, and any unresolved/optional fields in an English review card. Offer **Confirm and Save**, **Edit Details**, and **Cancel**.

- `Edit`: updates the draft and triggers validation again.
- `Cancel`: discards the draft; no transaction is written.
- `Confirm and Save`: sends a stable draft payload plus an idempotency key to a protected server endpoint.

A user's confirmation applies to the specific visible draft/version. If the draft changes after review, confirmation must be collected again.

### Stage 5 — Persistence and response

The server rechecks session, business ownership, allowed field values, amount invariants, transaction links, and duplicate protection. It recomputes derived values and writes within a database transaction where multiple records are linked. Return success only after database confirmation. On failure, return a safe error and preserve the unsaved draft where practical.

### Stage 6 — Reporting

Dashboard values are computed from saved records using the definitions in the Master PRD. The AI may explain returned values in plain English but may not alter the numbers or add unsupported forecasts. The seven-day forecast is not an MVP output.

---

## 5. Fixed Transaction Types and Financial Semantics

The only MVP transaction types are:

- `SALE`
- `CUSTOMER_PAYMENT`
- `SUPPLIER_BILL`
- `SUPPLIER_PAYMENT`
- `EXPENSE`

Do not introduce an alternative event type such as `DAILY_SALES`, `CUSTOMER_RECEIVABLE_BAKI`, `CASH_INFLOW`, or `CASH_OUTFLOW` as a competing canonical type. UI labels may be friendly, but stored types and validation must follow this fixed list.

### 5.1 SALE

Represents a sale once, by its total value. Required business fields:

- `amount`: total sale amount as a decimal string.
- `amount_collected_at_sale`: amount collected at the time of sale, as a decimal string; `null` in an unsaved draft while clarification is needed.
- `transaction_date` and `currency`.
- Optional party name, descriptive line details, and note.

The server derives `customer_receivable = amount - amount_collected_at_sale`. The LLM must not be trusted to calculate the derived balance. Require `0 <= amount_collected_at_sale <= amount`. If the amount collected is not stated and cannot be safely determined, ask the user.

Sale line details (description, quantity, unit price) are descriptive only. They must not create stock records or trigger inventory calculations.

### 5.2 CUSTOMER_PAYMENT

Represents money received later against one or more customer receivables, but in MVP it should be linked to a specific sale/receivable when the linkage is unambiguous. Required fields include amount, date, currency, and related sale/receivable reference. If multiple records could match, ask the user rather than arbitrarily allocating the payment. A customer payment decreases receivables and contributes to cash collected in its own period; it does not create a new sale.

### 5.3 SUPPLIER_BILL

Represents an obligation owed to a supplier. Required fields include amount, transaction date, and currency. Supplier name and due date may be optional if not known; do not invent them. It increases supplier payables according to the saved record. It is not automatically treated as a second expense when paid.

### 5.4 SUPPLIER_PAYMENT

Represents money paid to a supplier against an outstanding supplier bill. Required fields include amount, date, currency, and related bill reference. If more than one bill could be the target, ask for clarification. A payment reduces the payable and is not another supplier bill. If a statement describes a bill and its immediate payment, prepare linked drafts and show both to the user as one review/confirmation batch.

### 5.5 EXPENSE

Represents an explicitly recorded business expense/outflow. In the MVP, expense records should represent an expense that has been paid/recorded as an actual outflow. If the input describes an unpaid supplier obligation, use `SUPPLIER_BILL`; if it describes another unpaid liability not supported by the fixed model, ask for clarification and do not silently invent a new transaction type. An expense is not a supplier bill payment, and one transaction must not be counted twice.

### 5.6 Required financial invariants

1. `SALE.amount = SALE.amount_collected_at_sale + derived customer receivable`.
2. The sale is counted once in Sales; the receivable component is not added again to Sales.
3. An amount due is not cash collected until a collection is saved.
4. `CUSTOMER_PAYMENT` reduces linked receivables and is not a sale.
5. `SUPPLIER_PAYMENT` reduces linked supplier payables and is not a supplier bill.
6. A supplier bill/payment pair must not be counted as two expenses by default.
7. All linked payments must be non-negative and may not exceed the remaining linked amount unless an explicitly reviewed adjustment workflow is defined and implemented.
8. The business's configured currency is authoritative for MVP calculations. If the user mentions a different currency, clarify. Currency conversion and multi-currency balances are out of MVP scope.
9. No due date, party, payment status, opening balance, or amount may be fabricated.
10. All derived values must be reproducible from saved records and deterministic application code.

---

## 6. JSON Contracts

These are implementation contracts, not illustrative free-form prose. Validate payloads against runtime schemas (for example, a TypeScript-compatible validation library) on both the server input boundary and before persistence. Unknown keys must be rejected or safely ignored by explicit policy; they must never cause database schema changes.

### 6.1 `LedgerDraftPayload`

Illustrative structure for the extraction response:

```json
{
  "schema_version": "1.0",
  "input_language": "en",
  "source": "text",
  "raw_input": "I sold goods for 2000 today. The customer paid 1500 and still owes 500.",
  "draft_transactions": [
    {
      "draft_id": "draft-1",
      "transaction_type": "SALE",
      "transaction_date": "2026-10-15",
      "currency": "<BUSINESS_CURRENCY_CODE>",
      "currency_mentioned_by_user": null,
      "amount": "2000.00",
      "amount_collected_at_sale": "1500.00",
      "counterparty_name": null,
      "related_transaction_id": null,
      "due_date": null,
      "category": null,
      "note": null,
      "needs_clarification": false,
      "clarification_reason": null
    }
  ],
  "needs_clarification": false,
  "clarification_question": null
}
```

**Notes:**

- `<BUSINESS_CURRENCY_CODE>` is a placeholder, not a literal currency to save. The server must set the saved transaction currency from the authenticated business's stored currency after authorization. The model must not choose or override the configured currency.
- `currency_mentioned_by_user` preserves the currency explicitly mentioned in the input (as a normalized code or short original phrase) or is `null` if no currency is mentioned. The application validates it against the confirmed business currency. If it conflicts, ask for clarification; never convert automatically.
- The date in the example illustrates a resolved date only. If the date is not reliably resolved using the business time zone and user context, return `null` and ask or follow the explicitly approved date-default rule. Do not use the model's implicit date.
- The model does not write a database record or choose `business_id`/`owner_user_id`; the server derives those from the authenticated session and authorized business context.
- Monetary values are decimal strings at the API boundary to avoid binary floating-point ambiguity. Parse/validate them with a decimal-safe representation in the server/domain layer and use an appropriate PostgreSQL numeric type.
- `CUSTOMER_PAYMENT` and `SUPPLIER_PAYMENT` require `related_transaction_id` resolved to an authorized relevant record or must return a clarification requirement.
- For `SALE`, `amount_collected_at_sale` must be present before the draft can be confirmed. A `null` value means incomplete draft, not zero.

### 6.2 Validation error response

```json
{
  "status": "needs_clarification",
  "errors": [
    {
      "field": "amount_collected_at_sale",
      "code": "PAYMENT_SPLIT_UNKNOWN",
      "message": "How much of the sale was paid at the time, and how much is still owed?"
    }
  ],
  "draft": { "...": "same unsaved draft context" }
}
```

The `message` is English. Do not return sensitive server traces, raw prompts, provider credentials, or internal database errors to the client.

### 6.3 `DashboardSummary`

The dashboard endpoint should return trusted server-calculated values and their period metadata, for example:

```json
{
  "period": "weekly",
  "period_start": "2026-10-12",
  "period_end": "2026-10-18",
  "business_timezone": "<CONFIRMED_BUSINESS_TIMEZONE>",
  "currency": "<BUSINESS_CURRENCY_CODE>",
  "sales_total": "2000.00",
  "cash_collected_in_period": "1500.00",
  "customer_receivables_as_of_period_end": "500.00",
  "supplier_payables_as_of_period_end": "0.00",
  "expenses_total": "0.00",
  "profit_status": "insufficient_cost_data",
  "profit_amount": null
}
```

The values above are illustrative only. The implementation must calculate actual totals from the authorized business records. It must clearly distinguish period totals (Sales, Cash Collected, Expenses) from balances as of the end of the period (Customer Receivables, Supplier Payables). It must not return forecast/risk fields in the MVP.

### 6.4 `LoanReadinessAudit`

```json
{
  "disclaimer": "DokanSaathi does not approve loans or guarantee financing. Requirements vary by lender and program.",
  "record_summary": {
    "sales_history_available": true,
    "first_record_date": "2026-09-01",
    "last_record_date": "2026-10-15",
    "sales_record_count": 42,
    "receivable_tracking_available": true,
    "supplier_payable_tracking_available": true,
    "expense_history_available": true
  },
  "checklist_items": [
    {
      "item_id": "trade_license",
      "label": "Trade license",
      "status": "unverified",
      "requirement_source": "general_preparation_item",
      "explanation": "Whether this document is required depends on the lender and program."
    }
  ],
  "completeness_score": null
}
```

This example is a schema illustration, not a claim that those records/documents are universally required. A completeness score is optional. If implemented, it must be a transparent ratio over explicitly displayed checklist items, not a probability of loan approval or creditworthiness score. If no lender-specific source is verified, checklist items must be presented as suggestions to consider, not mandatory conditions.

### 6.5 Data model guidelines

The exact SQL migration is implementation work, but the database must represent these concepts with fixed, version-controlled structures:

- **`businesses`:** ID, owner user ID from Supabase Auth, business name/type, configured currency, confirmed time zone, timestamps.
- **`transactions`:** ID, business ID, fixed transaction type, date, currency, decimal-safe amount fields, optional party name, optional related transaction ID, optional category/note, input source, confirmation metadata, created/updated timestamps, status/void metadata.
- **`transaction_audit_events`:** audit record ID, business/transaction ID, acting user, action, prior/new values or controlled diff, timestamp. Protect access to audit data.
- **`readiness_checklist_items`:** business ID, checklist item identifier, status, source/notes, updated by, timestamp. Distinguish user-reported status from provider-verified status.
- **`correction_feedback` (if enabled):** business/transaction reference where needed, consent/status, minimized correction data, timestamps, and strict access policies. Do not use private data across tenants.

This list defines concepts, not a license for the model to invent schema. All SQL migrations must be authored, reviewed, versioned, and tested by the implementation process. Add a party table or additional model only if a documented MVP requirement demonstrates it is necessary and the PRD is updated accordingly.

---

## 7. Suggested API Boundaries

Exact URLs may be refined during implementation, but the following separation of capabilities is required.

| Endpoint example | Purpose | Must save a financial transaction? |
|---|---|---|
| `POST /api/voice/transcribe` | Transcribe audio to English text using the selected provider | No |
| `POST /api/transactions/extract` | Convert English text/transcript into an unsaved structured draft | No |
| `POST /api/transactions/validate` | Validate draft shape and business rules; return errors/clarification | No |
| `POST /api/transactions/confirm` | Persist only a currently reviewed and user-confirmed draft/batch | Yes, after server validation |
| `GET /api/transactions` | List only the authenticated user's authorized business records | No |
| `PATCH /api/transactions/:id` | Edit a saved record with authorization, validation, audit, and relationship checks | Updates an existing record |
| `POST /api/transactions/:id/void` | Void a record using audit-preserving behavior and revalidate related records | Updates status only |
| `GET /api/dashboard?period=daily\|weekly\|monthly` | Return deterministic totals and balances for a requested period | No |
| `GET /api/readiness` | Return the record-readiness summary/checklist for the authorized business | No |
| `PATCH /api/readiness/items/:itemId` | Update a user-reviewed checklist item | Updates a checklist item, not ledger |
| `POST /api/feedback/corrections` | Record allowed feedback under configured privacy/consent rules | No |

All route examples are guidance. Regardless of route naming, there must be a clear separation between extraction, validation, user confirmation, and persistence.

### 7.1 Confirm API safeguards

- Require a valid authenticated session and verify access to the chosen business on every request.
- Accept an idempotency key or implement equivalent duplicate prevention for confirmation.
- Validate the current draft version and require explicit confirmation for that exact version.
- Recompute derived values on the server; ignore client-provided derived totals as authoritative.
- Use atomic database transactions for multiple linked record writes.
- Return stable error codes and concise English messages.
- Never trust `user_id`, `owner_user_id`, `business_id`, permission flags, or provider output provided by the browser/model without authorization and validation.

---

## 8. Supabase, Authentication, RLS, and Secrets

### 8.1 Access model

- Use Supabase Auth for identity and session management.
- Every business-owned financial record must include a business ownership relationship.
- Policies must ensure a user can access records only if that user is authorized for the associated business (MVP default: business owner). Do not expose records between unrelated users.
- Apply RLS to every exposed business data table, including transactions, checklist rows, audit events, and any feedback tables.
- Add server-side ownership checks even where RLS is present, especially before linking payments to existing transactions.
- Test negative authorization paths: one user attempts to read, change, void, or link a record belonging to another user.

### 8.2 Credential handling

- Supabase publishable/anon key may be used where intended by Supabase's client model, but RLS must be correctly configured and tested.
- Supabase service-role key, LLM keys, speech provider keys, and other privileged credentials must remain server-only and must never be sent to client components.
- Do not prefix private secrets with public/client environment variable prefixes (for example, `NEXT_PUBLIC_`). Do not put secrets in localStorage, source control, logs, prompts, or demo data.
- Configure separate development and production secrets in the deployment environment. Document variable names using placeholders only.
- If a credential may have been exposed, do not echo it; rotate/revoke it and remove it from committed history according to the provider's guidance.

### 8.3 Privacy and logs

- Send only the minimum information required for a given AI/transcription request.
- Do not retain raw audio or full transcripts longer than the product needs unless a documented consented use case exists.
- Do not cache private financial records for offline access in the MVP. Any static-resource caching must not make authenticated ledger data available after logout or to another user of the same device.
- Redact credentials, authentication tokens, and sensitive financial content from routine logs.
- Privacy notices must explain that third-party AI/speech services may process submitted input when those services are enabled.
- Correction examples must not be used to train/change prompts automatically. Restrict access and retention; support opt-out/deletion according to the product privacy policy.

---

## 9. System Prompts

The prompts below are implementation templates. Their behavior must be tested against a regression suite before deployment. Do not give the model direct database-write tools. The model may output draft JSON only.

### 9.1 Ledger Extraction System Prompt

```text
You are the DokanSaathi Financial Entry Extraction component.

LANGUAGE
- The MVP is English-only. Understand English input and produce English field explanations and questions.
- Do not respond in Bangla or another language in the MVP.

YOUR TASK
- Convert the user's English business statement into one or more draft transactions using only the approved types:
  SALE, CUSTOMER_PAYMENT, SUPPLIER_BILL, SUPPLIER_PAYMENT, EXPENSE.
- Return data that conforms exactly to the provided LedgerDraftPayload contract.
- Extract only facts supported by the user's statement or the trusted business context explicitly supplied to you.
- Keep unknown values null and mark the draft as needing clarification when a missing value is required for safe recording.

FINANCIAL SAFETY
- Never invent amounts, dates, customer/supplier names, payment status, due dates, opening balances, currency conversions, or links to existing records.
- Do not assume a supplier payment is due in seven days or any other default interval.
- For a SALE, total amount and amount collected at the time of sale are separate fields. If the collection split is unknown, ask the user; do not calculate a presumed split.
- A later customer payment is CUSTOMER_PAYMENT, not a new sale.
- A supplier bill and a payment to that bill are separate events. If both are stated, produce linked draft events in one review batch; do not double-count them.
- Do not treat product quantity as inventory and do not generate stock-related data.
- Never choose the saved transaction currency. The server assigns it from the authenticated business context. Preserve an explicit user-mentioned currency in `currency_mentioned_by_user` for validation; flag a conflict for clarification. Do not infer currency from language or location.
- Do not derive or invent financial totals. Arithmetic and derived balances are computed by application code.

BOUNDARIES
- You are producing a draft only. You cannot save, edit, void, or delete a transaction.
- Do not choose business IDs, owner IDs, access permissions, database table names, or SQL.
- Do not create new transaction types or extra schema keys.
- Do not provide seven-day forecasts, cash-shortage predictions, or forecasting recommendations in the MVP.
- If the input is not a financial entry or is too ambiguous, return a concise English clarification question instead of fabricating a record.

OUTPUT
- Return valid structured JSON matching the schema. No markdown fences or extra commentary around JSON.
```

### 9.2 Clarification Prompt

```text
You are the DokanSaathi Clarification component.

Ask one short, specific question in English that resolves the most important ambiguity in the unsaved draft. Use the provided draft and validation errors as the source of truth. Do not ask for information that is optional and unnecessary for safe recording. Do not propose guessed numbers, dates, parties, or currency. Do not claim that anything has been saved. Keep the existing draft context unchanged unless the user answers the question. When the user answers, return the new answer to the extraction/validation pipeline; the application will validate it and show the revised draft for confirmation.
```

### 9.3 Financial Explanation Prompt

```text
You are the DokanSaathi Financial Explanation component.

Explain only the dashboard values, record balances, or readiness checklist supplied by trusted application code. Use concise plain English and non-technical business terms. Never recalculate or change the supplied totals. Distinguish sales during a period from cash collected during that period and from outstanding balances as of a date. If the application reports insufficient cost data, explain that profit cannot currently be calculated reliably. Do not provide cash-flow forecasts, shortage predictions, borrowing amounts, or forecast-based recommendations in the MVP. Never guarantee loan approval or state unverified lender requirements as facts. If a required value is unavailable, say that it is unavailable rather than guessing.
```

### 9.4 Readiness Summary Prompt

```text
You are the DokanSaathi Financial-Record Readiness component.

Summarize only records and checklist items returned by the application. State what is present, what is absent, what is user-reported, and what has or has not been independently verified. Requirements vary by lender and financing program. Do not invent universal rules, required document lists, minimum record-history periods, interest rates, approval odds, or eligibility decisions. Do not claim to verify a document unless an actual verification process returned that result. Never claim that DokanSaathi approves loans. Use cautious English such as “Items to consider preparing” when no specific verified lender requirements have been provided.
```

### 9.5 Prompt operation/versioning

- Store production prompts in version-controlled application configuration, not generated dynamically from user corrections.
- Include a prompt version identifier in appropriate internal logs/test reports, without recording sensitive prompt content unnecessarily.
- Regression-test prompt changes before release against extraction, ambiguity, currency/date, transaction-link, and out-of-scope requests.
- Feedback may create a reviewed test case only under the privacy/consent rules; it must not mutate the active prompt automatically.

---

## 10. Dashboard Computation Contracts

The calculation service must be a tested TypeScript domain module (or equivalent deterministic server-side library) with a single canonical definition for each metric. It must operate only on authorized, valid, non-voided records and use the confirmed business time zone for period boundaries.

- **Sales:** sum each saved `SALE.amount` once for the selected period.
- **Cash collected:** sum `SALE.amount_collected_at_sale` for sales in the selected period plus valid `CUSTOMER_PAYMENT` transactions in the selected period. A receivable is not cash until collected.
- **Customer receivables:** for each sale, subtract all valid linked customer payments from the amount due derived from that sale; show outstanding balance as of the selected period end.
- **Supplier payables:** sum supplier bills and subtract valid linked supplier payments; show outstanding balance as of the selected period end.
- **Expenses:** sum valid recorded `EXPENSE` amounts in the selected period. Do not count `SUPPLIER_PAYMENT` as an additional expense by default.
- **Profit:** the current MVP schema does not define a complete cost-capture workflow, so the default is `profit_status = insufficient_cost_data` and `profit_amount = null`. Only display a figure if a separately defined, validated supported input supplies all required cost data; never infer cost from the sale price, product name, category, or model knowledge.
- **Period:** `daily`, `weekly`, and `monthly` views must have server-defined, consistent start/end boundaries in the confirmed business time zone. The response must expose the period range and whether a metric is a period total or an as-of balance.

Forecast/risk values, future balances, and recommended collection/payment actions based on predicted liquidity must not be implemented in the MVP.

### 10.1 Arithmetic implementation rules

- Represent monetary values as decimal strings at JSON boundaries and parse them with a decimal-safe server-side representation.
- Use PostgreSQL `NUMERIC` or an equivalent exact decimal storage representation; do not use binary floating-point for monetary addition/subtraction.
- Validate that values are finite and within allowed precision/range.
- Test boundary cases such as zero, partial payment, full payment, multiple payments, edit/void with linked records, and period boundaries.
- Do not trust values returned by an LLM or sent by the browser when computing summaries.

---

## 11. Error Model and Recovery

Use stable error codes internally and concise English messages for users. At minimum, cover:

- `AUTH_REQUIRED`
- `ACCESS_DENIED`
- `INVALID_TRANSACTION_TYPE`
- `INVALID_AMOUNT`
- `CURRENCY_MISMATCH`
- `DATE_UNRESOLVED`
- `PAYMENT_SPLIT_UNKNOWN`
- `RELATED_RECORD_AMBIGUOUS`
- `PAYMENT_EXCEEDS_OUTSTANDING`
- `DUPLICATE_CONFIRMATION`
- `AI_PROVIDER_UNAVAILABLE`
- `TRANSCRIPTION_UNAVAILABLE`
- `MICROPHONE_PERMISSION_DENIED`
- `NETWORK_UNAVAILABLE`
- `SAVE_FAILED`
- `INSUFFICIENT_COST_DATA`

Error messages must not expose stack traces, SQL, secrets, provider tokens, or data belonging to another user. When extraction/transcription fails, offer text/manual entry. When saving fails, never show a success state and preserve the unsaved draft where practical. Retrying a save must not create duplicate records.

---

## 12. Testing Requirements

All financial invariants and access-control rules require automated tests. UI/accessibility/responsive behavior should be covered by automated browser tests where practical and supplemented with manual acceptance testing on real/simulated devices.

| ID | Test | Expected result |
|---|---|---|
| T-01 | English text statement describes a valid partially paid sale | Draft JSON is valid; no database transaction before confirm. |
| T-02 | Voice capture/transcription succeeds | English transcript is visible and editable before confirmation. |
| T-03 | Microphone permission denied | English explanation and text/manual fallback are available. |
| T-04 | Speech provider unavailable | No transaction is saved; retry and text/manual fallback are available. |
| T-05 | Sale total 2000, collected 1500 | Receivable derives to 500; sales count as 2000 and cash collected as 1500. |
| T-06 | Collection of 500 is saved later against that sale | Receivable decreases by 500; cash collected increases in the later period; sales do not increase. |
| T-07 | Sale's payment split is absent | Draft needs clarification; no default zero/paid assumption and no save. |
| T-08 | Supplier amount phrasing could be a bill or payment | Clarification requested; type not guessed. |
| T-09 | Supplier bill 1200, linked payment 700 | Outstanding payable derives to 500; payment is not a second bill/expense. |
| T-10 | Immediate supplier bill and payment are described together | Both linked drafts are visible; confirmation writes atomically or writes neither. |
| T-11 | Payment exceeds outstanding receivable/payable | Server rejects or routes to explicitly designed adjustment flow; no silent balance corruption. |
| T-12 | Currency mentioned conflicts with configured business currency | User is asked to clarify; no automatic conversion. |
| T-13 | Input omits supplier due date | Due date remains unknown/null; no seven-day default is inserted. |
| T-14 | Confirm is clicked twice / request is retried | Only one logical save results. |
| T-15 | User cancels a draft | No financial record is saved. |
| T-16 | User A requests User B's transaction | Server and RLS deny access. |
| T-17 | Client forges business ID or related transaction ID | Server authorization rejects unauthorized reference. |
| T-18 | AI returns unknown transaction type or extra schema fields | Runtime validation rejects/handles per explicit policy; no schema change occurs. |
| T-19 | No saved transactions in a real business | Empty state shown; demo data is not auto-inserted. |
| T-20 | Cost data is incomplete | Profit value is null and UI shows insufficient cost data. |
| T-21 | Daily/Weekly/Monthly period boundaries cross midnight/time zone | Metrics use confirmed business time zone and correct range. |
| T-22 | User searches for forecast/stock features in MVP | No forecast/risk or stock routes, UI, calculation, or data tables exist. |
| T-23 | One user edits a transaction | Audit event is recorded; linked payments/derived balances are revalidated. |
| T-24 | Network fails during save | No success shown; request is safely retryable without duplicates. |
| T-25 | User submits edits to AI draft after reviewing it | Confirmation of the prior version is invalidated; new version requires review again. |
| T-26 | User completes workflow at 320, 360, 390, 430, 768, 1024, 1280, and 1440 CSS-pixel widths | Full workflow remains usable without unintended page-level horizontal overflow. |
| T-27 | User navigates forms with keyboard and encounters errors | Focus is visible/logical; labels and error/status relationships are accessible. |
| T-28 | User asks whether a loan is guaranteed or about universal documents | Response does not claim approval or fabricate mandatory lender rules. |
| T-29 | User installs the PWA in a supported browser and signs out | Install metadata works where supported; private ledger data is not exposed from offline caches after logout. |

### 12.1 Required regression set

Keep representative English test examples for fully paid sales, partial sales, credit sales, multiple partial customer payments, supplier bills with no/partial/full payment, ordinary paid expenses, ambiguous transaction wording, conflicting currency, date ambiguity, large amounts, decimals, edits, voids, duplicate requests, tenant isolation, provider outages, and readiness checklist limitations. Version the suite alongside prompts and financial logic.

---

## 13. Build and Deployment Sequence

1. Inspect the repository and summarize its current state before changing files.
2. Confirm the approved stack is feasible in the repository; report conflicts rather than silently replacing frameworks or providers.
3. Set up Next.js App Router and TypeScript conventions, Tailwind CSS, and shadcn/ui components consistent with the project design system.
4. Configure Supabase Auth and PostgreSQL migrations; create fixed tables/constraints and enforce/test RLS.
5. Implement onboarding and business settings: business name/type, confirmed reporting currency, and confirmed time zone.
6. Implement manual transaction forms and deterministic validation first.
7. Implement review/edit/cancel/confirm flow and idempotent server-side persistence.
8. Add dashboard calculations and regression tests before adding AI.
9. Integrate provider-neutral English text extraction, then a selected English speech-to-text provider after provider review.
10. Add readiness checklist and cautious English explanation prompts.
11. Run automated tests, responsive browser checks, accessibility checks, security/tenant-isolation tests, and financial regression tests.
12. Configure Vercel deployment and environment variables. Never commit real secrets. Document migration and rollback procedure.
13. Verify that inventory, seven-day forecasting, non-English UI, offline queues, and native app packaging have not been added.
14. Update README with local setup, environment variable names/placeholders, database migration, tests, deployment, and known limitations.

---

## 14. Implementation Rules for Coding Agents

A coding agent working on DokanSaathi must:

- Treat `01_dokansaathi_master_prd_v2.md` as the source of truth for product behavior.
- Use the approved stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth/PostgreSQL with RLS, and Vercel.
- Inspect the existing codebase before writing or replacing code.
- Keep all MVP user-facing text and AI interactions in English.
- Keep the core transaction model fixed and implement all five approved transaction types consistently.
- Keep AI extraction separate from database writes; persist only confirmed drafts.
- Compute financial amounts and dashboard metrics in deterministic server-side code.
- Validate ownership and relationships for every read/write/edit/void action.
- Use testable migrations and avoid manually changing production schema.
- Preserve unsaved drafts through recoverable failures where practical and never claim a failed save succeeded.
- Ask for approval before adding a provider with cost implications, replacing the stack, adding a major dependency, or extending MVP scope.

A coding agent must not:

- Implement a seven-day cash-flow forecast or any forecast-based recommendations in MVP.
- Add inventory/stock management.
- Add Bangla UI or language support to the MVP.
- Invent financial values, dates, currency, payment status, names, or balances.
- let the LLM directly write to the database, calculate authoritative balances, alter database permissions, or execute schema changes.
- expose secret keys in frontend bundles, `NEXT_PUBLIC_*` variables, browser storage, logs, prompts, or source control.
- seed fictitious/demo records into real user businesses automatically.
- guarantee loan approval or state unsourced lender rules as facts.
- treat user corrections as permission to automatically change prompts or models.

---

## 15. Future Work — Not Part of MVP

Potential future work, only after separate review and approval:

1. **Seven-day cash-flow forecasting:** requires its own data requirements, assumptions, deterministic forecast engine, explanation behavior, and tests. No forecast schema, route, or UI is active in the MVP.
2. **Bangla and additional languages:** localize transcription, UI strings, clarifications, prompts, and explanations without changing the language-independent core transaction model.
3. **Offline sync and native Android/iOS:** only after conflict-resolution, data protection, and synchronization design are approved.
4. **Provider selection and enhancement:** choose or change LLM/speech providers after documented comparison of supported English, cost, privacy, reliability, and latency.
5. **Advanced financing information:** verified lender/program requirements may be added only with dependable sources and appropriate safeguards; no loan approval prediction or application submission without a separate approved scope.
6. **Quality improvement:** reviewed correction examples may be converted into regression cases under consent/privacy controls. Prompt/model changes require review, testing, versioning, and deployment; there is no automatic per-user feedback training loop.

---

## 16. Final Architecture Checklist

Before marking the architecture implemented, confirm all of the following:

- [ ] Master PRD and this document agree on scope and transaction semantics.
- [ ] Approved technology stack is used.
- [ ] User-facing experience and AI output are English-only.
- [ ] Voice, text, and manual entry share the same validated draft model.
- [ ] Confirm/Edit/Cancel works and only explicit confirmation can trigger persistence.
- [ ] Monetary values use decimal-safe validation and deterministic computation.
- [ ] Sales, customer payments, supplier bills, supplier payments, and expenses are not double-counted.
- [ ] No amount, date, party, due date, currency conversion, or opening balance is fabricated.
- [ ] RLS and server-side ownership checks pass cross-user negative tests.
- [ ] Server secrets are not exposed to client code or source control.
- [ ] Dashboard values reconcile with the saved ledger; profit is withheld when cost data is insufficient.
- [ ] Record-readiness wording avoids guaranteed approval and unverified universal requirements.
- [ ] Responsive and accessibility checks pass across representative viewports.
- [ ] PWA manifest/install metadata is verified in supported browsers; private financial data is not cached for offline access.
- [ ] No inventory, forecasting, multilingual, native-app, or offline-sync MVP implementation exists.
- [ ] README, migrations, tests, deployment setup, and known limitations are documented.

