# DokanSaathi — Master Product Requirements Document (PRD)

**Project name:** DokanSaathi  
**Product description:** English-first SME Finance Copilot for small businesses  
**Competition:** 2026 Shenzhen International FinTech Competition (FinTechathon), International Track  
**Competition theme:** AI as a Financial Participant  
**Selected track:** Topic E — SME Finance Copilot  
**Document version:** 2.1  
**Companion technical document:** `02_dokansaathi_agent_architecture_v2.md`  
**Status:** Approved MVP baseline; technology stack confirmed  
**Primary market context:** Small and micro businesses, initially focused on local shops in Bangladesh  
**Product language in MVP:** English only  

> **Implementation rule:** This document is the source of truth for MVP scope. Do not silently add features or change financial rules. When a requirement is ambiguous, preserve user data, ask for clarification, and document the question rather than inventing a rule.

---

## 1. Executive Summary

DokanSaathi helps small-business owners maintain reliable financial records without needing to learn accounting software. A user records business activity by speaking in English or entering text manually. The system extracts the likely financial details, presents a structured review card, and saves nothing until the user confirms the record.

The MVP provides a clear ledger and plain-English dashboard showing sales, cash collected, customer amounts still owed, supplier amounts still payable, and recorded business expenses. It also offers a transparent financial-record readiness checklist that helps the user understand which business records are already available and which information may still be missing when preparing to discuss financing with a lender.

DokanSaathi is a recordkeeping and decision-support tool. It is **not** a lender, payment processor, bank, loan broker, or guarantee of financing approval.

### Core workflow

`English voice or text` → `AI extraction` → `Structured review` → `User confirms or edits` → `Validated ledger record` → `Dashboard and record-readiness summary`

### Product principles

1. **Confirm before saving:** AI suggestions are drafts until the user explicitly confirms them.
2. **Never invent financial facts:** Missing amounts, dates, parties, payment status, or balances must be requested or marked unknown.
3. **Keep money concepts separate:** Sales, cash collected, customer receivables, supplier payables, and expenses are different measures.
4. **Fixed core data model:** AI may suggest business-specific configuration, but must not create or mutate production database schemas dynamically.
5. **Simple English:** Labels, buttons, help text, notifications, errors, clarification questions, and AI responses in the MVP must all be in English.
6. **No inventory management:** The MVP does not track stock, stock balances, stock deductions, low-stock alerts, or reordering.
7. **No cash-flow forecast in MVP:** Seven-day cash-flow forecasting is a future-phase feature and must not be implemented as part of the MVP.

---

## 2. Goals, Success Criteria, and Non-Goals

### 2.1 MVP goals

- Make it easy to record common financial events through English voice or manual text/form entry.
- Convert natural-language input into structured, editable draft records.
- Prevent accidental saving of misunderstood or incomplete records.
- Keep a readable business ledger and useful Daily, Weekly, and Monthly summaries.
- Show customer amounts owed and supplier amounts payable without double-counting.
- Help the user understand financial-record completeness without making universal claims about lender requirements.
- Provide a responsive, secure, online-first Progressive Web App (PWA).

### 2.2 MVP success criteria

The MVP is considered functionally ready when:

- Every input path leads to a review-and-confirm step before a record is saved.
- Financial calculations for supported records are deterministic and covered by automated tests.
- A sale with partial collection correctly separates total sales, cash collected, and customer receivable.
- A later customer payment reduces the related receivable and is not counted as a second sale.
- Supplier bills and supplier payments are represented separately; a payment reduces the payable rather than creating another expense by default.
- The dashboard can switch between Daily, Weekly, and Monthly views.
- Profit is shown only when the required cost information is available and sufficiently complete; otherwise the UI states that there is insufficient cost data.
- Data from one user/business is inaccessible to other users/businesses.
- All visible product copy and AI-generated user-facing content is English in the MVP.
- The seven-day forecast and all stock-tracking capabilities are absent from MVP screens, APIs, calculations, and tests.

### 2.3 Explicit non-goals for MVP

- Seven-day or other predictive cash-flow forecasting.
- Inventory/stock management, stock-on-hand balances, automatic stock deductions, low-stock alerts, reorder suggestions, or warehouse management.
- Payment execution, bank transfers, wallet integration, lending, credit scoring for approval, or loan applications submitted on the user's behalf.
- A promise or prediction that a bank, microfinance institution (MFI), or lender will approve financing.
- Automatically choosing a lender or recommending an unverified interest rate or financial product.
- Automatic database-schema creation or database migrations generated by the AI during normal use.
- Automatic prompt/model changes based on individual user corrections.
- Bangla or other-language speech and interface localization in the MVP.
- Offline-first synchronization, native Android/iOS apps, or Play Store publishing. PWA installability may be supported online-first; robust offline sync is future work.
- Opening-balance entry or bulk historical-ledger import unless separately approved; do not silently seed values into a real business account.
- Mandatory two-factor authentication or app-lock flows unless they are independently approved as an implementation requirement. Standard authentication and access control are required.

