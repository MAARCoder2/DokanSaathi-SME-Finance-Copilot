"use client";

import { useState, useEffect } from "react";
import { Mic, MessageSquare, FileText, Send, Loader2, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { ManualTransactionForm } from "@/components/ManualTransactionForm";
import { DraftTransaction, ExtractionResult } from "@/types";

interface InputContainerProps {
  businessCurrency?: string;
  initialTab?: "voice" | "text" | "manual";
  initialText?: string;
  onExtractionSuccess: (draft: DraftTransaction, originalInput: string) => void;
  onNeedsClarification: (question: string, originalInput: string) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export function InputContainer({
  businessCurrency = "BDT",
  initialTab = "text",
  initialText = "",
  onExtractionSuccess,
  onNeedsClarification,
  isProcessing,
  setIsProcessing,
}: InputContainerProps) {
  const [activeTab, setActiveTab] = useState<"voice" | "text" | "manual">(initialTab);
  const [textInput, setTextInput] = useState(initialText);
  const [extractError, setExtractError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialText && initialText.trim()) {
      setTextInput(initialText);
      processTextInput(initialText);
    }
  }, [initialText]);

  const processTextInput = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);
    setExtractError(null);

    try {
      const res = await fetch("/api/transactions/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: text,
          currency: businessCurrency,
        }),
      });

      const data: ExtractionResult & { error?: string } = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse transaction.");
      }

      if (data.status === "needs_clarification" && data.clarification_question) {
        onNeedsClarification(data.clarification_question, text);
      } else if (data.draft) {
        onExtractionSuccess(data.draft, text);
      } else {
        throw new Error("Could not extract financial details. Please try rephrasing or use the manual form.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error extracting transaction.";
      setExtractError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualDraftCreated = (draft: DraftTransaction) => {
    onExtractionSuccess(draft, "Manual Entry Form");
  };

  const handleVoiceTranscription = async (transcription: string) => {
    setTextInput(transcription);
    await processTextInput(transcription);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "voice" | "text" | "manual")}>
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-4">
          <TabsTrigger value="text" className="flex items-center gap-1.5 text-xs md:text-sm">
            <MessageSquare className="w-4 h-4" />
            <span>Text Note</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-1.5 text-xs md:text-sm">
            <Mic className="w-4 h-4" />
            <span>Voice</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-1.5 text-xs md:text-sm">
            <FileText className="w-4 h-4" />
            <span>Manual Form</span>
          </TabsTrigger>
        </TabsList>

        {extractError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 rounded-md text-xs mb-3">
            {extractError}
          </div>
        )}

        <TabsContent value="text" className="space-y-3">
          <div className="p-4 md:p-6 bg-card rounded-xl border space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Type your transaction in everyday English</span>
            </div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g. Sold 2000 BDT groceries, received 1500 cash, customer owes 500&#10;or: Paid 800 electricity bill&#10;or: Received 500 from customer Rahim"
              rows={3}
              disabled={isProcessing}
              className="w-full p-3 border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                AI extracts amount, party, and type. You review and confirm before saving.
              </span>
              <Button
                type="button"
                onClick={() => processTextInput(textInput)}
                disabled={!textInput.trim() || isProcessing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Process Note
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="voice">
          <VoiceRecorder
            onTranscriptionComplete={handleVoiceTranscription}
            disabled={isProcessing}
          />
        </TabsContent>

        <TabsContent value="manual">
          <ManualTransactionForm
            businessCurrency={businessCurrency}
            onDraftCreated={handleManualDraftCreated}
            disabled={isProcessing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
