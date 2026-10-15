"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, PlusCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputContainer } from "@/components/InputContainer";
import { TransactionReviewCard } from "@/components/TransactionReviewCard";
import { ClarificationCard } from "@/components/ClarificationCard";
import { DraftTransaction, Transaction } from "@/types";

export default function NewTransactionPage() {
  const [draft, setDraft] = useState<DraftTransaction | null>(null);
  const [originalInput, setOriginalInput] = useState<string>("");
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmedTransaction, setConfirmedTransaction] = useState<Transaction | null>(null);

  // When AI or manual form returns a structured draft
  const handleExtractionSuccess = (extractedDraft: DraftTransaction, inputSource: string) => {
    setOriginalInput(inputSource);
    setClarificationQuestion(null);
    setSaveError(null);
    setDraft(extractedDraft);
  };

  // When AI requires clarification
  const handleNeedsClarification = (question: string, inputSource: string) => {
    setOriginalInput(inputSource);
    setClarificationQuestion(question);
    setDraft(null);
    setSaveError(null);
  };

  // When user answers clarification
  const handleClarificationSubmit = async (answer: string) => {
    setIsProcessing(true);
    setSaveError(null);

    const combinedInput = `${originalInput}. Note: ${answer}`;
    try {
      const res = await fetch("/api/transactions/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: combinedInput,
          currency: "BDT",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to clarify transaction.");
      }

      if (data.status === "needs_clarification" && data.clarification_question) {
        setClarificationQuestion(data.clarification_question);
      } else if (data.draft) {
        setClarificationQuestion(null);
        setDraft(data.draft);
        setOriginalInput(combinedInput);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Clarification failed.";
      setSaveError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // When user edits draft fields in review card
  const handleDraftEdit = (updatedDraft: DraftTransaction) => {
    setDraft(updatedDraft);
  };

  // When user cancels draft
  const handleCancel = () => {
    setDraft(null);
    setClarificationQuestion(null);
    setSaveError(null);
    setOriginalInput("");
  };

  // When user clicks Confirm and Save
  const handleConfirm = async (confirmedDraft: DraftTransaction, idempotencyKey: string) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/transactions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: confirmedDraft,
          idempotency_key: idempotencyKey,
          business_id: "demo-business-id", // auth guard resolves or falls back securely
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to persist transaction to ledger.");
      }

      setConfirmedTransaction(data.transaction);
      setDraft(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error confirming transaction.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordAnother = () => {
    setConfirmedTransaction(null);
    setDraft(null);
    setClarificationQuestion(null);
    setSaveError(null);
    setOriginalInput("");
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Back */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/transactions"
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Ledger
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Record New Transaction
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Record sales, payments, supplier bills, or shop expenses with instant review.
          </p>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Confirm / Edit / Cancel flow active</span>
        </div>
      </div>

      {/* State 1: Success Banner */}
      {confirmedTransaction && (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 rounded-xl space-y-4">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                Transaction Saved to Ledger Successfully
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                {confirmedTransaction.type.replace("_", " ")} of{" "}
                <span className="font-semibold">
                  {confirmedTransaction.currency}{" "}
                  {parseFloat(confirmedTransaction.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>{" "}
                has been verified and permanently recorded.
              </p>
              {confirmedTransaction.type === "SALE" &&
                confirmedTransaction.amount_collected_at_sale !== null && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Collected: {confirmedTransaction.currency}{" "}
                    {parseFloat(confirmedTransaction.amount_collected_at_sale).toFixed(2)} | Customer
                    Owes: {confirmedTransaction.currency}{" "}
                    {(
                      parseFloat(confirmedTransaction.amount) -
                      parseFloat(confirmedTransaction.amount_collected_at_sale)
                    ).toFixed(2)}
                  </p>
                )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-emerald-200 dark:border-emerald-800">
            <Button
              onClick={handleRecordAnother}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Record Another Entry
            </Button>
            <Link href="/transactions">
              <Button variant="outline" className="w-full sm:w-auto">
                <span>View in Ledger</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* State 2: Clarification Prompt */}
      {!confirmedTransaction && clarificationQuestion && (
        <ClarificationCard
          question={clarificationQuestion}
          originalInput={originalInput}
          onSubmitClarification={handleClarificationSubmit}
          onCancel={handleCancel}
          isLoading={isProcessing}
        />
      )}

      {/* State 3: Draft Review Card */}
      {!confirmedTransaction && draft && !clarificationQuestion && (
        <TransactionReviewCard
          draft={draft}
          onConfirm={handleConfirm}
          onEdit={handleDraftEdit}
          onCancel={handleCancel}
          isSaving={isSaving}
          saveError={saveError}
        />
      )}

      {/* State 4: Input Container (Voice / Text / Manual) */}
      {!confirmedTransaction && !draft && !clarificationQuestion && (
        <InputContainer
          businessCurrency="BDT"
          onExtractionSuccess={handleExtractionSuccess}
          onNeedsClarification={handleNeedsClarification}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />
      )}
    </div>
  );
}