---

## 3. Target Users and Jobs to Be Done

### Primary user

A micro or small-business owner, initially a local retail shopkeeper, who wants an easy way to record sales, customer credit, supplier bills, supplier payments, and ordinary business expenses. The user may be unfamiliar with formal bookkeeping and needs clear, everyday English rather than accounting jargon.

### Jobs to be done

- “Let me record what happened in my business quickly.”
- “Show me how much I sold during this period and how much cash I actually collected.”
- “Show me how much customers still owe me.”
- “Show me how much I still owe suppliers.”
- “Help me see recorded expenses and, only when enough cost data exists, an estimated profit figure.”
- “Tell me which financial records I already have and what information may still be needed before speaking with a lender.”

### Usability constraints

- Use clear, short English sentences.
- Prefer familiar terms such as **Sales**, **Cash Collected**, **Customers Owe**, **Supplier Payments Due**, and **Expenses**.
- Avoid technical accounting language such as “trial balance,” “journal entry,” or “chart of accounts.”
- Never communicate an uncertain AI extraction as if it were a verified fact.

---

## 4. MVP Scope

| Capability | MVP status | Required behavior |
|---|---|---|
| English voice input | In scope | Capture English speech, display its transcript, extract draft financial details, and require review. |
| English text input | In scope | Accept typed natural-language entries and manual form entries. |
| AI extraction | In scope | Produce structured draft fields using the fixed core data model. |
| Confirmation and editing | In scope | User can confirm, edit, or cancel before saving. |
| Business setup | In scope | Collect business profile, reporting currency, and time zone; allow user-reviewed configuration suggestions. |
| Financial ledger | In scope | Store supported sales, customer payments, supplier bills, supplier payments, and expenses. |
| Dashboard | In scope | Daily, Weekly, and Monthly summaries using consistent financial definitions. |
| Customer receivables | In scope | Track amounts owed from recorded credit sales and apply recorded customer payments. |
| Supplier payables | In scope | Track outstanding supplier bills and apply supplier payments. |
| Financial-record readiness | In scope | Show recorded information and possible gaps; avoid universal lender requirements. |
| Error handling and correction feedback | In scope | Explain failures in English, preserve unsaved work where practical, and collect reviewed corrections. |
| Responsive online-first PWA | In scope | Work on mobile and desktop web layouts; use secure authenticated APIs. |
| Seven-day cash-flow forecasting | **Future only** | Must not appear in MVP. |
| Inventory/stock tracking | **Out of scope** | Must not be implemented. Optional sale line details must not create stock balances. |
| Multilingual UI or voice | Future | The architecture should allow localization later, but MVP behavior is English only. |
| Offline synchronization | Future | Do not promise offline data capture/sync in MVP. |
| BYOK / user-provided AI keys | Future | Use server-side configured provider credentials in the MVP. |

---

## 5. Onboarding and Business Configuration

### 5.1 Required onboarding fields

Before the user creates the first financial record, collect and validate:

- Business name.
- Business type/category, with “Other” available.
- Reporting currency, explicitly selected by the user.
- Business time zone, explicitly selected or confirmed by the user.
- The authenticated user’s association with the business.

Do not infer currency solely from the user's language, location, device settings, or market context. Do not silently assume a time zone. If the application proposes a default, it must be visible and user-confirmed before financial records are created.

### 5.2 AI-assisted configuration

The user may describe the business and its workflow in English. The AI may suggest:

- Which supported transaction categories are relevant.
- Optional fields to display for the selected business type.
- Plain-English labels, helper text, and optional categories that fit the business.
- Clarifying questions needed to prepare a suitable setup.

The user must review and confirm any suggested configuration before it becomes active.

### 5.3 Configuration boundaries

- The core transaction schema, validation rules, access-control rules, and calculation logic remain fixed and version-controlled.
- AI output must not run database DDL, create arbitrary tables, alter production schema, or change business logic.
- Business-specific configuration may control allowed optional fields, labels, and category choices only within capabilities defined by the application.
- Unknown or unsupported business requirements must be identified as unsupported or deferred, not improvised into the database.

---

## 6. Input, Extraction, Review, and Save Flow

### 6.1 Supported input methods

**Voice:** The user records an English statement using a microphone control. The app obtains an English transcript and displays it for review. Audio transcription may be provided by a configurable server-side speech service. If voice capture or transcription fails, offer text entry as a fallback.

**Text:** The user enters a natural-language statement in English.

**Manual form:** The user can open a transaction form and enter the fields directly without using AI. Manual form entry must use the same validation and confirmation rules as AI-assisted entry.

All three methods must produce the same supported draft transaction structure.

### 6.2 Required flow

