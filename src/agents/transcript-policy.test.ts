import { describe, it, expect } from "vitest";
import { resolveTranscriptPolicy } from "./transcript-policy.js";

describe("resolveTranscriptPolicy", () => {
  describe("native providers", () => {
    it("returns minimal policy for native OpenAI", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "openai-completions",
        provider: "openai",
        modelId: "gpt-4",
      });

      expect(policy.sanitizeMode).toBe("images-only");
      expect(policy.repairToolUseResultPairing).toBe(false);
      expect(policy.validateAnthropicTurns).toBe(false);
      expect(policy.validateGeminiTurns).toBe(false);
      expect(policy.allowSyntheticToolResults).toBe(false);
    });

    it("returns Anthropic policy for native Anthropic provider", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "anthropic-messages",
        provider: "anthropic",
        modelId: "claude-opus-4-5",
      });

      expect(policy.sanitizeMode).toBe("full");
      expect(policy.repairToolUseResultPairing).toBe(true);
      expect(policy.validateAnthropicTurns).toBe(true);
      expect(policy.allowSyntheticToolResults).toBe(true);
    });

    it("returns Google policy for native Google provider", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "google-generative-ai",
        provider: "google",
        modelId: "gemini-2.5-flash",
      });

      expect(policy.sanitizeMode).toBe("full");
      expect(policy.repairToolUseResultPairing).toBe(true);
      expect(policy.validateGeminiTurns).toBe(true);
      expect(policy.applyGoogleTurnOrdering).toBe(true);
      expect(policy.allowSyntheticToolResults).toBe(true);
    });
  });

  describe("proxied Claude models via Wisdom Gate", () => {
    it("applies Anthropic-style handling for Claude models via wisdom-gate", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "openai-completions",
        provider: "wisdom-gate",
        modelId: "claude-opus-4-5",
      });

      // Should get full sanitization and tool result pairing repairs
      expect(policy.sanitizeMode).toBe("full");
      expect(policy.repairToolUseResultPairing).toBe(true);
      expect(policy.allowSyntheticToolResults).toBe(true);
      // But not native Anthropic turn validation (since transport is OpenAI format)
      expect(policy.validateAnthropicTurns).toBe(false);
    });

    it("applies Anthropic-style handling for claude-sonnet models via wisdom-gate", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "openai-completions",
        provider: "wisdom-gate",
        modelId: "claude-sonnet-4-5",
      });

      expect(policy.sanitizeMode).toBe("full");
      expect(policy.repairToolUseResultPairing).toBe(true);
      expect(policy.allowSyntheticToolResults).toBe(true);
    });

    it("applies Anthropic-style handling for haiku models via wisdom-gate", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "openai-completions",
        provider: "wisdom-gate",
        modelId: "claude-haiku-4-5-20251001",
      });

      expect(policy.sanitizeMode).toBe("full");
      expect(policy.repairToolUseResultPairing).toBe(true);
    });
  });

  describe("proxied Gemini models via Wisdom Gate", () => {
    it("applies Google-style handling for Gemini models via wisdom-gate", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "openai-completions",
        provider: "wisdom-gate",
        modelId: "gemini-2.5-flash",
      });

      expect(policy.sanitizeMode).toBe("full");
      expect(policy.repairToolUseResultPairing).toBe(true);
      expect(policy.sanitizeToolCallIds).toBe(true);
      expect(policy.sanitizeThoughtSignatures).toEqual({
        allowBase64Only: true,
        includeCamelCase: true,
      });
      expect(policy.allowSyntheticToolResults).toBe(true);
      // But not native Google turn validation (since transport is OpenAI format)
      expect(policy.validateGeminiTurns).toBe(false);
      expect(policy.applyGoogleTurnOrdering).toBe(false);
    });

    it("applies Google-style handling for gemini-3-pro via wisdom-gate", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "openai-completions",
        provider: "wisdom-gate",
        modelId: "gemini-3-pro",
      });

      expect(policy.sanitizeMode).toBe("full");
      expect(policy.repairToolUseResultPairing).toBe(true);
    });
  });

  describe("non-Claude/Gemini models via Wisdom Gate", () => {
    it("uses minimal handling for GPT models via wisdom-gate", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "openai-completions",
        provider: "wisdom-gate",
        modelId: "gpt-4",
      });

      // GPT models don't need special handling even via proxy
      expect(policy.sanitizeMode).toBe("images-only");
      expect(policy.repairToolUseResultPairing).toBe(false);
      expect(policy.allowSyntheticToolResults).toBe(false);
    });

    it("uses minimal handling for DeepSeek models via wisdom-gate", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "openai-completions",
        provider: "wisdom-gate",
        modelId: "deepseek-chat",
      });

      expect(policy.sanitizeMode).toBe("images-only");
      expect(policy.repairToolUseResultPairing).toBe(false);
    });
  });

  describe("proxied models via OpenRouter", () => {
    it("applies Anthropic-style handling for Claude via openrouter", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "openai-completions",
        provider: "openrouter",
        modelId: "anthropic/claude-opus-4-5",
      });

      expect(policy.sanitizeMode).toBe("full");
      expect(policy.repairToolUseResultPairing).toBe(true);
      expect(policy.allowSyntheticToolResults).toBe(true);
    });

    it("applies Google-style handling for Gemini via openrouter", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "openai-completions",
        provider: "openrouter",
        modelId: "google/gemini-2.5-flash",
      });

      expect(policy.sanitizeMode).toBe("full");
      expect(policy.repairToolUseResultPairing).toBe(true);
    });
  });

  describe("Mistral models", () => {
    it("applies Mistral handling for mistral provider", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "openai-completions",
        provider: "mistral",
        modelId: "codestral-latest",
      });

      expect(policy.sanitizeMode).toBe("full");
      expect(policy.sanitizeToolCallIds).toBe(true);
      expect(policy.toolCallIdMode).toBe("strict9");
    });

    it("detects Mistral models by model ID hint", () => {
      const policy = resolveTranscriptPolicy({
        modelApi: "openai-completions",
        provider: "wisdom-gate",
        modelId: "mistral-7b",
      });

      expect(policy.sanitizeToolCallIds).toBe(true);
      expect(policy.toolCallIdMode).toBe("strict9");
    });
  });
});
