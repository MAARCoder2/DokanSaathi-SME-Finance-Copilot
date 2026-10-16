# DokanSaathi — 3-Minute Competition Demo Script & Presentation Guide

**Competition:** 2026 Shenzhen International FinTech Competition (FinTechathon), International Track  
**Track & Theme:** Topic E — SME Finance Copilot | "AI as a Financial Participant"  
**Target Audience:** Competition Judges, FinTech Practitioners, Micro-enterprise Lenders  
**Presenter:** DokanSaathi Team  
**Demonstration Length:** 3 Minutes (Live Interactive Web App)

---

## 1. Scenario & Persona Setup

- **Business Name:** Bhai Bhai General Store
- **Location:** Mirpur-10, Dhaka, Bangladesh
- **Owner Persona:** Md. Rahim, independent retail grocery shopkeeper
- **Operating Context:** High volume of informal credit ("bakir khata"), paper memo books, and difficulty qualifying for formal commercial loans due to unstructured financial history.
- **Language:** English-first interface and voice/text copilot.

---

## 2. Minute-by-Minute Live Demo Flow

### [0:00 - 0:30] Problem Context & Architecture
**On Screen:** DokanSaathi Landing Page (`/`) showing the clean value proposition.  
**Presenter Speaks:**
> "Small retail shopkeepers across emerging markets power local economies, yet millions remain excluded from formal finance. The problem isn't that their businesses aren't viable—it's that their financial records are trapped in informal paper notebooks or fragmented memories.
>
> Existing accounting software is intimidating, requiring shopkeepers to understand debits and credits. Conversely, unchecked AI models hallucinate calculations or leak data.
>
> DokanSaathi is an English-first SME Finance Copilot built on a fundamental principle: **AI generates structured drafts, but deterministic code computes finances and the human owner retains authoritative control.**"

---

### [0:30 - 1:15] Core Workflow: Voice / Text Entry, Draft Review & Confirmation
**On Screen:** Navigate to **New Entry** (`/transactions/new`).  
**Action:** In the Text Note tab, enter:
> *"Sold groceries for 2000 BDT, customer Rahim paid 1500 cash"*
> *(or click the microphone icon in Voice tab)*  
**Click:** "Process Note"

**On Screen:** Instantly renders the `TransactionReviewCard`.  
**Presenter Highlights:**
> "Notice what happened:
> 1. The AI model parsed the input into a structured financial draft: a `SALE` of 2,000 BDT.
> 2. It separated the upfront collection of 1,500 BDT from the 500 BDT remaining credit balance.
> 3. **Crucially, nothing has been saved to the database.**
>
> In DokanSaathi, the human owner always verifies the record. If the numbers need adjustment, the shopkeeper can click 'Edit Details' or 'Cancel'. Only when they click 'Confirm and Save' does an idempotent, audited record enter the ledger."  
**Action:** Click **"Confirm and Save"**. Green success confirmation banner displays.

---

### [1:15 - 1:55] Ledger Invariants & Audit Traceability
**On Screen:** Navigate to **Ledger** (`/transactions`).  
**Presenter Highlights:**
> "Here in the verified Financial Ledger, our sale is permanently recorded.
>
> Now consider what happens when customer Rahim returns later to pay that 500 BDT due.
> In flawed accounting software or LLM hallucinations, recording a payment often erroneously counts as a second sale.
> In DokanSaathi, our deterministic calculator enforces strict mathematical invariants:
> - Customer payments reduce receivables and increase cash collected.
> - **They never inflate sales.**
> - Supplier payments reduce payables without creating duplicate expenses.
>
> Furthermore, DokanSaathi enforces an immutable audit trail: physical deletion is blocked at the database level. Any transaction correction requires an audited void reason."

---

### [1:55 - 2:35] Plain-English Dashboard & Deterministic Truth
**On Screen:** Navigate to **Dashboard** (`/dashboard`).  
**Action:** Toggle between **Daily**, **Weekly**, and **Monthly** views.  
**Presenter Highlights:**
> "The dashboard provides an instant, plain-English picture of business health in the shop's local timezone.
>
> Notice our six metric cards:
> 1. Total Sales in period
> 2. Actual Cash Collected
> 3. Customer Receivables outstanding
> 4. Supplier Payables outstanding
> 5. Operating Expenses
> 6. And look at Estimated Profit: **it is marked 'Unavailable'.**
>
> Why? Because DokanSaathi refuses to invent fake numbers. When item-level wholesale cost data is incomplete, our engine transparently states: *'Cost information is incomplete. To protect your financial decisions, DokanSaathi does not invent estimated profit.'* That is AI as a trustworthy financial participant."

---

### [2:35 - 3:00] Financing Record Readiness & Conclusion
**On Screen:** Navigate to **Readiness** (`/readiness`).  
**Presenter Highlights:**
> "Finally, when the shopkeeper considers applying for working capital, DokanSaathi provides the **Financing Record Readiness Checklist**.
>
> Grounded in real SME lending requirements, it tracks 6 evidence-based categories across Identity, Bank Account Details, Sales History, Receivables, Supplier Payables, and Operating Expenses.
>
> Each category clearly displays its provenance—distinguishing user-reported data from application record-derived ledger entries. Real record counts are shown without arbitrary thresholds.
>
> Most importantly, DokanSaathi is transparent and compliant: it prominently displays statutory disclaimers explaining that this is an organizational readiness guide, not a loan guarantee.
>
> DokanSaathi: Safe, deterministic, verifiable financial records for the backbone of emerging economies. Thank you."

---

## 3. Demo Backup & Troubleshooting Q&A

**Q: Does DokanSaathi require an internet connection?**  
*A:* The MVP is a responsive web application designed for low-bandwidth mobile connectivity. For demonstration and offline testing, DokanSaathi includes an offline mock provider and local sandbox that executes 100% without external API calls.

**Q: Can the AI model access customer bank accounts or approve loans?**  
*A:* No. DokanSaathi is strictly a financial copilot and recordkeeping tool. It has no integration with money movement, payment execution, or loan underwriting.

**Q: Why English-only in the MVP?**  
*A:* Per FinTechathon International Track rules and the Master PRD, English is the required international competition medium. The architecture is modular so localized speech models can be integrated in post-competition phases.
