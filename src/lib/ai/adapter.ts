import { LedgerDraftPayload } from "../../types";
import { MockProvider } from "./mock-provider";
import { GeminiProvider } from "./gemini-provider";

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
 * Uses GeminiProvider if AI_PROVIDER is "gemini" or GEMINI_API_KEY is present,
 * otherwise defaults to MockProvider for offline resilience and automated testing.
 */
export function getExtractionProvider(): TextExtractionProvider {
  const providerType = process.env.AI_PROVIDER?.toLowerCase();

  if (providerType === "gemini" || (!providerType && process.env.GEMINI_API_KEY)) {
    return new GeminiProvider();
  }

  return new MockProvider();
}

/**
 * Factory function providing the configured speech transcription provider.
 */
export function getTranscriptionProvider(): SpeechTranscriptionProvider {
  const providerType = process.env.SPEECH_PROVIDER?.toLowerCase();

  if (providerType === "gemini" || (!providerType && process.env.GEMINI_API_KEY)) {
    return new GeminiProvider();
  }

  return new GeminiProvider();
}