1. User selects Voice, Text, or Manual Entry.
2. App captures the input. For voice, show the resulting English transcript.
3. AI extraction creates a draft only. No ledger record is saved at this stage.
4. Validate the draft using deterministic application logic.
5. If required information is missing or ambiguous, ask a short English clarification question. Keep the draft available while clarification is resolved.
6. Display a review card with all recognized fields, transaction type, amount, date, party, payment status, any related record, and optional note.
7. User chooses **Confirm**, **Edit**, or **Cancel**.
8. If the user chooses Edit, fields may be edited manually or corrected through another English voice/text instruction. Re-run validation after every meaningful edit.
9. Save only after explicit confirmation and successful server-side validation.
10. Show an English success message and the saved record summary. If saving fails, do not show success; keep the draft where practical and offer retry.

### 6.3 Example interaction (English-only)

**User:** “I sold goods for 2,000 today. The customer paid 1,500 and still owes 500.”

**Review card:**
- Type: Sale
- Total sale: 2,000
- Cash collected at sale: 1,500
- Customer amount due: 500
- Date: [resolved date, shown to the user]
- Customer: [name, if provided; otherwise optional/unknown]

The app asks for clarification if the currency, date, amount, or other required detail cannot be resolved safely. The example must not be interpreted as an instruction to assume a particular currency.

### 6.4 Ambiguity rules

Ask the user instead of guessing when:

- An amount or transaction type cannot be confidently identified.
- It is unclear whether an amount was paid, received, or remains due.
- A supplier amount could mean a new bill, an existing balance, or a payment.
- A date, party, currency, or link to an existing receivable/payable is necessary but unavailable.
- The input could create a duplicate or contradict a prior record.

An optional field may remain blank if the transaction can still be safely recorded. Do not block all transactions merely because an optional note or party name is absent.

### 6.5 Cancel and duplicate behavior

- Cancel discards the draft and must not save a financial record.
- Repeated taps on Confirm must not create duplicate records. Use an idempotency strategy for save requests.
- If an input appears to describe a previously entered event, warn the user and show the potentially matching record for review. Do not automatically merge or delete financial records.

---

## 7. Financial Data Model and Rules

### 7.1 Supported transaction types

Use a stable core model with these supported transaction types:

- `SALE` — a completed sale, with total sale amount, amount collected at the time of sale, and any amount still due from the customer.
- `CUSTOMER_PAYMENT` — cash/payment later received against an existing customer receivable. In the MVP it must be linked to one specific sale/receivable; if the possible link is missing or ambiguous, ask the user. Allocation of one payment across multiple sales is out of MVP unless separately approved.
- `SUPPLIER_BILL` — an amount owed to a supplier for a recorded bill or purchase obligation, including an optional due date.
- `SUPPLIER_PAYMENT` — an amount paid to a supplier, linked to one specific supplier bill/payable. If the possible link is missing or ambiguous, ask the user rather than choosing a bill arbitrarily.
- `EXPENSE` — a business expense recorded as an actual paid outflow, including amount, date, and category. An unpaid supplier obligation must use `SUPPLIER_BILL`; other unpaid liabilities not represented by the fixed model are outside the MVP unless separately approved.

Do not add other production transaction types implicitly. Any additional type requires an explicit PRD change and tests.

### 7.2 Common transaction fields

Every saved record must include, as applicable:

- Unique record ID.
- Business ID and owner/user access relationship.
- Transaction type.
- Transaction date and creation timestamp.
- Amount and currency, using the business's configured reporting currency unless the product explicitly supports and validates a different currency.
- Optional party reference/name.
- Optional related transaction ID.
- Optional description/note.
- Record source (`voice`, `text`, or `manual`).
- Review/confirmation metadata.
- Created/updated timestamps.

Persist money with a precision-safe numeric representation; do not use binary floating-point arithmetic for money calculations. Validate amounts as finite, non-negative values where the transaction type requires it. Corrections must be auditable and must not silently overwrite financial history.

### 7.3 Essential definitions

- **Sales:** The total value of saved `SALE` records dated in the selected period. Count each sale once regardless of whether it was paid immediately or on credit.
- **Cash collected:** Money recorded as received during the selected period. Include the amount collected at the time of a sale and later `CUSTOMER_PAYMENT` records. Do not count the unpaid part of a sale as cash collected.
- **Customer receivables:** The outstanding amount customers owe on recorded credit sales after subtracting linked customer payments.
- **Supplier payables:** The outstanding amount owed to suppliers on recorded supplier bills after subtracting linked supplier payments.
- **Expenses:** Recorded business expenses in the selected period. Ensure supplier bill payments are not automatically counted as a second expense simply because cash was paid; use the associated bill/expense treatment defined in the record model.
- **Profit:** Display only when cost of goods sold and relevant business-expense data are available and sufficiently complete for the selected period. The current MVP schema does not define a complete cost-capture workflow; therefore, default to “Insufficient cost data to calculate profit” unless an explicitly defined, validated supported input supplies all necessary cost data. Never infer costs from sale price, product name, category, or model knowledge. If a calculated figure relies on incomplete records, do not display it as reliable profit.

