# DokanSaathi — UI/UX Blueprint v1.0

**Purpose:** Authoritative design and interaction specification for improving the existing DokanSaathi MVP.  
**Status:** Proposed visual direction, ready for repository audit and plan review.  
**Target:** English-first, responsive, online-first Web App/PWA.  
**Approved stack:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase/PostgreSQL, Vercel.

## 1. Design objective

DokanSaathi must feel understandable to a small-business owner who does not know accounting. On opening the app, a user should immediately understand:

1. How much the business sold during the selected period.
2. How much money was actually received.
3. How much customers still owe.
4. How much is still owed to suppliers.
5. What expenses were recorded.
6. How to add a transaction using voice or manual entry.

Optimize for clarity, predictable behavior, accessible controls, and confidence in financial records—not visual complexity. The attached visual mockup is a direction reference only. Product behavior, amounts, statuses, data definitions, and scope must come from the three approved project documents and actual saved data, not illustrative mockup text.

## 2. Non-negotiable product constraints

- All MVP UI text, voice transcripts, forms, errors, notifications, confirmation messages, and AI responses are in English.
- The five approved transaction types are `SALE`, `CUSTOMER_PAYMENT`, `SUPPLIER_BILL`, `SUPPLIER_PAYMENT`, and `EXPENSE`.
- A financial draft must not be saved before explicit user confirmation.
- Required flow: input → extract or enter draft → validate/clarify → review/edit/cancel → explicit confirm → server-side validation and persistence → refreshed ledger/dashboard.
- All authoritative financial calculations use deterministic application/server logic, not LLM arithmetic.
- No inventory/stock tracking, no cash-flow forecasting, no loan approval prediction, no payment execution, no native mobile app, and no robust offline synchronization.
- Business-specific settings may be suggested by AI, but the core database schema remains fixed and any accepted configuration requires user confirmation.
- Provider mocks must be clearly identified and must not masquerade as live AI or live transcription.

## 3. Visual design system

Use a light-first, calm, modern financial-product style. Avoid dense dashboard layouts, strong glassmorphism, excessive gradients, decorative charts without data, and unrelated animations.

### 3.1 Tokens

Use CSS variables/design tokens rather than one-off values. The values below are proposed defaults and should be implemented consistently:

- App background: `#F7F9FC`
- Primary surface/card: `#FFFFFF`
- Primary text: `#111827`
- Secondary text: `#64748B`
- Primary action blue: `#2563EB`
- Success green: `#15803D`
- Warning amber: `#B45309`
- Error red: `#B91C1C`
- Neutral border: `#E2E8F0`
- Muted surface: `#F1F5F9`
- Border radius: 12–16px for cards, 10–12px for form controls, fully rounded FABs.
- Shadows: subtle and limited to layered controls/cards; avoid heavy shadows.
- Motion: short, purposeful transitions; respect `prefers-reduced-motion`.

Do not communicate status by color alone. Add explicit labels/icons and accessible contrast. Avoid giving every metric a different saturated color; use blue/neutral as the base and use semantic color only for meaningful status or emphasis.

### 3.2 Typography

Use an existing suitable local font or a reliably loaded sans-serif such as Geist/Inter. Do not block app usability on a remote font.

- Mobile page title: approximately 24–28px.
- Desktop page title: approximately 28–32px.
- Metric value: approximately 24–30px depending on viewport.
- Body: 16px target; do not use tiny text for essential information.
- Labels/helper text: generally 13–14px, with readable line height.
- Use tabular numerals for money and aligned numeric columns.
- Keep the language everyday and direct; explain finance terms when needed.

## 4. App shell and navigation

### Mobile

- Compact header with DS brand mark and DokanSaathi name.
- Menu/account control must open a real accessible menu; do not leave decorative buttons.
- Fixed bottom navigation: Dashboard, Ledger, New Entry, Readiness.
- Keep navigation labels visible and active route obvious.
- Ensure bottom navigation respects device safe areas and never covers form buttons or content.

### Tablet and desktop

- Use a persistent sidebar or well-structured wider navigation according to current code; do not introduce duplicated competing navigation.
- Keep the brand, current page heading, account/menu action, and primary transaction action easy to find.
- Apply a sensible max-content width so financial cards and long lines do not stretch excessively on wide monitors.

