import { isAntigravityClaude, isGoogleModelApi } from "./pi-embedded-helpers/google.js";
import { normalizeProviderId } from "./model-selection.js";
import type { ToolCallIdMode } from "./tool-call-id.js";

export type TranscriptSanitizeMode = "full" | "images-only";

export type TranscriptPolicy = {
  sanitizeMode: TranscriptSanitizeMode;
  sanitizeToolCallIds: boolean;
  toolCallIdMode?: ToolCallIdMode;
  repairToolUseResultPairing: boolean;
  preserveSignatures: boolean;
  sanitizeThoughtSignatures?: {
    allowBase64Only?: boolean;
    includeCamelCase?: boolean;
  };
  normalizeAntigravityThinkingBlocks: boolean;
  applyGoogleTurnOrdering: boolean;
  validateGeminiTurns: boolean;
  validateAnthropicTurns: boolean;
  allowSyntheticToolResults: boolean;
};

const MISTRAL_MODEL_HINTS = [
  "mistral",
  "mixtral",
  "codestral",
  "pixtral",
  "devstral",
  "ministral",
  "mistralai",
];

// Hints to detect Claude models even when accessed via OpenAI-compatible APIs (e.g., Wisdom Gate, OpenRouter).
const CLAUDE_MODEL_HINTS = ["claude", "anthropic", "opus", "sonnet", "haiku"];

// Hints to detect Gemini models even when accessed via OpenAI-compatible APIs.
const GEMINI_MODEL_HINTS = ["gemini"];

const OPENAI_MODEL_APIS = new Set([
  "openai",
  "openai-completions",
  "openai-responses",
  "openai-codex-responses",
]);
const OPENAI_PROVIDERS = new Set(["openai", "openai-codex"]);

// Providers that proxy multiple model families and should use model-based policy detection.
// Note: Use provider prefix matching for variants like "wisdom-gate-claude"
const PROXY_PROVIDER_PREFIXES = ["wisdom-gate", "openrouter", "opencode", "lmstudio", "ollama"];

function isOpenAiApi(modelApi?: string | null): boolean {
  if (!modelApi) return false;
  return OPENAI_MODEL_APIS.has(modelApi);
}

function isOpenAiProvider(provider?: string | null): boolean {
  if (!provider) return false;
  return OPENAI_PROVIDERS.has(normalizeProviderId(provider));
}