### 7.4 Calculation invariants

These rules are mandatory and must be tested:

1. For a sale: `total_sale_amount = amount_collected_at_sale + amount_due_from_customer`.
2. A customer payment reduces an outstanding receivable; it does not create a new sale.
3. A supplier payment reduces the associated outstanding supplier payable; it does not create a new supplier bill.
4. A sale must not be counted twice as both its full amount and its receivable portion in the Sales total.
5. An amount due is not a cash inflow until it is actually recorded as collected.
6. A recorded liability/payment must not be silently assigned a date, party, currency, or payment status that the user did not provide or confirm.
7. All arithmetic must be performed and verified by application code, not trusted solely to the language model.
8. Dashboard totals must be reproducible from saved records and their defined status/relationship rules.

### 7.5 Sale line details and inventory boundary

A sale may optionally include product/service description, quantity sold, and unit price for record detail. Those fields are descriptive only. They must not generate a stock balance or trigger any inventory workflow. No stock-on-hand table, stock deduction logic, low-stock alert, or reorder function is part of the MVP.

### 7.6 Editing and deletion

- Users may correct their own records subject to authentication and validation.
- Changes to saved financial records must be auditable, including prior values, new values, timestamp, and responsible user where practical.
- If delete is supported, use a safe soft-delete/void approach or equivalent audit-preserving behavior; excluded or voided records must be excluded from dashboard totals consistently.
- Related records must be revalidated after edits or voids. For example, changing a sale's amount must not leave a linked payment greater than the remaining receivable without a clear error or review flow.

---

## 8. Dashboard and Reporting Requirements

### 8.1 Period selector

Provide three easy-to-understand views: **Daily**, **Weekly**, and **Monthly**. The selected period must be visible. Period boundaries must follow the business time zone set during onboarding. Provide clear empty states when no records exist.

### 8.2 Required dashboard measures

- **Sales** — total saved sales for the selected period.
- **Cash Collected** — actual recorded collections in the selected period.
- **Customers Owe** — current outstanding customer receivables as of the end of the selected period, with the as-of date made clear.
- **Supplier Payments Due** — current outstanding supplier payables as of the end of the selected period, with optional due-date breakdown if reliable data exists.
- **Expenses** — recorded business expenses for the selected period.
- **Estimated Profit** — only when required cost data is sufficiently complete; otherwise show the insufficient-data message.

Avoid vague or unexplained metrics. A short “What this means” explanation should be available for each measure. Do not show a forecast, predicted shortage date, recommended borrowing amount, or inventory metrics in the MVP.

### 8.3 Reporting behaviors

- Switching periods recalculates visible totals based on the same definitions.
- Users can inspect the underlying records that contribute to a dashboard total.
- Records with uncertain or incomplete financial classification must not be silently included in a potentially misleading metric. Explain the issue and allow the user to correct the record.
- The dashboard must distinguish a period total from a current outstanding balance.
- Formatting must respect the selected currency's supported formatting rules. Currency may not be hard-coded to BDT or USD.

---

## 9. Financial-Record Readiness Assistant

### 9.1 Purpose

Provide a transparent checklist of information already present in DokanSaathi and information that may be useful when preparing to discuss business financing with a lender. This is a record-completeness helper, not a loan approval predictor.

### 9.2 MVP behavior

- Summarize what the system can verify from saved records, such as sales history, receivable records, supplier payable records, expense history, and the available date range.
- Ask the user which lender/program they are preparing for if they want a lender-specific checklist.
- If the user supplies reliable lender requirements, compare the available records to those stated requirements and identify missing items.
- If no specific lender requirements have been supplied or verified, use cautious language such as “Items to consider preparing” and explicitly state that requirements vary by lender and program.
- Let the user mark a document or record item as available, missing, or not applicable. Do not claim that the application verified the document unless an actual verification process exists.
- Explain what the readiness checklist measures. If a progress score is shown, it must be a transparent completeness score based only on listed checklist items; it must not be described as a probability of loan approval or creditworthiness score.

### 9.3 Strict safeguards

- Never guarantee or imply guaranteed loan approval.
- Never invent lender terms, rates, eligibility criteria, legal obligations, or mandatory document periods.
- Do not claim a universal minimum record-history period (for example, 30, 60, or 90 days) unless a specific, current lender/program requirement has been provided and verified.
- Do not submit a loan application, request funds, connect to a lender, or execute a financial transaction.
- If asked “Will I get a loan?”, explain that the app cannot determine or guarantee a lender's decision and offer to show the records and checklist available.

---

