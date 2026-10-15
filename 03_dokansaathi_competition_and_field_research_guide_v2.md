# DokanSaathi — FinTechathon 2026 Alignment, Submission & Field Research Guide

**Project:** DokanSaathi — English-first SME Finance Copilot for small businesses in Bangladesh  
**Competition:** 2026 Shenzhen International FinTech Competition (FinTechathon), International Track  
**Selected topic:** Topic E — SME Finance Copilot  
**Theme:** AI as a Financial Participant  
**Document status:** Updated to align with the current DokanSaathi Master PRD and Agent Architecture.  
**Language note:** Competition submissions, presentation materials and reviews must be in English. Local shopkeeper interview questions may be asked in Bangla to collect authentic field evidence.

> **Source of truth:** The current Master PRD defines product scope and acceptance criteria. The Agent Architecture document defines implementation boundaries, schemas, prompts and security rules. This guide covers competition alignment, submission readiness, demo planning and field research; it must not introduce conflicting product requirements.

## 1. Competition Alignment and Product Positioning

DokanSaathi is a small-business financial record and financing-readiness copilot. It helps shopkeepers create structured transaction records from English voice transcripts or English text, review and confirm those records, understand their recorded sales and obligations, and see which business records are available or missing for a potential financing application.

The official International Track identifies Topic E as **SME Finance Copilot**, covering financing and cash-flow support for small businesses. The competition theme is **AI as a Financial Participant**. The official rules state three shared scoring areas: task completion (40%), security and compliance (30%), and innovation and interaction (30%). See the official rules links in Section 8.

### 1.1 What the current MVP can demonstrate

- English voice-to-text or typed input converted into a structured transaction draft.
- Review and correction of extracted fields before saving.
- Explicit **Confirm**, **Edit**, and **Cancel** actions.
- A ledger that separates sales, customer payments, supplier bills, supplier payments, and expenses.
- Daily, weekly, and monthly summaries of recorded financial activity.
- A financing-readiness checklist showing recorded information and missing or unverified records, without claiming to approve a loan.
- Security and correctness controls, including server-side validation and user/business data isolation.

### 1.2 Scope boundaries that must be respected in the demo

The current MVP is **English-only**. The visible UI, voice transcript, buttons, dashboard, error messages, clarification questions and AI responses must be in English. Bangla localization is a future feature.

The following features are **not in the MVP** and must not be shown or described as already implemented:

- Seven-day cash-flow forecasting, forecast-based shortage alerts or recommendations.
- Stock/inventory balance, stock deduction, low-stock alerts or reorder management.
- Native Android application or comprehensive offline synchronization.
- Automatic loan approval, lender eligibility decisions, or unverified lender-specific advice.

A product/competition fit risk remains: Topic E's description mentions financing-option matching and cash-flow support, while this MVP focuses on dependable record creation, financial summaries, and financing-readiness information. Do not claim the MVP provides forecasting or lender matching. In the presentation, explain the implemented scope honestly and identify forecasting or verified financing-option comparison as possible future work, not existing functionality.

## 2. Suggested Three-Minute Product Demo

This is a proposed demo script, not an official competition format. Keep all on-screen text and spoken presentation materials in English. Configure the demo business currency explicitly (for example, BDT) instead of hard-coding currency assumptions into the product schema.

### 0:00–0:25 — Problem and value

Explain that shopkeepers may mix sales, cash collected, customer dues, supplier obligations and expenses in informal records. DokanSaathi structures financial records without making the user learn accounting terminology.

### 0:25–1:15 — Input, extraction and confirmation

Enter an English example such as:

> “Record a sale of 2,000. The customer paid 1,500 and still owes 500.”

Show the extracted draft with transaction type, amount, payment status, date and any relevant counterparty details. The user checks the details and chooses **Confirm**, **Edit**, or **Cancel**. Do not imply a record is saved before confirmation.

The arithmetic must be represented correctly: total sale = 2,000; amount collected = 1,500; remaining customer receivable = 500. The 500 owed must not be counted as cash received, and a later customer payment must not be counted as a second sale.

### 1:15–1:55 — Ledger and dashboard

After confirmation, show the saved record and a Daily/Weekly/Monthly dashboard. Demonstrate only metrics supported by stored records, such as sales, cash collected, customer receivables, supplier payables and recorded expenses. Show profit only when the necessary cost data exists; otherwise explain that there is insufficient cost data to calculate profit.

### 1:55–2:35 — Financing-readiness checklist

Show which business records the app has and which items are missing or unverified. Explain that requirements vary by lender and institution. The app does not guarantee loan approval or treat any unverified list of documents or record periods as universally mandatory.

### 2:35–3:00 — Reliability and close

