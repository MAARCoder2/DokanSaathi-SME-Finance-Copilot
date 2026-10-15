"use client";

import { useState } from "react";
import { HelpCircle, Send, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClarificationCardProps {
  question: string;
  originalInput?: string;
  onSubmitClarification: (clarificationText: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function ClarificationCard({
  question,
  originalInput,
  onSubmitClarification,
  onCancel,
  isLoading,
}: ClarificationCardProps) {
  const [response, setResponse] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim() || isLoading) return;
    await onSubmitClarification(response.trim());
  };

  return (
    <Card className="border-2 border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-400">
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs uppercase font-bold tracking-wider">Clarification Needed</span>
        </div>
        <CardTitle className="text-base md:text-lg font-bold text-foreground pt-1">
          {question}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs md:text-sm">
          To ensure accurate bookkeeping, please clarify the missing detail before saving.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {originalInput && (
          <div className="text-xs p-2.5 rounded bg-background/80 border text-muted-foreground">
            <span className="font-semibold text-foreground">Your original note:</span> &ldquo;{originalInput}&rdquo;
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your clarification (e.g., 'Received from customer Rahim' or 'Shop electricity bill')"
            disabled={isLoading}
            className="flex-1 bg-background"
            autoFocus
          />
          <Button
            type="submit"
            disabled={!response.trim() || isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
          >
            <Send className="w-4 h-4 mr-1.5" />
            {isLoading ? "Updating..." : "Answer"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="pt-1 pb-3 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Cancel and start over
        </Button>
      </CardFooter>
    </Card>
  );
}