### Responsive support

Test widths: 320, 360, 390, 430, 768, 1024, 1280, and 1440 CSS pixels. The app must not have page-wide horizontal overflow. At 320px, labels, amounts, and critical buttons must remain readable and actionable.

## 5. Global floating quick actions: Voice + Manual

### Placement

- On authenticated primary screens—Dashboard, Ledger, and Readiness—show two vertically stacked floating action buttons on the right side.
- Primary action: microphone icon, blue circular button, accessible label `Record a transaction`.
- Secondary action directly below: pen/edit icon, white or neutral outlined circular button, accessible label `Enter a transaction manually`.
- Position above the mobile bottom navigation with safe-area-aware spacing. On desktop, use a comfortable bottom-right position.
- Ensure neither button covers cards, filter controls, Save/Confirm buttons, keyboard content, or important page actions.
- Hide or adapt floating buttons when a modal is open, the keyboard obscures the content, or the current New Entry screen already provides the equivalent choices. Avoid duplicate controls.
- Use tooltips on hover for desktop and accessible labels for screen readers. Do not rely on icons without names.

### Voice action behavior

Tapping the microphone opens an accessible dialog/bottom sheet titled `Record a transaction`. Before recording:

1. Check secure context and recording capability.
2. Check/ask for microphone permission as appropriate.
3. Check microphone availability and supported recording MIME types.
4. Display a clear idle state and short English instructions.

Recording states: Idle → Permission pending → Recording (visible timer and Stop button) → Uploading/Transcribing → Transcript review → AI draft review → Confirm/Edit/Cancel. Provide an explicit Cancel/Close action in every relevant state.

Never show a listening/recording animation when audio capture did not start. Keep manual text and manual form fallback available.

### Manual action behavior

Tapping the pen opens the manual transaction form directly. Do not require the user to visit a separate tab first. The existing New Entry page can retain the three choices—Text Note, Voice, Manual Form—but use clear card/button affordances and avoid duplicating the global FABs on that page.

## 6. Voice availability, security context, and errors

The current screenshot showed a generic unsupported-browser message while the app was opened from a LAN HTTP URL resembling `http://192.168.0.117:3000`. Do not assume the API provider is responsible without evidence.

The implementation must distinguish at least:

- Insecure context: explain that microphone recording requires a secure connection on this device; offer a verified HTTPS URL where available and immediate text/manual fallback.
- Browser recording API unavailable: show a capability-specific message and fallback.
- Permission denied: explain how to grant permission and provide text/manual actions.
- No microphone device: offer text/manual fallback.
- Unsupported recording format: select a supported format or display a clear fallback.
- Upload/network error: preserve retryable transcript/draft state where possible and do not show false success.
- Provider not configured or transcription failure: report a server/provider error separately from browser capability failure.
- Mock provider: show a visible developer/demo-mode indicator; never present synthetic transcript output as live transcription.

Inspect actual runtime/browser capabilities and the existing `/api/voice/transcribe` contract before implementation. Avoid leaking stack traces, secrets, audio payloads, or provider keys into user-visible errors or logs.

## 7. Dashboard — plain-language business overview

### Page purpose

The Dashboard should answer “How is my business doing?” at a glance. Avoid accounting jargon. Users must be able to open the underlying ledger entries from each metric/card.

### Header and period control

- Heading: `Business Overview` or `Your business at a glance`.
- Period selection: Daily, Weekly, Monthly, with the selected date range clearly shown, e.g. `Today · 15 Oct 2026` or `This week · 12–18 Oct 2026`.
- Never render `undefined` dates or period labels. If the period cannot be calculated, show a recoverable error and retry action rather than fabricating a date.
- Use the configured business timezone to compute period boundaries.

### Metric order and definitions

1. **Sales** — total value of sales made during the selected period.
2. **Cash Collected** — cash received at sale plus customer payments received during the selected period.
3. **Customers Owe** — outstanding linked customer receivables as of the selected period end.
4. **Supplier Payments Due** — outstanding linked supplier bills/payables as of the selected period end.
5. **Expenses** — explicitly recorded paid business expenses during the selected period.
6. **Profit** — show only if the required cost data is available and sufficiently complete. Otherwise show `Not available` with `There is not enough cost information to calculate profit reliably.` Never guess.

