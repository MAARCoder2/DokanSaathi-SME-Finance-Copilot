import { NextRequest, NextResponse } from "next/server";
import { verifyBusinessOwnership } from "@/lib/auth/guard";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * POST /api/voice/transcribe
 * Transcribes audio recording into English text.
 * Strictly ephemeral: never stores raw audio or transcripts to disk/database.
 *
 * Implements 3 distinct states:
 * 1. LIVE_GEMINI_FREE_TIER: Real speech sent to Gemini (gemini-3.5-transcribe via Files API).
 * 2. MOCK_DEMO: Explicitly requested demo sample (returns labeled synthetic text).
 * 3. PROVIDER_ERROR: Reports quota/key/network failure accurately with manual text fallback.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyBusinessOwnership();
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.code, message: authResult.message },
        { status: authResult.status }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const isExplicitDemo = formData.get("demo_mode") === "true";

    // State 2: Explicitly requested Mock Demo Mode
    if (isExplicitDemo || process.env.SPEECH_PROVIDER === "mock") {
      return NextResponse.json({
        transcript: "Sold groceries for 2000 taka, Rahim paid 1500 cash, customer owes 500.",
        provider: "mock",
        mode: "demo",
        sample_label: "Synthetic Demo Sample",
      });
    }

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json(
        {
          error: "NO_AUDIO_PROVIDED",
          message: "No audio data was received. Please record again or type your note.",
        },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        {
          error: "AUDIO_TOO_LARGE",
          message: "Recording exceeds 10MB limit. Please keep audio under 60 seconds.",
        },
        { status: 413 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    // State 3: Provider Error (Missing credentials)
    if (!geminiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_KEY_NOT_CONFIGURED",
          message:
            "Google Gemini API key is not configured in .env.local. Please type your note or enable demo mode.",
          suggestedAction: "USE_TEXT",
        },
        { status: 503 }
      );
    }

    // State 1: Live Gemini Free Tier (Files API + gemini-3.5-transcribe)
    try {
      const buffer = Buffer.from(await audioFile.arrayBuffer());
      const mimeType = audioFile.type || "audio/webm";

      // 1. Upload audio buffer to Google AI Files API (ephemeral)
      const uploadRes = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "X-Goog-Upload-Command": "start, upload, finalize",
            "X-Goog-Upload-Header-Content-Length": buffer.length.toString(),
            "X-Goog-Upload-Header-Content-Type": mimeType,
            "Content-Type": mimeType,
          },
          body: buffer,
        }
      );

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        if (uploadRes.status === 429) {
          return NextResponse.json(
            {
              error: "AI_QUOTA_EXHAUSTED",
              message:
                "Google Gemini Free Tier quota limit reached (429). Please enter details by typing a note or using manual form.",
              suggestedAction: "USE_TEXT",
            },
            { status: 429 }
          );
        }
        throw new Error(errJson.error?.message || `Files API upload failed (${uploadRes.status})`);
      }

      const uploadData = await uploadRes.json();
      const fileUri = uploadData.file?.uri;

      // 2. Call gemini-3.5-transcribe with uploaded file URI
      const transcribeRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    fileData: {
                      mimeType,
                      fileUri,
                    },
                  },
                  {
                    text: "You are an accurate English speech-to-text transcriber for a shop accounting system. Transcribe the spoken audio verbatim in plain English. Do not add commentary or financial summaries.",
                  },
                ],
              },
            ],
          }),
        }
      );

      // Clean up uploaded file from Files API (fire and forget)
      if (uploadData.file?.name) {
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/${uploadData.file.name}?key=${geminiKey}`,
          { method: "DELETE" }
        ).catch(() => {});
      }

      if (!transcribeRes.ok) {
        const transcribeErr = await transcribeRes.json().catch(() => ({}));
        if (transcribeRes.status === 429) {
          return NextResponse.json(
            {
              error: "AI_QUOTA_EXHAUSTED",
              message:
                "Gemini transcription quota limit reached (429). Please type your transaction note.",
              suggestedAction: "USE_TEXT",
            },
            { status: 429 }
          );
        }
        throw new Error(
          transcribeErr.error?.message || `Transcription failed (${transcribeRes.status})`
        );
      }

      const transcribeJson = await transcribeRes.json();
      const rawTranscript =
        transcribeJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      if (!rawTranscript) {
        return NextResponse.json(
          {
            error: "NO_CLEAR_SPEECH",
            message: "No clear English speech detected in the audio. Please speak clearly or type your note.",
            suggestedAction: "USE_TEXT",
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        transcript: rawTranscript,
        provider: "gemini",
        mode: "live",
      });
    } catch (providerErr: unknown) {
      const message =
        providerErr instanceof Error ? providerErr.message : "Live Gemini transcription error.";
      return NextResponse.json(
        {
          error: "TRANSCRIPTION_FAILED",
          message: `${message}. Please try again or type your note directly.`,
          suggestedAction: "USE_TEXT",
        },
        { status: 502 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal transcription error.";
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: `${message}. Please enter details manually.`,
      },
      { status: 500 }
    );
  }
}