Briefly show the user-confirmation guardrail, one validation/error state, and how records belonging to one user/business are kept separate from another's. Close with the core value: reliable, reviewable financial records and clear visibility into what information is available for future financing conversations.

**Do not include:** Bangla UI, a bilingual judge inspector panel, seven-day forecast calculations, forecast-based recommendations, or any feature not implemented in the submitted build.

## 3. Competition Submission Requirements

The official International Track rules list the following submission deliverables. Treat this list as the competition requirement; the folder layout in Section 4 is a recommended implementation convention, not an official mandated structure.

### 3.1 Required deliverables checklist

- [ ] **Technical documentation:** system architecture, core algorithm description, and security design.
- [ ] **Presentation deck:** final presentation no longer than 10 minutes.
- [ ] **Source code:** README, GitHub repository link, deployment instructions, and test cases.
- [ ] **Security self-assessment report:** permission-tier implementation and a known-risk list.
- [ ] **Execution evidence:** for non-on-chain topics, simulated-account/sandbox operation logs and a demo video.

### 3.2 Optional deliverable

- [ ] **Demo video:** optional, no longer than 5 minutes according to the published rules. Ensure any submitted video shows the actual submitted build and does not depict future-only functionality as implemented.

### 3.3 Submission hygiene

- Keep documentation, presentation, and review materials in English.
- Ensure code, third-party components, data and assets comply with their licenses and are appropriately attributed.
- Do not include API keys, access tokens, passwords, personal financial data, or unredacted shopkeeper interview details in the repository or demo evidence.
- Use synthetic or explicitly consented and appropriately sanitized demo data. Label synthetic data clearly.
- Make sure the repository link and deployed demo work for a reviewer who does not have local environment access.
- Test the documented installation and test commands from a clean checkout before submission.
- Record known limitations honestly; the security report must not claim controls that have not been implemented and tested.

**Timing note:** The official published rules state a registration and submission deadline of **20 October 2026, 23:59 Beijing Time (UTC+8)**. Verify the organizer's latest instructions before sending the submission, because the organizer's rules and latest received submission govern.

## 4. Recommended GitHub Repository Structure

The competition rules require a README, repository link, deployment instructions and test cases, but do **not** prescribe a specific folder structure. The following structure is a recommendation for the approved Next.js + TypeScript + Tailwind CSS + shadcn/ui + Supabase/PostgreSQL + Vercel stack.

```text
DokanSaathi/
├── README.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── .gitignore
├── .env.example
├── public/
│   ├── manifest.json                 # PWA metadata, if implemented
│   └── icons/                        # App icons, if implemented
├── src/
│   ├── app/                          # Next.js App Router pages and route handlers
│   ├── components/                   # Shared UI components
│   ├── features/
│   │   ├── transactions/             # Entry, draft review, confirmation
│   │   ├── dashboard/                # Daily/weekly/monthly summaries
│   │   └── financing-readiness/      # Record-completeness checklist
│   ├── lib/
│   │   ├── validation/               # Shared schema and input validation
│   │   ├── finance/                  # Deterministic financial calculations
│   │   └── supabase/                 # Client/server Supabase utilities
│   └── types/                        # Shared TypeScript types
├── supabase/
│   └── migrations/                   # Versioned schema and RLS policies
├── tests/
│   ├── unit/                         # Financial and schema logic
│   ├── integration/                  # Database/API permissions and workflows
│   └── e2e/                          # User journeys and responsive flows
├── docs/
│   ├── master-prd.md
│   ├── agent-architecture.md
│   ├── core-algorithms.md
│   ├── security-design.md
│   ├── security-self-assessment.md
│   ├── deployment-guide.md
│   └── demo-script.md
└── evidence/
    ├── README.md                     # Index and context for evidence
    └── sanitized/                    # Redacted logs/screenshots, where appropriate
```

The implementation agent may adapt this layout to an existing repository when justified. It must preserve the requirements above and document deviations rather than restructuring blindly.

### 4.1 README minimum contents

- Project name, one-paragraph summary, target users and Topic E alignment.
- MVP capabilities and explicit out-of-scope features.
- Screenshots or a short demo link from the actual implemented application.
- Technology stack and a high-level architecture diagram.
- Prerequisites and local setup instructions.
- Environment variables required, with links or steps to obtain them; values must not be exposed.
- Database migration and Row Level Security setup instructions.
- Commands to run linting, unit/integration tests and end-to-end tests.
- Public deployment/demo URL, if available, and deployment instructions.
- Security limitations and how to report an issue.

### 4.2 Git and environment rules