Explain each value briefly in everyday English. Ensure metric definitions match server-calculated results and ledger drill-downs. A sale cannot count its unpaid portion as cash. A subsequent customer payment increases cash collected but not Sales. Supplier payments reduce supplier payables and are not automatically counted as a second expense.

### Empty/loading/error states

- New business: show a concise empty state and `Record your first transaction` CTA. Do not seed fake records.
- Loading: skeletons or compact loading indicators without layout jumps.
- Error: plain-language message and Retry action; do not silently show stale data as fresh.
- Refresh button, if present, must work and have an accessible name.

## 8. New Entry page

Show three clear choices:

1. `Speak to Record` — primary voice input.
2. `Type a Note` — English everyday text.
3. `Fill in a Form` — manual entry.

Each choice explains what will happen next. Avoid making the tab strip the only way to discover the actions. Do not use icon-only controls as the sole entry points.

### Text Note

- Label: `Describe your transaction in English`.
- Comfortable multiline textarea; avoid a small fixed-height box that clips essential text.
- Example placeholder should show a consistent financial scenario, e.g. `Sold goods for 2000, received 1500, customer owes 500.`
- Process button enabled only when input is non-empty and the app is ready.
- If using mock mode, show a clear `Demo mode` label.

## 9. Transaction draft review and confirmation

After extraction or manual form entry, show a single clear review view before persistence. Present the fields in readable order:

- Transaction type.
- Total amount and currency.
- Amount received now, where applicable.
- Derived customer due or remaining supplier payable, when deterministically calculable.
- Related sale/bill for a customer or supplier payment.
- Date.
- Counterparty and description, if supplied.
- Missing or ambiguous information that requires clarification.

Actions:

- Primary: `Confirm and Save`.
- Secondary: `Edit`.
- Destructive/tertiary: `Cancel`.

The server must repeat validation and authoritative calculations when the user confirms. No record may be saved before explicit confirmation. Disable repeated submissions while saving and enforce server-side idempotency. On save failure, preserve the draft and provide retry. On success, show a genuine success state and a path to the saved ledger record.

## 10. Manual transaction form

Use fields and validation conditional on the selected one of the five approved transaction types. Keep field labels and amount semantics explicit.

### SALE

- Total sale amount: required.
- Amount received at sale: required or explicitly selected as `Unknown` with a clarification state; zero is allowed for a fully unpaid sale. Do not default silently to full payment.
- Date: required.
- Counterparty: optional unless needed to resolve a specific business rule.
- Description: optional.
- Validate `0 <= amount received <= total sale`.

### CUSTOMER_PAYMENT

- Payment amount: required.
- Related eligible sale/receivable: required.
- Date: required.
- Reject payments above the remaining receivable, including under concurrent requests.

### SUPPLIER_BILL

- Bill amount: required.
- Date: required.
- Supplier/counterparty: optional unless required by a linking or clarification rule.
- Due date: optional; do not invent it.

### SUPPLIER_PAYMENT

- Payment amount: required.
- Related eligible supplier bill/payable: required.
- Date: required.
- Reject payments above the remaining payable.

### EXPENSE

- Paid expense amount: required.
- Date and category/description according to approved requirements.
- Never create stock or inventory effects.

### General form rules

- Show the configured business currency dynamically. Do not hardcode BDT in field labels when currency is configurable.
- Use sensible numeric input behavior and clear field-level errors.
- Never infer payment status, amounts or dates silently.
- Keep Save/Review controls visible and usable with a mobile keyboard open.

## 11. Ledger

### Desktop

Use an accessible table/list with date, transaction type, counterparty/description, amount, relevant linked due/paid details, status, and allowed actions.

### Mobile

Use vertically stacked transaction cards; do not squeeze a desktop-wide table into the screen.

### Filters

- Search by counterparty or note.
- Transaction type.
- Active/voided status.
- Date range where implemented.

At narrow widths, stack search and filter controls or use a responsive grid. No filter dropdown should be clipped off-screen. If horizontal scrolling is necessary for a specific subtable, scope it inside the table container rather than the entire page.

### Record actions