## 10. AI Behavior, Guardrails, and Feedback Loop

### 10.1 AI's allowed role

The AI may transcribe/interpret English input, identify likely transaction fields, draft clarifying questions, explain dashboard concepts, suggest optional business configuration, and summarize record completeness based on trusted application data.

### 10.2 AI's prohibited role

The AI must not:

- Save or modify a financial record without explicit user confirmation.
- Invent numbers, payment status, dates, customer/supplier names, opening balances, or missing cost information.
- Recalculate financial totals in a way that overrides deterministic application logic.
- create or alter database schema, access permissions, server configuration, or application code during a user interaction.
- Treat user corrections as automatically approved changes to system prompts or model behavior.
- Make unsupported loan approval claims or financial product recommendations.

### 10.3 Confidence and clarifications

If extraction confidence is low or multiple interpretations could materially change the ledger, ask one focused question at a time. Do not hide uncertainty. If clarification fails, keep the record as an unsaved draft and explain what is needed to continue.

### 10.4 Feedback loop

- Users may correct the transcript, transaction type, amount, date, party, payment status, or category.
- With appropriate notice, store de-identified or access-restricted correction examples for review and quality improvement, according to the privacy design.
- Do not train or change prompts automatically from each correction.
- Improvements must be reviewed, tested against a regression set of representative cases, versioned, and deployed deliberately.
- Never expose one customer's private transaction data in another customer's AI context or sample set.

---

## 11. UX, Accessibility, and PWA Requirements

### 11.1 Language

The entire MVP user experience must be English-only, including:

- Onboarding and business configuration.
- Voice recording labels and English transcript.
- Text fields and manual transaction forms.
- Dashboard labels, charts, explanations, and report content.
- Buttons, confirmations, warnings, errors, empty states, and notifications.
- AI clarification questions and responses.
- Financing/document-readiness checklist.

Do not mix Bangla into the interface or generated AI responses in the MVP. Prepare a localization structure so additional languages may be added in a future version without redesigning the core financial schema.

### 11.2 Required states

Design and implement clear states for:

- Loading/transcribing/analyzing.
- Draft available for review.
- Clarification required.
- Saved successfully.
- Save failed with retry option.
- Microphone permission denied or unavailable.
- No speech detected / transcription failed.
- Network unavailable.
- No records for the chosen period.
- Insufficient cost data for profit.
- Authentication expired or access denied.
- Invalid field values or conflicting financial relationships.

### 11.3 Interaction requirements

- Use explicit button labels such as **Confirm and Save**, **Edit Details**, and **Cancel**.
- Do not rely on color alone to communicate success, error, or status.
- Keep the confirm action distinct from cancel. Prevent accidental duplicate submissions while a save is in progress.
- Make the review card usable on mobile screens and keyboard-accessible.
- Use visible labels and helpful field errors, not placeholder-only labels.
- Provide accessible focus states, semantic controls, sufficient contrast, and understandable control names.
- Ensure common touch controls have practical tap targets and spacing; prevent accidental adjacent-button activation.
- Avoid page-level horizontal scrolling. Where a wide data table cannot reasonably fit on mobile, provide a mobile-specific list/card presentation or a clearly contained horizontal scroll region.
- Use fluid typography, flexible containers, and responsive navigation rather than simply shrinking the desktop layout.

### 11.4 Responsive design and viewport acceptance

The UI must be designed mobile-first and verified at representative viewport widths including 320, 360, 390, 430, 768, 1024, 1280, and 1440 CSS pixels. These are test widths, not the only supported sizes. Layouts must adapt continuously between them.

- **Mobile:** Prioritize the primary Add Transaction action, voice/text/manual input, readable financial figures, stacked summary cards, and simple navigation.
- **Tablet:** Use available width for grouped summary cards and transaction lists without making forms crowded.
- **Desktop:** Provide efficient navigation, summary cards, and a readable transaction table while preserving clear hierarchy.
- At all sizes, the user must be able to complete the full input → review → edit/confirm/cancel → save workflow.
- Check long names, large monetary values, validation errors, empty states, loading states, and browser zoom; these must not obscure controls or key values.
- Test keyboard use, focus visibility, contrast, semantic labels, and screen-reader-friendly error/status announcements as part of accessibility checks.
- Any layout exception (such as a contained horizontally scrollable table) must be intentional and must not create accidental page-wide overflow.

### 11.5 PWA behavior

- Responsive on supported mobile and desktop browser widths.
- Online-first; require a valid network connection for server-dependent AI and save actions.
- Clearly communicate offline/network failures and do not imply that unsaved records have been stored remotely.
- Include PWA manifest/install metadata and verify installability in supported browsers. PWA installability does not mean offline ledger operation is supported. Do not cache private financial records for offline access. Offline transaction queues and conflict resolution are not MVP requirements.

---

## 12. Architecture, APIs, Security, and Privacy

