# DokanSaathi — Core Financial Algorithms & Invariant Proofs

**Project:** DokanSaathi — English-first SME Finance Copilot for Small Businesses  
**Competition:** 2026 Shenzhen International FinTech Competition (FinTechathon), International Track  
**Selected Topic:** Topic E — SME Finance Copilot  
**Authoritative Sources:** `01_dokansaathi_master_prd_v2.md` & `02_dokansaathi_agent_architecture_v2.md`

---

## 1. Executive Overview

DokanSaathi enforces a deterministic, double-entry-grounded financial computation model designed specifically for retail and small-business shopkeepers in emerging markets. Unlike conventional generic accounting software that requires shopkeepers to understand debits and credits, DokanSaathi abstracts bookkeeping into 5 atomic, real-world transaction types, while rigorously maintaining formal mathematical invariants in application code.

Crucially:
- **Zero LLM Math:** The language model produces structured JSON drafts only; all arithmetic, balances, and period totals are computed by deterministic TypeScript application code.
- **Decimal Safety:** All monetary calculations use `decimal.js` with 2 decimal places to eliminate IEEE 754 floating-point inaccuracies.
- **Audit Traceability:** Soft-deletes only (`status: 'voided'`), zero physical deletions, and append-only audit event logging.

---

## 2. The Five Approved Transaction Types

| Transaction Type | Description | Cash Flow Impact | Ledger Balance Impact |
| :--- | :--- | :--- | :--- |
| `SALE` | A retail customer purchase event. | Cash collected upfront increases cash balance. | Remainder (`amount - collected`) creates customer receivable (due). |
| `CUSTOMER_PAYMENT` | A customer pays toward past credit owed. | Increases cash collected in period. | Reduces outstanding customer receivable; **does not increase sales**. |
| `SUPPLIER_BILL` | Wholesale inventory or goods received on credit. | No upfront cash outflow. | Creates supplier payable (due). |
| `SUPPLIER_PAYMENT` | Payment made toward an outstanding supplier bill. | Decreases cash. | Reduces outstanding supplier payable; **does not create an expense**. |
| `EXPENSE` | Operating shop cost (rent, electricity, transport, wages). | Decreases cash. | Increases operating expenses. |

---

## 3. Core Financial Invariants & Mathematical Formulations

### Invariant 1: Sale Total and Customer Receivable Split
For any `SALE` transaction:
$$\text{Total Sale Amount} = \text{Amount Collected at Sale} + \text{Customer Receivable (Due)}$$

```typescript
const saleAmount = new Decimal(tx.amount);
const cashCollected = new Decimal(tx.amount_collected_at_sale || tx.amount);
const customerDue = saleAmount.minus(cashCollected);
// Assertion: customerDue >= 0
```
- If full payment is made at sale, `cashCollected = saleAmount` and `customerDue = 0.00`.
- If partial payment is made (e.g. 2,000 sale, 1,500 collected), `cashCollected = 1,500.00` and `customerDue = 500.00`.

### Invariant 2: Later Customer Payments Do Not Inflate Sales
When a customer subsequently pays an outstanding balance:
$$\Delta \text{Sales} = 0$$
$$\Delta \text{Cash Collected} = +\text{Payment Amount}$$
$$\Delta \text{Customer Receivables} = -\text{Payment Amount}$$

*Example verified by test `tests/unit/ledger-invariants.test.ts`:*
1. Initial Sale of 2,000 with 1,500 collected:
   - `sales_total = 2,000.00`
   - `cash_collected = 1,500.00`
   - `customer_receivables = 500.00`
2. Later Customer Payment of 500:
   - `sales_total = 2,000.00` (unchanged!)
   - `cash_collected = 2,000.00` (1,500 + 500)
   - `customer_receivables = 0.00` (500 - 500)

### Invariant 3: Supplier Payments Settle Payables Without Duplicate Bills or Expenses
When a shopkeeper records a supplier payment against an earlier supplier bill:
$$\Delta \text{Expenses} = 0$$
$$\Delta \text{Supplier Payables} = -\text{Payment Amount}$$

*Example verified by test `tests/unit/ledger-invariants.test.ts`:*
1. Supplier Bill of 3,000 from Meghna Wholesalers:
   - `supplier_payables = 3,000.00`
   - `expenses_total = 0.00`
2. Supplier Payment of 1,000:
   - `supplier_payables = 2,000.00`
   - `expenses_total = 0.00` (unchanged; supplier purchase is not double-counted as an operating expense)

### Invariant 4: Exclusion of Voided Records
Transactions marked `status: 'voided'` are strictly filtered out before computing dashboard totals:
$$\text{ActiveRecords} = \{ tx \in \text{Transactions} \mid tx.status = 'active' \}$$
All totals and metrics iterate strictly over $\text{ActiveRecords}$.

### Invariant 5: Timezone-Aware Period Boundaries
Period totals must reflect the shop's operational timezone (e.g., `Asia/Dhaka`, UTC+6):
- **Daily View:** `00:00:00` to `23:59:59` local time on the target date.
- **Weekly View:** Monday `00:00:00` to Sunday `23:59:59` local time.
- **Monthly View:** First calendar day `00:00:00` to last calendar day `23:59:59` local time.
Period totals filter by `tx.transaction_date >= periodStart && tx.transaction_date <= periodEnd`.
Outstanding balances (receivables and payables) reflect cumulative state as of `periodEnd`.

### Invariant 6: Withholding Estimated Profit on Incomplete Cost Data
DokanSaathi enforces a strict truthfulness invariant:
$$\text{Cost Data Incomplete} \implies \text{profit\_status} = \text{'insufficient\_cost_data'} \land \text{profit\_amount} = \text{null}$$
To protect shopkeepers from making flawed business decisions or submitting inaccurate records to lenders, DokanSaathi refuses to invent presumed profit margins or cost estimates.

---

## 4. Verification Evidence

All invariants are proven through automated Vitest test suites:
- `tests/unit/finance-calculator.test.ts` (12 unit tests)
- `tests/unit/ledger-invariants.test.ts` (4 invariant regression tests)
- `tests/unit/periods.test.ts` (4 timezone boundary tests)
- `tests/integration/api-endpoints.test.ts` (4 API integration tests)
