"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Loader2,
  AlertCircle,
  Volume2,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkVoiceCapabilities, VoiceDiagnosticResult } from "@/lib/voice/diagnostics";

interface VoiceRecorderProps {
  onTranscriptionComplete: (transcription: string) => void;
  onFallbackToText?: () => void;
  disabled?: boolean;
}

export function VoiceRecorder({
  onTranscriptionComplete,
  onFallbackToText,
  disabled = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<VoiceDiagnosticResult | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Run pre-flight capability diagnostic on mount
    const diag = checkVoiceCapabilities();
    setDiagnostic(diag);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    // Verify diagnostic
    const currentDiag = checkVoiceCapabilities();
    setDiagnostic(currentDiag);

    if (!currentDiag.canRecord) {
      setErrorMessage(currentDiag.message);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = currentDiag.selectedMimeType || "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Release hardware microphone tracks immediately
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await handleAudioUpload(audioBlob);
      };

      mediaRecorder.start(250); // Slice chunks every 250ms
      setIsRecording(true);
      setDurationSeconds(0);

      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => {
          if (prev >= 60) {
            // Auto-stop at 60s max per specification
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        setErrorMessage(
          "Microphone permission was denied in this browser. Please grant permission in site settings or type your note."
        );
      } else if (message.includes("NotFoundError") || message.includes("DevicesNotFoundError")) {
        setErrorMessage("No audio input device found. Please connect a microphone or use text entry.");
      } else {
        setErrorMessage("Could not connect to microphone. You can type your transaction note below.");
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      if (demoMode) {
        formData.append("demo_mode", "true");
      }

      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to transcribe audio.");
      }

      // Aligned with API response key: data.transcript
      if (data.transcript && typeof data.transcript === "string") {
        onTranscriptionComplete(data.transcript);
      } else {
        setErrorMessage("No clear speech detected. Please speak louder or type your note.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Voice transcription failed.";
      setErrorMessage(`${message} Please try again or type directly.`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleRunDemoSample = async () => {
    setIsTranscribing(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("demo_mode", "true");

      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.transcript) {
        onTranscriptionComplete(data.transcript);
      }
    } catch (err: unknown) {
      setErrorMessage("Demo sample failed. Please use text entry.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border rounded-2xl bg-card text-center space-y-5 shadow-xs">
      {/* Privacy Notice Banner per Google Gemini Free Tier terms */}
      <div className="w-full p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg text-left flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted-foreground leading-tight">
          <span className="font-semibold text-foreground">Gemini Free-Tier Notice: </span>
          Use synthetic test transactions only. Do not speak real confidential business records, NID
          numbers, or personal banking details.
        </div>
      </div>

      {/* Diagnostic & Insecure Context Warning */}
      {diagnostic && !diagnostic.canRecord && (
        <div className="w-full p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-left space-y-2">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold block">
                {diagnostic.reason === "INSECURE_CONTEXT"
                  ? "Secure Connection Required for Microphone"
                  : "Audio Recording Unavailable"}
              </span>
              <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                {diagnostic.message}
              </p>
            </div>
          </div>
          {onFallbackToText && (
            <div className="pt-1 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onFallbackToText}
                className="h-8 text-xs border-amber-400 bg-amber-100/60 hover:bg-amber-200 text-amber-900"
              >
                <span>Type Text Note Instead</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="w-full p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {onFallbackToText && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onFallbackToText}
              className="text-xs text-red-700 underline h-auto p-0 ml-2"
            >
              Type note
            </Button>
          )}
        </div>
      )}

      {/* State: Recording Active (Matches Screen 3) */}
      {isRecording ? (
        <div className="flex flex-col items-center space-y-4 py-2 w-full max-w-sm">
          <h3 className="font-bold text-lg text-foreground">Record Your Transaction</h3>

          {/* Animated Pulsing Mic Circle */}
          <div className="relative flex items-center justify-center my-2">
            <span className="animate-ping absolute inline-flex h-28 w-28 rounded-full bg-blue-400 opacity-30"></span>
            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center shadow-inner">
              <Mic className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-semibold text-foreground block">Listening...</span>
            <span className="text-2xl font-mono font-bold text-foreground tracking-widest block">
              {formatDuration(durationSeconds)}
            </span>
          </div>

          {/* Audio Waveform Visualization Simulation */}
          <div className="flex items-center justify-center gap-1.5 h-8 w-40">
            <span className="w-1.5 bg-primary rounded-full animate-bounce h-4"></span>
            <span className="w-1.5 bg-primary rounded-full animate-bounce h-7 delay-75"></span>
            <span className="w-1.5 bg-primary rounded-full animate-bounce h-5 delay-150"></span>
            <span className="w-1.5 bg-primary rounded-full animate-bounce h-8 delay-100"></span>
            <span className="w-1.5 bg-primary rounded-full animate-bounce h-6 delay-200"></span>
            <span className="w-1.5 bg-primary rounded-full animate-bounce h-4 delay-75"></span>
          </div>

          {/* Stop Button */}
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={stopRecording}
            className="w-full max-w-xs h-12 rounded-xl text-sm font-bold shadow-md bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
            aria-label="Stop recording"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop Recording</span>
          </Button>
        </div>
      ) : isTranscribing ? (
        /* State: Transcribing (Gemini 3.5 Transcribe) */
        <div className="flex flex-col items-center space-y-3 py-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">Transcribing Speech...</p>
            <p className="text-xs text-muted-foreground">
              Powered by Google Gemini 3.5 Transcribe
            </p>
          </div>
        </div>
      ) : (
        /* State: Idle / Ready to Record (Matches Screen 3) */
        <div className="flex flex-col items-center space-y-5 w-full">
          <div className="relative">
            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={startRecording}
              disabled={disabled || Boolean(diagnostic && !diagnostic.canRecord)}
              className="rounded-full w-24 h-24 p-0 shadow-lg bg-primary hover:bg-primary/90 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              aria-label="Start voice recording"
            >
              <Mic className="w-10 h-10 text-white" />
            </Button>
          </div>

          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">Tap Microphone to Speak</p>
            <p className="text-xs text-muted-foreground">
              Speak naturally in English. We will extract the financial details.
            </p>
          </div>

          {/* English Prompt Suggestions from Reference Mockup */}
          <div className="w-full max-w-sm p-3.5 bg-muted/40 rounded-xl border text-left space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">
              Say something like:
            </span>
            <div className="space-y-1.5 text-xs text-foreground/85 font-medium">
              <div className="p-1.5 rounded bg-background border text-[11px] text-muted-foreground">
                &ldquo;Sold groceries for 1200 taka, Rahim paid 800 cash&rdquo;
              </div>
              <div className="p-1.5 rounded bg-background border text-[11px] text-muted-foreground">
                &ldquo;Paid 3000 to Meghna for goods&rdquo;
              </div>
              <div className="p-1.5 rounded bg-background border text-[11px] text-muted-foreground">
                &ldquo;Paid 450 for electricity bill&rdquo;
              </div>
            </div>
          </div>

          {/* Quick Demo Sample Action for Judges */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRunDemoSample}
              disabled={disabled}
              className="text-xs text-muted-foreground hover:text-foreground h-8"
              title="Test with synthetic judge demo sample without recording"
            >
              <Play className="w-3.5 h-3.5 mr-1 text-primary" />
              <span>Try Synthetic Demo Sample</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
