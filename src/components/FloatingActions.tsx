"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Mic, Plus, FileEdit } from "lucide-react";
import { VoiceCaptureDialog } from "@/components/VoiceCaptureDialog";

export function FloatingActions() {
  const pathname = usePathname();
  const router = useRouter();
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Auto-hide when focused on text fields (mobile keyboard active)
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.getAttribute("contenteditable") === "true")
      ) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // Do not render floating action buttons on /transactions/new (prevents layout obstruction)
  if (pathname === "/transactions/new" || isKeyboardOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-40 flex flex-col items-end gap-2.5 sm:gap-3 pointer-events-auto select-none print:hidden"
        aria-label="Quick action shortcuts"
      >
        {/* Manual Entry Secondary FAB */}
        <button
          type="button"
          onClick={() => router.push("/transactions/new?tab=manual")}
          className="group flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white rounded-full py-2 px-3.5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-slate-700/50"
          title="Manual Transaction Entry"
          aria-label="Record transaction manually"
        >
          <FileEdit className="w-4 h-4 text-slate-200" />
          <span className="text-xs font-semibold tracking-wide pr-0.5">Manual</span>
        </button>

        {/* Voice Note Primary FAB */}
        <button
          type="button"
          onClick={() => setVoiceDialogOpen(true)}
          className="group flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full py-3 px-4 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all ring-4 ring-emerald-500/20"
          title="Speak Transaction Note"
          aria-label="Speak transaction note"
        >
          <div className="relative">
            <Mic className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="text-sm font-bold tracking-tight pr-1">Speak Note</span>
        </button>
      </div>

      <VoiceCaptureDialog
        open={voiceDialogOpen}
        onOpenChange={setVoiceDialogOpen}
      />
    </>
  );
}