- Commit source code, configuration templates, migrations, tests and useful documentation.
- Never commit `.env.local`, actual `.env` files, API keys, Supabase service-role keys, access tokens, passwords, private interview notes, real customer records or private deployment credentials.
- `.env.example` must contain variable names and safe placeholders only.
- Use server-side environment variables for secrets; never expose secret keys through `NEXT_PUBLIC_*` variables or client bundles.
- Enforce user/business data isolation with tested Supabase Row Level Security policies and server-side authorization. Hiding a UI element is not authorization.
- Keep execution logs and screenshots sanitized. Evidence should demonstrate behaviour without exposing real personal or financial data.
- Do not store full raw voice recordings or transcripts longer than necessary without a clear purpose, retention policy and user notice.

## 5. Core Algorithm and Test Evidence to Prepare

The competition asks for a core algorithm description and test cases. For this MVP, describe the actual implemented pipeline: English voice/text input, structured extraction, schema validation, clarification for ambiguity, user review, confirmed save, deterministic financial summaries, and financing-record checklist.

### 5.1 Required test scenarios

- [ ] A valid English text entry becomes a draft with correctly typed fields.
- [ ] A supported English voice entry uses speech-to-text; when voice is unavailable or denied, manual text entry remains available.
- [ ] Ambiguous amount, transaction type, payment status or date is not silently guessed.
- [ ] Cancel does not save the draft.
- [ ] Edit changes the draft and the revised values are what get saved after confirmation.
- [ ] Double-clicks/retries do not create duplicate records for one confirmed submission.
- [ ] A 2,000 sale with 1,500 collected and 500 due is reported as 2,000 sales, 1,500 collected and 500 receivable—not 2,000 cash collected.
- [ ] A later customer payment reduces the outstanding receivable and does not create another sale.
- [ ] Supplier bill and supplier payment are distinct events; payment does not create a second supplier bill.
- [ ] Expenses reduce the appropriate recorded cash/expense totals and are not misclassified as sales.
- [ ] Dashboard date ranges produce consistent totals for Daily, Weekly and Monthly views.
- [ ] Profit is hidden or explicitly marked unavailable when required cost data is absent.
- [ ] Currency formatting follows the business's configured currency; schema values are not hard-coded to BDT.
- [ ] One user/business cannot read, edit or delete another user/business's records through UI, API or direct database access.
- [ ] Missing/invalid authentication and failed database writes return clear English errors without falsely reporting success.
- [ ] Loan-readiness checklist distinguishes available, missing and unverified items and never promises loan approval.
- [ ] The application contains no active stock tracking or seven-day cash-flow forecasting paths in the MVP.
- [ ] Layout and primary workflows are tested at narrow mobile, tablet and desktop widths, including keyboard navigation and focus states.

Attach the real test command and results to the repository or evidence package. Do not claim a test passed unless it was run against the submitted revision.

## 6. Shopkeeper Field Interview Guide

Interview 2–3 local shopkeepers before claiming the product is based on validated field research. Ask permission before recording, avoid collecting sensitive personal details, and use anonymized notes. Do not make up interview findings or use imagined answers as evidence.

The questions below are in Bangla so they can be asked naturally in the field. They are research instruments, not application UI strings. The MVP's interface and AI responses remain English-only under the current plan.

### 6.1 Existing bookkeeping and error points

1. **বর্তমানে হিসাব রাখার পদ্ধতি:** “আপনি প্রতিদিনের বিক্রি, কাস্টমারের বাকি আর পাইকারের পাওনা কীভাবে লিখে রাখেন?”
2. **ভুল হওয়ার জায়গা:** “হিসাব মেলানোর সময় সবচেয়ে বেশি কোথায় গরমিল হয়? সর্বশেষ এমন কোনো ঘটনা মনে আছে?”
3. **Cash versus credit:** “একই বিক্রির কিছু টাকা নগদে পেলে আর কিছু বাকি থাকলে আপনি সেটা কীভাবে লেখেন?”
4. **Later collection or payment:** “কাস্টমারের কাছ থেকে পরে টাকা পেলে বা পাইকারকে পরে টাকা দিলে আগের হিসাব কীভাবে আপডেট করেন?”
5. **Decision support:** “দোকানের হাতে কত টাকা আছে, কাস্টমারের কাছে কত পাওনা, আর পাইকারকে কত দিতে হবে—এগুলো দ্রুত জানতে চাইলে কোন তথ্য সবচেয়ে দরকার হয়?”

### 6.2 Financing and record readiness

6. **Past experience:** “কখনো ব্যবসার জন্য ব্যাংক, এনজিও বা অন্য কোনো প্রতিষ্ঠানে অর্থায়নের জন্য আবেদন করেছেন? করলে তারা কী কী তথ্য বা কাগজ চেয়েছিল?”
7. **Missing records:** “কোন হিসাব বা কাগজপত্র গুছিয়ে দিতে সবচেয়ে বেশি অসুবিধা হয়?”
8. **Trust and privacy:** “ব্যবসার হিসাব অ্যাপে রাখলে কোন বিষয়গুলো নিয়ে আপনার চিন্তা বা আপত্তি হবে?”

