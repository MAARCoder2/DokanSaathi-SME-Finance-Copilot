import { z } from "zod";
import Decimal from "decimal.js";
import {
  TRANSACTION_TYPES,
  INPUT_SOURCES,
  DraftTransaction,
  LedgerDraftPayload,
  ValidationErrorItem,
  ValidationResult,
} from "../../types";

export const DraftTransactionZodSchema = z.object({
  draft_id: z.string().min(1),
  transaction_type: z.enum(TRANSACTION_TYPES),
  transaction_date: z.string().nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  currency_mentioned_by_user: z.string().nullable().optional(),
  amount: z.string().nullable(),
  amount_collected_at_sale: z.string().nullable().optional(),
  counterparty_name: z.string().nullable().optional(),
  related_transaction_id: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  needs_clarification: z.boolean(),
  clarification_reason: z.string().nullable().optional(),
});

export const LedgerDraftPayloadZodSchema = z.object({
  schema_version: z.literal("1.0"),
  input_language: z.literal("en"),
  source: z.enum(INPUT_SOURCES),
  raw_input: z.string().min(1),
  draft_transactions: z.array(DraftTransactionZodSchema).min(1),
  needs_clarification: z.boolean(),
  clarification_question: z.string().nullable().optional(),
});

/**
 * Validates a single DraftTransaction against financial integrity constraints
 */
export function validateDraftTransaction(
  draft: DraftTransaction,
  businessCurrency: string
): { isValid: boolean; errors: ValidationErrorItem[] } {
  const errors: ValidationErrorItem[] = [];

  // Check currency mismatch
  if (
    draft.currency_mentioned_by_user &&
    draft.currency_mentioned_by_user !== businessCurrency
  ) {
    errors.push({
      field: "currency",
      code: "CURRENCY_MISMATCH",
      message: `The currency mentioned (${draft.currency_mentioned_by_user}) differs from your business reporting currency (${businessCurrency}). Automatic conversion is not permitted.`,
    });
  }

  // Validate amount presence & format
  if (!draft.amount) {
    errors.push({
      field: "amount",
      code: "AMOUNT_REQUIRED",
      message: "Transaction amount is required.",
    });
    return { isValid: false, errors };
  }

  let amountDec: Decimal;
  try {
    amountDec = new Decimal(draft.amount);
    if (amountDec.isNegative() || !amountDec.isFinite()) {
      errors.push({
        field: "amount",
        code: "INVALID_AMOUNT",
        message: "Amount must be a non-negative finite number.",
      });
      return { isValid: false, errors };
    }
  } catch {
    errors.push({
      field: "amount",
      code: "INVALID_AMOUNT",
      message: "Amount format is invalid.",
    });
    return { isValid: false, errors };
  }

  // Invariant validation per transaction type
  if (draft.transaction_type === "SALE") {
    if (draft.amount_collected_at_sale === null || draft.amount_collected_at_sale === undefined) {
      errors.push({
        field: "amount_collected_at_sale",
        code: "PAYMENT_SPLIT_UNKNOWN",
        message: "Please specify how much was collected at the sale and how much is owed.",
      });
    } else {
      try {
        const collectedDec = new Decimal(draft.amount_collected_at_sale);
        if (collectedDec.isNegative()) {
          errors.push({
            field: "amount_collected_at_sale",
            code: "INVALID_AMOUNT",
            message: "Amount collected cannot be negative.",
          });
        } else if (collectedDec.greaterThan(amountDec)) {
          errors.push({
            field: "amount_collected_at_sale",
            code: "PAYMENT_EXCEEDS_SALE",
            message: "Amount collected cannot exceed the total sale amount.",
          });
        }
      } catch {
        errors.push({
          field: "amount_collected_at_sale",
          code: "INVALID_AMOUNT",
          message: "Collected amount format is invalid.",
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates full LedgerDraftPayload structure and business rules
 */
export function validateLedgerDraftPayload(
  payload: LedgerDraftPayload,
  businessCurrency: string
): ValidationResult {
  const parseResult = LedgerDraftPayloadZodSchema.safeParse(payload);
  if (!parseResult.success) {
    const zodErrors: ValidationErrorItem[] = parseResult.error.issues.map((issue) => ({
      field: issue.path.join("."),
      code: "SCHEMA_VALIDATION_ERROR",
      message: issue.message,
    }));
    return {
      status: "invalid",
      errors: zodErrors,
      draft: payload,
    };
  }

  const allErrors: ValidationErrorItem[] = [];
  for (const draftTx of payload.draft_transactions) {
    const txValidation = validateDraftTransaction(draftTx, businessCurrency);
    if (!txValidation.isValid) {
      allErrors.push(...txValidation.errors);
    }
  }

  if (allErrors.length > 0 || payload.needs_clarification) {
    return {
      status: "needs_clarification",
      errors: allErrors,
      draft: payload,
    };
  }

  return {
    status: "valid",
    errors: [],
    draft: payload,
  };
}