function isProxyProvider(provider?: string | null): boolean {
  if (!provider) return false;
  const normalized = normalizeProviderId(provider);
  // Use prefix matching to handle variants like "wisdom-gate-claude"
  return PROXY_PROVIDER_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function isAnthropicApi(modelApi?: string | null, provider?: string | null): boolean {
  if (modelApi === "anthropic-messages") return true;
  const normalized = normalizeProviderId(provider ?? "");
  // MiniMax now uses openai-completions API, not anthropic-messages
  return normalized === "anthropic";
}

function isMistralModel(params: { provider?: string | null; modelId?: string | null }): boolean {
  const provider = normalizeProviderId(params.provider ?? "");
  if (provider === "mistral") return true;
  const modelId = (params.modelId ?? "").toLowerCase();
  if (!modelId) return false;
  return MISTRAL_MODEL_HINTS.some((hint) => modelId.includes(hint));
}

/**
 * Detect Claude models accessed via proxy providers (Wisdom Gate, OpenRouter, etc.).
 * These models need Anthropic-style transcript handling even when using OpenAI-compatible APIs.
 */
function isProxiedClaudeModel(params: {
  provider?: string | null;
  modelId?: string | null;
}): boolean {
  if (!isProxyProvider(params.provider)) return false;
  const modelId = (params.modelId ?? "").toLowerCase();
  if (!modelId) return false;
  return CLAUDE_MODEL_HINTS.some((hint) => modelId.includes(hint));
}

/**
 * Detect Gemini models accessed via proxy providers (Wisdom Gate, OpenRouter, etc.).
 * These models may need Google-style transcript handling even when using OpenAI-compatible APIs.
 */
function isProxiedGeminiModel(params: {
  provider?: string | null;
  modelId?: string | null;
}): boolean {
  if (!isProxyProvider(params.provider)) return false;
  const modelId = (params.modelId ?? "").toLowerCase();
  if (!modelId) return false;
  return GEMINI_MODEL_HINTS.some((hint) => modelId.includes(hint));
}

export function resolveTranscriptPolicy(params: {
  modelApi?: string | null;
  provider?: string | null;
  modelId?: string | null;
}): TranscriptPolicy {
  const provider = normalizeProviderId(params.provider ?? "");
  const modelId = params.modelId ?? "";
  const isGoogle = isGoogleModelApi(params.modelApi);
  const isAnthropic = isAnthropicApi(params.modelApi, provider);
  const isOpenAi = isOpenAiProvider(provider) || (!provider && isOpenAiApi(params.modelApi));
  const isMistral = isMistralModel({ provider, modelId });

  // Detect proxied models (Claude/Gemini via Wisdom Gate, OpenRouter, etc.) even when using OpenAI-compatible API.
  // These underlying models may need model-specific handling despite the OpenAI-compatible transport.
  const isProxiedClaude = isProxiedClaudeModel({ provider, modelId });
  const isProxiedGemini = isProxiedGeminiModel({ provider, modelId });

  const isOpenRouterGemini =
    (provider === "openrouter" || provider === "opencode") &&
    modelId.toLowerCase().includes("gemini");
  const isAntigravityClaudeModel = isAntigravityClaude({
    api: params.modelApi,
    provider,
    modelId,
  });

  // For proxied models, apply appropriate underlying model handling.
  // Note: Claude/Gemini via OpenAI-compatible APIs still use OpenAI tool call format at transport level,
  // but may need transcript repairs and turn validation for session history management.
  const effectiveAnthropic = isAnthropic || isProxiedClaude;
  const effectiveGoogle = isGoogle || isProxiedGemini;

  const needsNonImageSanitize =
    effectiveGoogle || effectiveAnthropic || isMistral || isOpenRouterGemini;

  const sanitizeToolCallIds = effectiveGoogle || isMistral;
  const toolCallIdMode: ToolCallIdMode | undefined = isMistral
    ? "strict9"
    : sanitizeToolCallIds
      ? "strict"
      : undefined;

  // Tool use/result pairing repairs for Claude and Gemini models.
  // This ensures tool results are properly paired with tool calls in the session history.
  const repairToolUseResultPairing = effectiveGoogle || effectiveAnthropic;

  const sanitizeThoughtSignatures =
    isOpenRouterGemini || isProxiedGemini
      ? { allowBase64Only: true, includeCamelCase: true }
      : undefined;
  const normalizeAntigravityThinkingBlocks = isAntigravityClaudeModel;

  // For proxied models via OpenAI-compatible APIs, we still need some of the model-specific handling.
  // The key insight is that while transport uses OpenAI format, the underlying model may have quirks
  // that require transcript sanitization.
  const isNativeOpenAi = isOpenAi && !isProxiedClaude && !isProxiedGemini;

  return {
    sanitizeMode: isNativeOpenAi ? "images-only" : needsNonImageSanitize ? "full" : "images-only",
    sanitizeToolCallIds: !isNativeOpenAi && sanitizeToolCallIds,
    toolCallIdMode,
    repairToolUseResultPairing: !isNativeOpenAi && repairToolUseResultPairing,
    preserveSignatures: isAntigravityClaudeModel,
    sanitizeThoughtSignatures: isNativeOpenAi ? undefined : sanitizeThoughtSignatures,
    normalizeAntigravityThinkingBlocks,
    // Turn ordering/validation: only apply for native Google/Anthropic APIs, not proxied models.
    // Proxied models use OpenAI transport format which handles turn ordering differently.
    applyGoogleTurnOrdering: !isOpenAi && isGoogle,
    validateGeminiTurns: !isOpenAi && isGoogle,
    validateAnthropicTurns: !isOpenAi && isAnthropic,
    allowSyntheticToolResults: !isNativeOpenAi && (effectiveGoogle || effectiveAnthropic),
  };
}
