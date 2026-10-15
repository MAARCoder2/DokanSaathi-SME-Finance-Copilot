"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { Mic, FileEdit, MessageSquare, AlertTriangle } from "lucide-react";

interface VoiceCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTranscriptionSuccess?: (transcript: string) => void;
}

export function VoiceCaptureDialog({
  open,
  onOpenChange,
  onTranscriptionSuccess,
}: VoiceCaptureDialogProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTranscriptionComplete = (transcript: string) => {
    if (onTranscriptionSuccess) {
      onTranscriptionSuccess(transcript);
    } else {
      router.push(`/transactions/new?voiceText=${encodeURIComponent(transcript)}`);
    }
    onOpenChange(false);
  };

  const handleGoToText = () => {
    onOpenChange(false);
    router.push("/transactions/new?tab=text");
  };

  const handleGoToManual = () => {
    onOpenChange(false);
    router.push("/transactions/new?tab=manual");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] p-5 sm:p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left pb-2">
          <div className="flex items-center space-x-2 text-emerald-600 mb-1">
            <Mic className="w-5 h-5" />
            <DialogTitle className="text-lg font-bold">Voice Transaction Note</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Speak your transaction in English (e.g. &ldquo;Sold rice for 2000 BDT, customer paid 1500 cash, Rahim owes 500&rdquo;).
          </DialogDescription>
        </DialogHeader>

        {/* Free Tier Privacy Warning Notice */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
            <span className="font-semibold">Demo & Development Notice:</span> Audio is processed using Google Gemini Free Tier. Google terms permit human review of free-tier inputs for product training. Use synthetic test entries only.
          </div>
        </div>

        {/* Voice Recorder Component */}
        <div className="py-2">
          <VoiceRecorder
            onTranscriptionComplete={handleTranscriptionComplete}
            disabled={isProcessing}
          />
        </div>

        {/* Instant Fallbacks */}
        <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">Having trouble with audio?</span>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGoToText}
              className="flex-1 sm:flex-none text-xs h-8"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              Type Note
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGoToManual}
              className="flex-1 sm:flex-none text-xs h-8"
            >
              <FileEdit className="w-3.5 h-3.5 mr-1" />
              Manual Form
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
