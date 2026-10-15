/**
 * DokanSaathi Core Type Definitions
 * Authoritative baseline from 01_dokansaathi_master_prd_v2.md & 02_dokansaathi_agent_architecture_v2.md
 */

export const TRANSACTION_TYPES = [
  "SALE",
  "CUSTOMER_PAYMENT",
  "SUPPLIER_BILL",
  "SUPPLIER_PAYMENT",
  "EXPENSE",
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const INPUT_SOURCES = ["voice", "text", "manual"] as const;
export type InputSource = (typeof INPUT_SOURCES)[number];

export const TRANSACTION_STATUSES = ["active", "voided"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  business_type: string;
  currency: string; // ISO 4217, e.g. "BDT", "USD"
  timezone: string; // e.g. "Asia/Dhaka"
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  business_id: string;
  type: TransactionType;
  transaction_date: string; // YYYY-MM-DD
  currency: string;
  amount: string; // Decimal string (e.g. "2000.00") to avoid IEEE 754 precision loss
  amount_collected_at_sale: string | null;
  counterparty_name: string | null;
  related_transaction_id: string | null;
  due_date: string | null;
  category: string | null;
  note: string | null;
  source: InputSource;
  status: TransactionStatus;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface DraftTransaction {
  draft_id: string;
  transaction_type: TransactionType;
  transaction_date: string | null;
  currency: string;
  currency_mentioned_by_user: string | null;
  amount: string | null;
  amount_collected_at_sale: string | null;
  counterparty_name: string | null;
  related_transaction_id: string | null;
  due_date: string | null;
  category: string | null;
  note: string | null;
  needs_clarification: boolean;
  clarification_reason: string | null;
}

export interface LedgerDraftPayload {
  schema_version: "1.0";
  input_language: "en";
  source: InputSource;
  raw_input: string;
  draft_transactions: DraftTransaction[];
  needs_clarification: boolean;
  clarification_question: string | null;
}

export interface ValidationErrorItem {
  field: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  status: "valid" | "needs_clarification" | "invalid";
  errors: ValidationErrorItem[];
  draft: LedgerDraftPayload;
}

export type PeriodType = "daily" | "weekly" | "monthly";

export type ProfitStatus = "insufficient_cost_data" | "complete";

export interface DashboardSummary {
  period: PeriodType;
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
  business_timezone: string;
  currency: string;
  sales_total: string;
  cash_collected_in_period: string;
  customer_receivables_as_of_period_end: string;
  supplier_payables_as_of_period_end: string;
  expenses_total: string;
  profit_status: ProfitStatus;
  profit_amount: string | null;
}

export type ChecklistItemStatus = "available" | "missing" | "not_applicable" | "unverified";

export interface ReadinessChecklistItem {
  item_id: string;
  label: string;
  status: ChecklistItemStatus;
  requirement_source: string;
  explanation: string;
  notes?: string;
}

export interface LoanReadinessAudit {
  disclaimer: string;
  record_summary: {
    sales_history_available: boolean;
    first_record_date: string | null;
    last_record_date: string | null;
    sales_record_count: number;
    receivable_tracking_available: boolean;
    supplier_payable_tracking_available: boolean;
    expense_history_available: boolean;
  };
  checklist_items: ReadinessChecklistItem[];
  completeness_score: number | null; // Transparent ratio over listed checklist items
}

export interface TransactionAuditEvent {
  id: string;
  business_id: string;
  transaction_id: string;
  user_id: string;
  action: "create" | "edit" | "void";
  prior_values: Partial<Transaction> | null;
  new_values: Partial<Transaction> | null;
  created_at: string;
}