- Show meaningful status and details.
- Require confirmation before voiding.
- Never silently void a parent sale/bill while active linked payments remain. Follow the approved audited correction policy.
- After edits/voids, refresh the ledger and dashboard from authoritative calculations.
- Display an honest empty state if there are no records.

## 12. Financing Record Readiness

Use the heading `Financing Record Readiness` and a short, prominent statement that DokanSaathi helps organize records but does not approve loans or guarantee financing.

For each checklist item show:

- Item name.
- Status: e.g. `Documented`, `User reported`, `Needs attention`, `Missing`, or `Unverified`.
- `What we know`: the actual source (for example, a count of saved ledger records or a user-reported status).
- `Suggested next step`: cautious and non-universal guidance.

Rules:

- Authenticated account does not equal verified identity/KYC document.
- A saved business profile does not prove that a Trade License exists or is current.
- A configured currency does not prove a bank/MFS account exists.
- Transaction history counts must match the underlying active records and categories.
- A checklist completion percentage describes checklist status only, never creditworthiness, eligibility, or probability of loan approval.
- If a document has not been uploaded, reported, or independently verified by a real supported mechanism, label it accurately.
- Do not invent lender-specific mandatory documents or minimum record periods.

## 13. Accessibility and interaction quality

- Semantic HTML and explicit field labels.
- Keyboard-accessible menus, dialogs, forms, filters and confirmation actions.
- Visible focus states and logical focus order.
- Proper dialog focus trapping/restoration.
- Accessible status announcements for save success, validation errors and recording state.
- Sufficient contrast; color is never the sole status signal.
- Touch targets approximately 44×44 CSS pixels wherever practical.
- Reduced-motion preference honored.
- Clear distinction between enabled, disabled, loading, error and success states.
- No forced mic permission before the user chooses Voice.

## 14. Required UX acceptance tests

At minimum, plan automated and/or browser-assisted tests for:

1. FAB placement above bottom navigation at 320, 360, 390, and 430px widths.
2. No important control obscured by FABs, bottom navigation, safe areas, dialogs, or keyboard.
3. FABs open voice/manual input correctly on Dashboard, Ledger and Readiness.
4. Floating actions do not duplicate entry controls on New Entry.
5. Voice states for insecure context, unsupported APIs, permission denied, no device, recording, upload, provider error and success.
6. Text/manual fallback remains usable after voice failure.
7. Manual sale with partial payment balances correctly.
8. An empty collected amount does not silently default to full collection.
9. Review/Edit/Cancel/Confirm and persistence guards work.
10. Dashboard never displays undefined period/date values.
11. Daily, Weekly and Monthly periods return correct distinct totals with controlled data across dates/timezones.
12. Ledger filters remain usable at narrow widths without page overflow.
13. Readiness evidence/status matches real persisted data and does not infer verification from authentication/profile state.
14. Keyboard-only flows and screen-reader status announcements work.
15. No inventory/forecasting feature is accidentally introduced.

## 15. Implementation procedure for Antigravity

Before making changes:

1. Read all three approved specification files.
2. Inspect the current repository and the actual components, routes, voice adapter, dashboard date calculations, ledger filters and readiness data mapping.
3. Verify available Superpowers skills and Multi-Agent capabilities. Use read-only specialist reviewers for voice/browser support, UI/UX, financial calculations, and readiness/security if available.
4. Create an implementation plan mapping each real finding to affected files, root cause, fix, tests and acceptance criteria.
5. Present the plan and stop for explicit user approval. Do not edit source files during this stage.

After explicit approval:

- Use supported Superpowers workflows such as `writing-plans`, `subagent-driven-development`, `test-driven-development`, `systematic-debugging`, and `requesting-code-review` where actually installed.
- Preserve existing user changes and use safe isolated workspaces when appropriate.
- Implement the smallest correct change; do not rebuild the app from scratch.
- Use actual browser testing where supported and separate mock behavior from live provider verification.
- Run relevant unit, integration, E2E, accessibility, lint, typecheck and production build checks.
- Report commands and actual results. Do not claim tests or UI checks passed unless they ran.

### Final scope gate

The output must improve the existing DokanSaathi app according to this blueprint while preserving the three approved project documents. Do not introduce unapproved providers, paid services, new transaction types, forecasting, inventory, native apps, or offline synchronization. Do not deploy to production or expose secrets without explicit approval.