### 12.1 Architecture requirements

#### Confirmed MVP technology stack

The MVP stack is approved and is not an open choice:

- **Application framework:** Next.js App Router.
- **Language:** TypeScript.
- **Styling:** Tailwind CSS.
- **UI primitives/components:** shadcn/ui, with components reviewed and adapted for accessibility and responsive use.
- **Authentication and database:** Supabase Auth and PostgreSQL.
- **Data authorization:** Supabase Row Level Security (RLS) plus server-side authorization checks.
- **Hosting/deployment:** Vercel.
- **Platform:** Responsive, online-first Web App / PWA. A native Android app is out of MVP scope.

Use a clear separation of responsibilities:

1. **Client UI:** Input capture, transcript display, review/edit forms, dashboard, and readiness checklist.
2. **Next.js server/API layer:** Authentication enforcement, input validation, server-side AI/speech-provider calls, deterministic financial calculations, and transaction persistence.
3. **Supabase/PostgreSQL:** Stable relational financial records with business ownership and relationships between sales/payments and supplier bills/payments. Enforce RLS on exposed data tables.
4. **AI/provider adapters:** Configurable server-side integration for an LLM and English speech-to-text provider, so provider changes do not require rewriting financial rules. The exact providers remain an implementation decision.
5. **Vercel:** Host the Next.js application and server-side routes using managed environment variables/secrets.

Inspect the repository before implementation so the agent does not overwrite existing working code. Where the repository conflicts with this approved stack, report the conflict and propose a migration plan before changing architecture. Do not silently substitute frameworks, database services, or hosting providers.

### 12.2 API expectations

The Next.js server/API layer must support equivalent operations for:

- Creating and retrieving the authenticated user's permitted business profile and configuration.
- Extracting a draft from voice transcript/text without saving a financial record.
- Validating a draft and returning missing fields or field-level errors.
- Creating a confirmed transaction idempotently.
- Listing/filtering transactions by date, type, party, and status as needed by the UI.
- Editing/voiding transactions with authorization and relationship validation.
- Retrieving dashboard metrics calculated from trusted saved records.
- Retrieving/updating the user's document-readiness checklist.
- Recording correction feedback under the defined privacy rules.

The exact URL routes and payloads should be documented in the implementation/API specification and validated with tests. Client-provided totals are untrusted; recompute them server-side.

### 12.3 Security requirements

- Authenticate users before exposing business financial data.
- Enforce server-side ownership checks on every read, write, edit, and delete/void action.
- Enforce per-user/per-business data isolation. Never rely only on hiding UI controls.
- Validate and normalize all user input on the server, including IDs, money values, dates, enumerations, and related-record IDs.
- Keep LLM, speech, database, and other service credentials in server-only environment variables or a managed secret store. **Never place API keys or service secrets in frontend code, browser localStorage, client-prefixed/public environment variables, or committed repository files.**
- Do not expose the Supabase service-role key to the browser. Prefer authenticated user-scoped database access with RLS; use elevated service credentials only from trusted server-side code when genuinely required and restrict that code path.
- Do not send more financial or personal data to an AI provider than needed for the task.
- Apply transport security and appropriate protection for data at rest based on the selected infrastructure.
- Avoid logging raw audio, full financial records, authentication tokens, or secrets unless strictly necessary and appropriately protected. Prefer redacted operational logs.
- Provide a clear privacy notice describing what information is collected, why it is used, which external services process it, and how the user can request deletion where supported.
- Use safe error messages that do not leak internal stack traces, secrets, database details, or other users' information.
- Apply rate limiting and abuse protection to authentication, AI extraction, and other expensive or sensitive endpoints where supported by the stack.

### 12.4 Data integrity and reliability

- Use database constraints and server-side validation for required fields and relationships.
- Use transactions/atomic operations where multiple linked records must be saved together.
- Implement idempotency or equivalent duplicate-prevention for save requests.
- Use migrations that are reviewed and version-controlled; user-facing AI must never perform schema migrations.
- Provide predictable recovery paths for network and provider failures. Failed extraction or save operations must not create partial or duplicate financial records.
- Acknowledge success only after the server confirms the save.

---

## 13. Error Handling and Observability

### User-facing errors

Errors must be in plain English and identify the next action when possible. Examples:

- “We couldn't transcribe that recording. Try again or enter the details by text.”
- “Please confirm whether this amount was paid or is still due.”
- “This record wasn't saved because the connection failed. Your draft is still available; try again.” (Use only if the draft truly remains available.)
- “This payment is larger than the outstanding amount on the selected record. Review the amount or choose a different record.”
- “Profit can't be calculated yet because cost information is incomplete.”

### Logging and monitoring