### 6.3 Usability risk to investigate

9. **English-only interface:** “মেনু, বোতাম ও বার্তা ইংরেজিতে থাকলে এমন অ্যাপ ব্যবহার করতে আপনার কতটা সুবিধা বা অসুবিধা হবে? কোন শব্দ বুঝতে সমস্যা হতে পারে?”
10. **Input workflow:** “লেনদেন লিখে, কথা বলে, নাকি আগে তৈরি করা ফর্ম পূরণ করে হিসাব রাখতে আপনার জন্য সহজ হবে? কেন?”

The English-only MVP is a current project decision, but its usability with Bangladeshi shopkeepers is a risk that should be tested rather than assumed away. Findings can inform prioritization of future localization without silently changing the approved MVP scope.

### 6.4 Avoid leading questions

Do not ask a shopkeeper to agree with an assumed benefit such as a forecast, a specific warning, or a proposed recommendation that is not implemented. Prefer open questions about what they currently do, where mistakes occur and which information would help them make decisions.

## 7. Field Insight Recording Template

Complete this table only after real interviews. Use anonymous identifiers and avoid recording names, phone numbers or precise identifying details unless genuinely necessary and consented to.

| Field | Shopkeeper A | Shopkeeper B | Shopkeeper C |
|---|---|---|---|
| Business type (broad category only) | Pending interview | Pending interview | Pending interview |
| Current bookkeeping method | Pending interview | Pending interview | Pending interview |
| Common recording/calculation errors | Pending interview | Pending interview | Pending interview |
| How cash sales and credit sales are separated | Pending interview | Pending interview | Pending interview |
| How later customer collections/supplier payments are recorded | Pending interview | Pending interview | Pending interview |
| Financing-related records requested (if applicable) | Pending interview | Pending interview | Pending interview |
| Privacy/security concerns | Pending interview | Pending interview | Pending interview |
| Comfort with English-only UI | Pending interview | Pending interview | Pending interview |
| Preferred input workflow and reason | Pending interview | Pending interview | Pending interview |
| Evidence status and consent notes | Pending interview | Pending interview | Pending interview |

After interviews, separate direct observations from your interpretation. Report the sample size and limitations; do not present 2–3 interviews as proof that all shopkeepers share the same needs.

## 8. Official References and Verification Notes

The following published sources were checked while updating this guide on **15 October 2026**:

1. **Competition rules PDF — primary submission checklist:** [PBCSF Appendix 2 — Problem Description and Competition Rules for International Track](https://www.its.ac.id/international/wp-content/uploads/sites/66/2026/10/PBCSF-Appendix-2-Problem-Description-and-Competition-Rules-for-International-Track.pdf). The PDF lists the topic definitions, scoring weights, English language requirement, submission items, presentation limit, optional demo-video limit, source-code requirements, security self-assessment and execution evidence.
2. **International Track overview:** [IEEE Computational Intelligence Society Singapore Chapter — 2026 FinTechathon](https://www.ieee-cis-singapore.org/2026-fintechathon). This page lists Topic E, team rules, official track language and schedule.
3. **Competition overview and topic description:** [ITS Global Engagement — 2026 Shenzhen International FinTechathon](https://www.its.ac.id/international/2026/10/06/2026-shenzhen-fintechathon-international-track-a-fully-funded-international-competition/).

Competition requirements can change or be supplemented by organizers. Re-check the latest official instructions immediately before submission. This guide is a preparation document and does not replace the official rules or registration instructions.

## 9. Current Readiness Checklist

- [ ] Confirm the Master PRD and Agent Architecture versions in `docs/` match the approved versions.
- [ ] Implement the approved MVP only; keep stock tracking and seven-day forecasting out of scope.
- [ ] Complete and test the English-only voice/text-to-confirmation workflow.
- [ ] Verify financial math, database access isolation, authorization and error handling.
- [ ] Run the full documented tests against the exact revision to be submitted.
- [ ] Complete the technical documentation, security self-assessment and known-risk list.
- [ ] Record sanitized sandbox/demo execution evidence and prepare the optional video if useful.
- [ ] Prepare the presentation deck (10 minutes maximum) and ensure it only claims working functionality.
- [ ] Add the GitHub repository link, README, deployment instructions and test cases to the source-code deliverable.
- [ ] Conduct and document real shopkeeper interviews, if time permits; keep claims proportional to the evidence collected.
- [ ] Re-check the official submission channel and deadline before sending.
