import { LedgerDraftPayload } from "../../types";
import { MockProvider } from "./mock-provider";

export interface BusinessContext {
  currency: string;
  timezone: string;
}

export interface TextExtractionProvider {
  extractDraft(rawInput: string, context: BusinessContext): Promise<LedgerDraftPayload>;
}

export interface SpeechTranscriptionProvider {
  transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<{ transcript: string }>;
}

/**
 * Factory function providing the configured AI extraction provider.
 * Defaults to MockProvider for offline resilience and automated testing.
 */
export function getExtractionProvider(): TextExtractionProvider {
  const providerType = process.env.AI_PROVIDER?.toLowerCase() || "mock";

  switch (providerType) {
    case "mock":
    default:
      return new MockProvider();
  }
}