- Log technical failures with correlation/request IDs and minimal necessary metadata.
- Never show raw stack traces to the user.
- Do not log secrets or unnecessary financial details.
- Track failures and latency for transcription, extraction, validation, saving, and dashboard retrieval.
- Use logs to investigate technical issues without making private records visible to unauthorized users.

---

## 14. Acceptance Criteria and Test Scenarios

All applicable scenarios below must be implemented as automated tests or clearly documented manual acceptance tests. Financial arithmetic and access-control rules require automated coverage.

| ID | Scenario | Expected result |
|---|---|---|
| AC-01 | User enters a valid English sale statement through text | A draft review card appears; no ledger row exists before confirmation. |
| AC-02 | User records a sale by voice | English transcript is shown and can be corrected before the structured draft is reviewed. |
| AC-03 | User manually enters a sale | Same validation, review, confirmation, and save rules apply as AI-assisted input. |
| AC-04 | User cancels a draft | No financial record is saved. |
| AC-05 | User confirms a valid draft | Server validates and saves one record; UI reports success only after server confirmation. |
| AC-06 | Confirm is tapped repeatedly or request is retried | Duplicate records are not created. |
| AC-07 | Sale total is 2,000; collected at sale is 1,500; customer owes 500 | Sales = 2,000; Cash Collected includes 1,500; Customer Receivable = 500. The unpaid 500 is not counted as cash. |
| AC-08 | Customer later pays the outstanding 500 | Cash Collected increases by 500 for the collection period; Customer Receivable falls by 500; Sales do not increase again. |
| AC-09 | Supplier bill is 1,200; supplier payment is 700 | Outstanding Supplier Payable = 500. The 700 payment is not treated as a new supplier bill. |
| AC-10 | User describes amount but payment state is ambiguous | System asks an English clarification question and does not save until resolved/confirmed. |
| AC-11 | User provides malformed, negative, or unsupported amount values | Server validation rejects or requests correction; invalid values do not affect totals. |
| AC-12 | User switches Daily/Weekly/Monthly view | Metrics are recalculated for the selected business-time-zone period using the same definitions. |
| AC-13 | There are no records for a selected period | Clear English empty state is shown; no fabricated zero-history explanations or sample records are inserted. |
| AC-14 | Cost data is incomplete | Profit is not presented as a reliable value; the UI explains that cost data is insufficient. |
| AC-15 | User asks whether a loan is guaranteed | AI states that approval cannot be guaranteed and displays only supported record/checklist information. |
| AC-16 | No lender-specific requirements are available | Checklist uses cautious general wording; it does not claim any unverified document or record period is universally mandatory. |
| AC-17 | User A attempts to access User B's business or transaction ID | Server denies access; no private data is returned or modified. |
| AC-18 | AI provider is unavailable | User sees a clear English failure and a manual-entry fallback; no record is saved without confirmation. |
| AC-19 | Speech permission is denied | App explains the issue in English and offers text/manual entry. |
| AC-20 | Network fails during save | No false success is shown; no partial/duplicate transaction is created; retry behavior is safe. |
| AC-21 | A sale line includes product name and quantity | Details may be saved, but no inventory balance or stock deduction is produced. |
| AC-22 | User searches MVP UI or API for stock features | No stock management, low-stock alert, or reorder feature is available. |
| AC-23 | User looks for seven-day cash-flow forecast | No forecast or shortage-prediction screen/API is available in MVP. |
| AC-24 | User corrects AI extraction | Correction changes the draft only; the user must confirm before it is saved. Feedback does not automatically change production prompts/models. |
| AC-25 | User's configured currency or time zone differs from the device default | Saved records and dashboard formatting follow the confirmed business settings, not an assumed device value. |

### Additional responsive/accessibility acceptance criteria

| ID | Scenario | Expected result |
|---|---|---|
| AC-26 | User completes the transaction workflow at viewport widths of 320, 360, 390, 430, 768, 1024, 1280, and 1440 CSS pixels | Input, review, edit, confirmation, and dashboard controls remain usable; no unintended page-wide horizontal overflow occurs. |
| AC-27 | User navigates forms and review cards by keyboard and encounters validation errors | Focus remains visible and logical; fields have labels; errors and status changes are programmatically associated with the relevant controls and are not communicated by color alone. |
| AC-28 | A newly created real business has no saved transactions | It starts with an honest empty state; demo data is never inserted into the user's real ledger automatically. |

### Required financial regression examples

Use a regression set with cases that cover:

- Fully paid sale.
- Partially paid sale.
- Fully unpaid sale.
- Multiple partial customer payments against one sale.
- Supplier bill with no payment, partial payment, and full payment.
- Expense recorded as a paid outflow; unpaid supplier obligation recorded separately as a supplier bill.
- Editing a sale after a payment has been linked.
- Voiding a record that has linked payments.
- Multiple businesses under separate users.
- Different date boundaries around midnight in the configured business time zone.

---

## 15. Future Roadmap — Explicitly Not in MVP

