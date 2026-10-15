import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/voice/transcribe
 * Transcribes audio recording into English text.
 * Strictly ephemeral: never stores raw audio or transcripts to disk/database.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "NO_AUDIO_PROVIDED", message: "Audio recording was not received." },
        { status: 400 }
      );
    }

    const speechProvider = process.env.SPEECH_PROVIDER || "mock";

    if (speechProvider === "mock") {
      // Deterministic demo transcription fallback
      return NextResponse.json({
        transcript: "I sold goods for 2000 today. The customer paid 1500 and still owes 500.",
        provider: "mock",
      });
    }

    // If external speech provider configured (e.g. Whisper API)
    // Server-side integration point
    return NextResponse.json({
      transcript: "Recorded speech transcription in progress",
      provider: speechProvider,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "TRANSCRIPTION_FAILED",
        message: "We couldn't transcribe that recording. Try again or enter the details by text.",
      },
      { status: 500 }
    );
  }
}
