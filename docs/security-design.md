# DokanSaathi — Security Architecture & Data Isolation Design

**Project:** DokanSaathi — English-first SME Finance Copilot for Small Businesses  
**Competition:** 2026 Shenzhen International FinTech Competition (FinTechathon), International Track  
**Document Type:** Security Specification & Threat Model  
**Authoritative References:** `01_dokansaathi_master_prd_v2.md` & `02_dokansaathi_agent_architecture_v2.md`

---

## 1. Security Philosophy & Principles

Small business financial records contain highly sensitive competitive and privacy data, including revenues, customer debts, and supplier payment terms. DokanSaathi adheres to the following principles:

1. **Defense in Depth:** Multi-tenant data isolation is enforced at every layer—database (Row-Level Security), API middleware (`verifyBusinessOwnership`), and presentation logic. Hiding UI elements is never considered a security control.
2. **Deterministic Server Verification:** AI models are treated as untrusted draft generators. No AI agent or LLM has direct database write permissions or executes authoritative financial calculations.
3. **Secret Containment:** API keys, database service-role secrets, and AI provider credentials exist exclusively in server-side environment variables. No secret is ever exposed in client bundles or committed to source control.
4. **Immutable Audit Trails:** Physical deletion of financial records is prohibited at the database level (`USING (false)` on DELETE). All removals are soft-deletes (`status = 'voided'`) requiring a documented reason recorded in `transaction_audit_events`.
5. **Idempotent Operations:** Critical write paths enforce idempotency keys to prevent duplicate transaction entries resulting from network retries or double clicks.

---

## 2. Row-Level Security (RLS) Policy Architecture

All tables in PostgreSQL / Supabase have Row-Level Security permanently enabled:

```sql
-- Enable RLS on core financial tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_feedback ENABLE ROW LEVEL SECURITY;
```

### Policy Summary Table

| Table | Policy Name | Command | Enforcement Logic |
| :--- | :--- | :--- | :--- |
| `businesses` | `businesses_owner_select` | `SELECT` | `auth.uid() = owner_id` |
| `businesses` | `businesses_owner_insert` | `INSERT` | `auth.uid() = owner_id` |
| `businesses` | `businesses_owner_update` | `UPDATE` | `auth.uid() = owner_id` |
| `businesses` | `businesses_no_delete` | `DELETE` | `USING (false)` — Physical deletion prohibited |
| `transactions` | `transactions_business_select` | `SELECT` | Belongs to business where `businesses.owner_id = auth.uid()` |
| `transactions` | `transactions_business_insert` | `INSERT` | Target business owned by `auth.uid()` |
| `transactions` | `transactions_business_update` | `UPDATE` | Target business owned by `auth.uid()` |
| `transactions` | `transactions_no_delete` | `DELETE` | `USING (false)` — Physical deletion strictly blocked |
| `transaction_audit_events` | `audit_events_select` | `SELECT` | Belongs to business where `businesses.owner_id = auth.uid()` |
| `transaction_audit_events` | `audit_events_insert` | `INSERT` | `actor_id = auth.uid()` |

---

## 3. Server-Side Authentication & Authorization Guard

All protected API endpoints invoke `verifyBusinessOwnership` before inspecting or altering records:

```typescript
// src/lib/auth/guard.ts
const authResult = await verifyBusinessOwnership(requestedBusinessId);
if (!authResult.authorized) {
  return NextResponse.json(
    { error: authResult.message, code: authResult.code },
    { status: authResult.status }
  );
}
```

### Guard Verification Steps:
1. Validates Supabase JWT session cookie. Rejects unauthenticated requests with HTTP 401 (`AUTH_REQUIRED`).
2. Checks whether the target `business_id` is owned by the authenticated `user.id`.
3. If an authenticated user attempts to access another shop's `business_id`, the guard immediately terminates the request with HTTP 403 (`ACCESS_DENIED`).
4. Automated regression tests verify cross-tenant isolation in `tests/integration/rls-isolation.test.ts`.

---

## 4. Financial Input & AI Boundary Security

```
[Shopkeeper Speech / Text]
           │
           ▼
[Ephemeral Transcription / Input Parser]
           │
           ▼
[AI Structured Extractor] (System Prompt Enforces Financial Invariants)
           │
           ▼
[Unsaved Draft Payload] (In-Memory Only, Zero DB Writes)
           │
           ▼
[Editable Review Card in UI] (Confirm / Edit / Cancel)
           │
   ┌───────┴───────┐
[Cancel]        [Confirm and Save]
   │               │
(Discarded)   (Idempotency Key Generated)
                   │
                   ▼
       [Server-Side Zod Validation]
                   │
                   ▼
       [Audited Database Insert]
```

### Key Security Properties:
- **No Direct LLM DB Access:** The LLM receives no tools for SQL execution, table mutation, or database querying. It outputs structured JSON conforming to `LedgerDraftPayload`.
- **Explicit Confirmation Mandatory:** No transaction can enter the database without the user explicitly clicking "Confirm and Save".
- **Prompt Injection Defense:** Strict Zod schema parsing validates transaction types against an exact enumeration (`SALE`, `CUSTOMER_PAYMENT`, `SUPPLIER_BILL`, `SUPPLIER_PAYMENT`, `EXPENSE`), rejects non-numeric or negative amounts, and normalizes strings. Any injection attempting to instruct the server to run unauthorized commands is rejected by schema validation.

---

## 5. Audit Logging & Soft Deletion

When a transaction is voided via `POST /api/transactions/[id]/void`:
1. The server verifies business ownership.
2. A mandatory `reason` string must be provided.
3. The transaction's status is updated to `voided`.
4. A record is inserted into `transaction_audit_events`:
   - `transaction_id`: target transaction ID
   - `event_type`: `'void'`
   - `actor_id`: authenticated user ID
   - `metadata`: `{ reason, voided_at }`
5. The voided transaction is excluded from all dashboard metrics and active ledger views.