These items may be considered only after the MVP is implemented and tested. They must not be mixed into the MVP task list by an AI coding agent.

### Future phase A: Seven-day cash-flow risk forecaster

Potential future capability: combine verified current cash information, expected customer collections, supplier due dates, and recorded obligations to estimate liquidity over the next seven days. This feature requires its own data requirements, clear assumptions, confidence/explanation behavior, and tests. It must not be built in MVP.

### Future phase B: Multilingual experience

Add Bangla and other languages for speech input, text, UI strings, clarification questions, dashboard explanations, and error messages. The MVP remains English-only. Translation/localization must not change transaction meaning or the language-independent core data model.

### Future phase C: Offline and native-app options

Explore offline draft capture, reliable synchronization/conflict handling, and native mobile distribution only after a privacy-safe sync design exists.

### Future phase D: Security enhancements and user-managed AI credentials

Consider optional app lock/2FA based on user needs. BYOK (bring your own AI key) may be evaluated separately; it is not an MVP requirement. If ever implemented, credentials must be handled safely and must never be exposed in client-side storage or logs.

### Future phase E: Advanced financing support

Potentially integrate verified lender-specific document requirements or financing-option information if dependable, authorized data sources and appropriate safeguards are available. Do not implement unsupported lender matching, loan applications, or approval prediction in the MVP.

### Future phase F: Quality improvement

Expand the reviewed test set and versioned extraction evaluation from corrections and consented test examples. No automatic model/prompt mutation based on an individual correction.

---

## 16. Implementation Order and Agent Instructions

Implement in this order unless an existing repository requires a documented dependency adjustment:

1. Inspect the existing repository, framework, routes, authentication, database, environment configuration, and current tests. Do not overwrite functioning work without understanding it.
2. Confirm the approved stack (Next.js App Router + TypeScript, Tailwind CSS + shadcn/ui, Supabase Auth/PostgreSQL with RLS, and Vercel). If the repository has constraints that prevent it, stop and request review rather than silently choosing another stack.
3. Implement authentication, business ownership boundaries, onboarding, currency/time-zone settings, and the fixed core schema.
4. Implement manual transaction forms and server-side validation before connecting AI. This establishes trusted data and calculation rules.
5. Implement the review/confirm/edit/cancel workflow.
6. Add English text extraction and then English voice/transcription through server-side provider adapters, using the same draft model.
7. Implement receivable/payable relationships and deterministic calculation tests.
8. Build the Daily/Weekly/Monthly dashboard and record-readiness checklist.
9. Add error states, accessibility checks, security tests, regression tests, and responsive PWA behavior.
10. Verify explicitly that inventory features and seven-day forecasting have not been added.
11. Update the README with setup instructions, environment variables, migration steps, test commands, and deployment guidance. Never commit real credentials.

### Agent must not

- Add inventory management or stock tracking.
- Implement seven-day cash-flow forecasting in MVP.
- change the MVP language from English or add mixed-language user-facing copy.
- save AI-extracted data without a user confirmation step.
- let an LLM calculate authoritative financial totals or determine database permissions.
- use AI to generate or apply database schema changes during ordinary use.
- hard-code BDT/USD as the only currency without user configuration.
- claim loan approval, lender eligibility, or mandatory document requirements without verified, specific support.
- introduce unapproved paid providers, replace the approved framework/database/hosting stack, or use secret-bearing client-side integrations.

---

## 17. Definition of Done

The MVP is done only when:

- All in-scope features are implemented in the approved Next.js/TypeScript + Tailwind/shadcn/ui + Supabase/PostgreSQL + Vercel stack, responsive, and usable in English.
- The complete workflow passes responsive checks at the viewport widths listed in Section 11.4 without unintended page-level horizontal overflow.
- Review/confirm/edit/cancel flow works for voice, text, and manual input.
- All financial invariants and acceptance scenarios pass.
- Dashboard totals reconcile with the underlying saved records.
- User/business data isolation is tested on the server.
- Secrets are kept out of client bundles and source control.
- Error states do not fabricate success or lose confirmed records silently.
- Financing-readiness copy avoids unsupported lending promises and universal requirements.
- No inventory/stock feature or seven-day cash-flow forecast is included.
- README/setup/test instructions are current and reproducible.
- Known limitations are documented clearly for the competition demo.

---

## 18. Competition Alignment Note

DokanSaathi is aligned with **Topic E — SME Finance Copilot** through small-business financial recordkeeping, cash/receivable/payable visibility, plain-language financial summaries, and financing-record readiness. The MVP should demonstrate a real, auditable workflow rather than overstate autonomy. The official International Track language is English, which is consistent with the English-only MVP requirement.

**Reference links:**
- FinTechathon competition information: https://fintechathon.g-ican.com/#/en
- International Track topic overview: https://www.ieee-cis-singapore.org/2026-fintechathon

