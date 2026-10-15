"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, AlertCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onTranscriptionComplete: (transcription: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscriptionComplete, disabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Voice recording is not supported in this browser. Please use text entry.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleAudioUpload(audioBlob);
      };

      mediaRecorder.start(250); // Slice data every 250ms
      setIsRecording(true);
      setDurationSeconds(0);

      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => {
          if (prev >= 60) {
            // Auto-stop at 60s
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      console.error("Microphone error:", err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        setErrorMessage("Microphone permission was denied. Please allow microphone access or type your note.");
      } else {
        setErrorMessage("Could not connect to microphone. You can type your transaction below.");
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

      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to transcribe audio.");
      }

      if (data.transcription) {
        onTranscriptionComplete(data.transcription);
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

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-card text-center space-y-4">
      {errorMessage && (
        <div className="w-full p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-300 rounded-md text-xs flex items-center gap-2 text-left">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isRecording ? (
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={stopRecording}
              className="relative rounded-full w-20 h-20 p-0 shadow-lg flex flex-col items-center justify-center"
              aria-label="Stop recording"
            >
              <Square className="w-8 h-8 fill-current" />
            </Button>
          </div>
          <div className="flex items-center space-x-2 text-sm font-semibold text-red-600 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Recording ({formatDuration(durationSeconds)})</span>
          </div>
          <p className="text-xs text-muted-foreground">Tap button to finish and transcribe</p>
        </div>
      ) : isTranscribing ? (
        <div className="flex flex-col items-center space-y-3 py-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Transcribing English audio...</p>
          <p className="text-xs text-muted-foreground">Extracting numbers, parties, and transaction type</p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={startRecording}
            disabled={disabled}
            className="rounded-full w-20 h-20 p-0 shadow-md bg-primary hover:bg-primary/90 flex items-center justify-center"
            aria-label="Start voice recording"
          >
            <Mic className="w-9 h-9 text-primary-foreground" />
          </Button>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Tap to Speak</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Say something like: &ldquo;Sold groceries for 1200 taka, Rahim paid 800 cash&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Clear English speech recommended</span>
          </div>
        </div>
      )}
    </div>
  );
}
