"use client";

import { useState } from "react";
import { Check, Edit3, X, AlertTriangle, ShieldCheck, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DraftTransaction, TransactionType, TRANSACTION_TYPES } from "@/types";

interface TransactionReviewCardProps {
  draft: DraftTransaction;
  onConfirm: (confirmedDraft: DraftTransaction, idempotencyKey: string) => Promise<void>;
  onEdit: (updatedDraft: DraftTransaction) => void;
  onCancel: () => void;
  isSaving: boolean;
  saveError?: string | null;
}

export function TransactionReviewCard({
  draft,
  onConfirm,
  onEdit,
  onCancel,
  isSaving,
  saveError,
}: TransactionReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedType, setEditedType] = useState<TransactionType>(draft.transaction_type);
  const [editedAmount, setEditedAmount] = useState(draft.amount || "");
  const [editedCollected, setEditedCollected] = useState(draft.amount_collected_at_sale || "");
  const [editedDate, setEditedDate] = useState(draft.transaction_date || new Date().toISOString().split("T")[0]);
  const [editedCounterparty, setEditedCounterparty] = useState(draft.counterparty_name || "");
  const [editedNote, setEditedNote] = useState(draft.note || "");

  const handleSaveEdit = () => {
    onEdit({
      ...draft,
      transaction_type: editedType,
      amount: editedAmount,
      amount_collected_at_sale: editedType === "SALE" ? editedCollected : null,
      transaction_date: editedDate,
      counterparty_name: editedCounterparty.trim() || null,
      note: editedNote.trim() || null,
      needs_clarification: false,
      clarification_reason: null,
    });
    setIsEditing(false);
  };

  const handleConfirmClick = async () => {
    const idempotencyKey = `idemp-${draft.draft_id}-${Date.now()}`;
    await onConfirm(draft, idempotencyKey);
  };

  // Derive remaining due for display if SALE
  let derivedCustomerDue: string | null = null;
  if (draft.transaction_type === "SALE" && draft.amount && draft.amount_collected_at_sale) {
    const total = parseFloat(draft.amount) || 0;
    const paid = parseFloat(draft.amount_collected_at_sale) || 0;
    derivedCustomerDue = (total - paid).toFixed(2);
  }

  return (
    <Card className="border-2 border-primary/30 shadow-md bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Review Before Save
            </span>
            <Badge
              variant={
                draft.transaction_type === "SALE"
                  ? "sale"
                  : draft.transaction_type === "CUSTOMER_PAYMENT"
                  ? "payment"
                  : draft.transaction_type === "SUPPLIER_BILL"
                  ? "bill"
                  : "expense"
              }
            >
              {draft.transaction_type.replace("_", " ")}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">Draft ID: {draft.draft_id}</span>
        </div>
        <CardTitle className="text-lg md:text-xl font-bold flex items-center pt-1">
          <span>Verify Financial Details</span>
        </CardTitle>
        <CardDescription>
          No record will be stored in your ledger until you click &quot;Confirm and Save&quot;.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {isEditing ? (
          /* Inline Editing Form */
          <div className="space-y-3 p-3 bg-muted/40 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">Transaction Type</label>
                <select
                  className="w-full h-10 px-2.5 border rounded-md bg-background text-sm"
                  value={editedType}
                  onChange={(e) => setEditedType(e.target.value as TransactionType)}
                >
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold">Total Amount ({draft.currency})</label>
                <Input
                  value={editedAmount}
                  onChange={(e) => setEditedAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {editedType === "SALE" && (
                <div>
                  <label className="text-xs font-semibold">Amount Collected at Sale</label>
                  <Input
                    value={editedCollected}
                    onChange={(e) => setEditedCollected(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold">Date</label>
                <Input
                  type="date"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Customer / Supplier Name</label>
                <Input
                  value={editedCounterparty}
                  onChange={(e) => setEditedCounterparty(e.target.value)}
                  placeholder="Optional name"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Note / Description</label>
                <Input
                  value={editedNote}
                  onChange={(e) => setEditedNote(e.target.value)}
                  placeholder="Optional details"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel Edit
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                Update Draft
              </Button>
            </div>
          </div>
        ) : (
          /* Structured Review Display */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-muted/30 rounded-xl border">
            <div>
              <span className="text-xs text-muted-foreground block">Total Amount</span>
              <span className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
                {draft.currency} {parseFloat(draft.amount || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {draft.transaction_type === "SALE" && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-700 font-medium">Cash Collected:</span>
                  <span className="font-bold">
                    {draft.currency} {parseFloat(draft.amount_collected_at_sale || "0").toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-amber-700 font-medium">Customer Owed (Due):</span>
                  <span className="font-bold">
                    {draft.currency} {derivedCustomerDue || "0.00"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Balanced: Total ({draft.amount}) = Cash ({draft.amount_collected_at_sale}) + Due ({derivedCustomerDue})
                </p>
              </div>
            )}

            <div>
              <span className="text-xs text-muted-foreground block">Transaction Date</span>
              <span className="text-sm font-semibold">{draft.transaction_date || "Today"}</span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground block">Party / Counterparty</span>
              <span className="text-sm font-semibold">{draft.counterparty_name || "General (None specified)"}</span>
            </div>

            {draft.note && (
              <div className="md:col-span-2">
                <span className="text-xs text-muted-foreground block">Note</span>
                <span className="text-sm text-foreground">{draft.note}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t">
        <Button
          onClick={handleConfirmClick}
          disabled={isSaving || isEditing || draft.needs_clarification}
          className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
        >
          <Check className="w-4 h-4 mr-1.5" />
          {isSaving ? "Saving to Ledger..." : "Confirm and Save"}
        </Button>

        {!isEditing && (
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            disabled={isSaving}
            className="w-full sm:w-auto h-11"
          >
            <Edit3 className="w-4 h-4 mr-1.5" />
            Edit Details
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving}
          className="w-full sm:w-auto text-muted-foreground hover:text-destructive h-11"
        >
          <X className="w-4 h-4 mr-1.5" />
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
