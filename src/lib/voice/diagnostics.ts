export interface VoiceCapabilityEnvironment {
  isSecureContext?: boolean;
  hasMediaDevices?: boolean;
  hasGetUserMedia?: boolean;
  supportedMimeTypes?: string[];
}

export interface VoiceDiagnosticResult {
  canRecord: boolean;
  reason?: "INSECURE_CONTEXT" | "API_UNSUPPORTED" | "NO_MICROPHONE" | "PERMISSION_DENIED" | "NO_SUPPORTED_MIME" | "UNKNOWN";
  message: string;
  suggestedAction: "RECORD" | "USE_TEXT" | "ENABLE_HTTPS" | "GRANT_PERMISSION";
  selectedMimeType?: string;
}

export const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/ogg;codecs=opus",
];

/**
 * Pure evaluation of browser audio recording capabilities.
 * Distinguishes insecure context, missing APIs, and platform codecs.
 */
export function checkVoiceCapabilities(env?: VoiceCapabilityEnvironment): VoiceDiagnosticResult {
  // If env passed explicitly (e.g. for unit tests), use it; otherwise inspect global window/navigator
  const isSecure =
    env?.isSecureContext !== undefined
      ? env.isSecureContext
      : typeof window !== "undefined"
      ? Boolean(window.isSecureContext)
      : false;

  const hasMediaDevices =
    env?.hasMediaDevices !== undefined
      ? env.hasMediaDevices
      : typeof navigator !== "undefined" && Boolean(navigator.mediaDevices);

  const hasGetUserMedia =
    env?.hasGetUserMedia !== undefined
      ? env.hasGetUserMedia
      : typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  // 1. Insecure Context check (HTTP over LAN IP or public domain without SSL)
  if (!isSecure) {
    return {
      canRecord: false,
      reason: "INSECURE_CONTEXT",
      message:
        "Microphone access requires a secure connection (HTTPS or localhost). Please enter your transaction by typing a text note or using the manual form.",
      suggestedAction: "USE_TEXT",
    };
  }

  // 2. Browser MediaDevices & getUserMedia support check
  if (!hasMediaDevices || !hasGetUserMedia) {
    return {
      canRecord: false,
      reason: "API_UNSUPPORTED",
      message:
        "Audio recording is not supported in this browser. Please type your transaction note or enter details manually.",
      suggestedAction: "USE_TEXT",
    };
  }

  // 3. Supported MIME types check
  let supportedMimeTypes: string[] = [];
  if (env?.supportedMimeTypes !== undefined) {
    supportedMimeTypes = env.supportedMimeTypes;
  } else if (typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function") {
    supportedMimeTypes = PREFERRED_MIME_TYPES.filter((type) => MediaRecorder.isTypeSupported(type));
  }

  if (supportedMimeTypes.length === 0) {
    return {
      canRecord: false,
      reason: "NO_SUPPORTED_MIME",
      message:
        "This browser does not support compatible audio recording codecs. Please use text entry.",
      suggestedAction: "USE_TEXT",
    };
  }

  return {
    canRecord: true,
    message: "Microphone recording is available.",
    suggestedAction: "RECORD",
    selectedMimeType: supportedMimeTypes[0],
  };
}
