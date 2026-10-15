import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkVoiceCapabilities, VoiceDiagnosticResult } from "../../src/lib/voice/diagnostics";

describe("Voice Recording Multi-Layer Diagnostics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("detects insecure HTTP context on mobile/LAN and advises text fallback", () => {
    const result = checkVoiceCapabilities({
      isSecureContext: false,
      hasMediaDevices: false,
      hasGetUserMedia: false,
      supportedMimeTypes: [],
    });

    expect(result.canRecord).toBe(false);
    expect(result.reason).toBe("INSECURE_CONTEXT");
    expect(result.suggestedAction).toBe("USE_TEXT");
    expect(result.message).toContain("secure connection");
  });

  it("detects missing getUserMedia API and offers text fallback", () => {
    const result = checkVoiceCapabilities({
      isSecureContext: true,
      hasMediaDevices: true,
      hasGetUserMedia: false,
      supportedMimeTypes: [],
    });

    expect(result.canRecord).toBe(false);
    expect(result.reason).toBe("API_UNSUPPORTED");
    expect(result.suggestedAction).toBe("USE_TEXT");
    expect(result.message).toContain("not supported");
  });

  it("selects first supported MIME type from preferred list", () => {
    const result = checkVoiceCapabilities({
      isSecureContext: true,
      hasMediaDevices: true,
      hasGetUserMedia: true,
      supportedMimeTypes: ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"],
    });

    expect(result.canRecord).toBe(true);
    expect(result.selectedMimeType).toBe("audio/webm;codecs=opus");
  });

  it("selects audio/mp4 on platforms like Safari that lack webm", () => {
    const result = checkVoiceCapabilities({
      isSecureContext: true,
      hasMediaDevices: true,
      hasGetUserMedia: true,
      supportedMimeTypes: ["audio/mp4", "audio/aac"],
    });

    expect(result.canRecord).toBe(true);
    expect(result.selectedMimeType).toBe("audio/mp4");
  });

  it("detects when no supported recording MIME types are available", () => {
    const result = checkVoiceCapabilities({
      isSecureContext: true,
      hasMediaDevices: true,
      hasGetUserMedia: true,
      supportedMimeTypes: [],
    });

    expect(result.canRecord).toBe(false);
    expect(result.reason).toBe("NO_SUPPORTED_MIME");
    expect(result.suggestedAction).toBe("USE_TEXT");
  });
});
