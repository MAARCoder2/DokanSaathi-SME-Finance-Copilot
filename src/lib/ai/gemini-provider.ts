import {
  TextExtractionProvider,
  SpeechTranscriptionProvider,
  BusinessContext,
} from "./adapter";
import { LedgerDraftPayload, DraftTransaction } from "../../types";

export interface GeminiProviderOptions {
  apiKey?: string;
  extractionModel?: string; // default: "gemini-3.5-flash-lite"
  transcriptionModel?: string; // default: "gemini-3.5-transcribe"
}

export class GeminiProvider implements TextExtractionProvider, SpeechTranscriptionProvider {
  private apiKey: string;
  private extractionModel: string;
  private transcriptionModel: string;

  constructor(options?: GeminiProviderOptions) {
    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY || "";
    this.extractionModel =
      options?.extractionModel || process.env.GEMINI_EXTRACTION_MODEL || "gemini-3.5-flash-lite";
    this.transcriptionModel =
      options?.transcriptionModel || process.env.GEMINI_TRANSCRIPTION_MODEL || "gemini-3.5-transcribe";
  }

  /**
   * Structured extraction from English text note using gemini-3.5-flash-lite with JSON output mode.
   */
  async extractDraft(rawInput: string, context: BusinessContext): Promise<LedgerDraftPayload> {
    if (!this.apiKey) {
      throw new Error(
        "GEMINI_KEY_NOT_CONFIGURED: Google Gemini API key is missing. Set GEMINI_API_KEY in .env.local."
      );
    }

    const systemInstruction = `You are DokanSaathi's financial transaction extraction engine for small businesses in Bangladesh.
All UI text, counterparty notes, and explanations must be in English.
Available business context:
- Shop Default Currency: ${context.currency}
- Business Timezone: ${context.timezone}

Transaction Types allowed: SALE, CUSTOMER_PAYMENT, SUPPLIER_BILL, SUPPLIER_PAYMENT, EXPENSE.
Rules:
1. Under SALE: if customer paid partially upfront, extract both "amount" (total sale) and "amount_collected_at_sale" (cash received).
2. If ambiguous whether payment was an expense or supplier payment, set needs_clarification=true and ask a clear question in clarification_reason.
3. Never invent missing figures or dates. If date is not specified, use today's date in business timezone.
4. Return pure JSON matching the requested schema.`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemInstruction}\n\nUser Input to extract:\n"${rawInput}"`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.extractionModel}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 429) {
        throw new Error(
          "AI_QUOTA_EXHAUSTED: Google Gemini Free Tier rate limit reached. Please type your note or enter manually."
        );
      }
      throw new Error(
        errData.error?.message || `Gemini extraction failed with HTTP status ${res.status}`
      );
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsed = JSON.parse(rawText);

    // Validate and normalize draft payload
    const draftTransactions: DraftTransaction[] = (parsed.draft_transactions || []).map(
      (d: any, idx: number) => ({
        draft_id: d.draft_id || `gemini-${Date.now()}-${idx}`,
        transaction_type: d.transaction_type || "SALE",
        transaction_date: d.transaction_date || new Date().toISOString().split("T")[0],
        currency: d.currency || context.currency,
        currency_mentioned_by_user: d.currency_mentioned_by_user || null,
        amount: d.amount ? String(d.amount) : "0.00",
        amount_collected_at_sale: d.amount_collected_at_sale
          ? String(d.amount_collected_at_sale)
          : null,
        counterparty_name: d.counterparty_name || null,
        related_transaction_id: d.related_transaction_id || null,
        due_date: d.due_date || null,
        category: d.category || null,
        note: d.note || null,
        needs_clarification: Boolean(d.needs_clarification || parsed.needs_clarification),
        clarification_reason: d.clarification_reason || parsed.clarification_question || null,
      })
    );

    return {
      schema_version: "1.0",
      input_language: "en",
      source: "text",
      raw_input: rawInput,
      draft_transactions: draftTransactions,
      needs_clarification: Boolean(parsed.needs_clarification),
      clarification_question: parsed.clarification_question || null,
    };
  }

  /**
   * Audio transcription using Google Files API and gemini-3.5-transcribe.
   */
  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<{ transcript: string }> {
    if (!this.apiKey) {
      throw new Error(
        "GEMINI_KEY_NOT_CONFIGURED: Google Gemini API key is missing. Set GEMINI_API_KEY in .env.local."
      );
    }

    // 1. Upload audio buffer to Google AI Files API (ephemeral)
    const uploadRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "X-Goog-Upload-Command": "start, upload, finalize",
          "X-Goog-Upload-Header-Content-Length": audioBuffer.length.toString(),
          "X-Goog-Upload-Header-Content-Type": mimeType,
          "Content-Type": mimeType,
        },
        body: new Uint8Array(audioBuffer),
      }
    );

    if (!uploadRes.ok) {
      const errJson = await uploadRes.json().catch(() => ({}));
      if (uploadRes.status === 429) {
        throw new Error(
          "AI_QUOTA_EXHAUSTED: Google Gemini Free Tier quota exceeded during audio upload."
        );
      }
      throw new Error(errJson.error?.message || `Files API upload failed (${uploadRes.status})`);
    }

    const uploadData = await uploadRes.json();
    const fileUri = uploadData.file?.uri;

    // 2. Transcribe using gemini-3.5-transcribe
    try {
      const transcribeRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.transcriptionModel}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { fileData: { mimeType, fileUri } },
                  {
                    text: "You are an accurate English speech-to-text transcriber for a local shop accounting system. Transcribe the spoken audio verbatim in plain English. Do not add commentary.",
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!transcribeRes.ok) {
        const transcribeErr = await transcribeRes.json().catch(() => ({}));
        if (transcribeRes.status === 429) {
          throw new Error(
            "AI_QUOTA_EXHAUSTED: Gemini transcription quota exceeded. Please type your note."
          );
        }
        throw new Error(
          transcribeErr.error?.message || `Transcription failed (${transcribeRes.status})`
        );
      }

      const transcribeJson = await transcribeRes.json();
      const transcript =
        transcribeJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      return { transcript };
    } finally {
      // 3. Immediately delete ephemeral audio from Files API
      if (uploadData.file?.name) {
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/${uploadData.file.name}?key=${this.apiKey}`,
          { method: "DELETE" }
        ).catch(() => {});
      }
    }
  }
}
