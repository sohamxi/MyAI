import { join } from "node:path";

import type { Api, Model } from "@mariozechner/pi-ai";
import { AuthStorage, ModelRegistry } from "@mariozechner/pi-coding-agent";

import { resolveOpenClawAgentDir } from "../../agents/agent-paths.js";
import type { AuthProfileStore } from "../../agents/auth-profiles.js";
import { listProfilesForProvider } from "../../agents/auth-profiles.js";
import {
  getCustomProviderApiKey,
  resolveAwsSdkEnvVarName,
  resolveEnvApiKey,
} from "../../agents/model-auth.js";
import { ensureOpenClawModelsJson } from "../../agents/models-config.js";
import type { OpenClawConfig } from "../../config/config.js";
import type { ModelRow } from "./list.types.js";
import { modelKey } from "./shared.js";

const isLocalBaseUrl = (baseUrl: string) => {
  try {
    const url = new URL(baseUrl);
    const host = url.hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".local")
    );
  } catch {
    return false;
  }
};

const hasAuthForProvider = (provider: string, cfg: OpenClawConfig, authStore: AuthProfileStore) => {
  if (listProfilesForProvider(authStore, provider).length > 0) return true;
  if (provider === "amazon-bedrock" && resolveAwsSdkEnvVarName()) return true;
  if (resolveEnvApiKey(provider)) return true;
  if (getCustomProviderApiKey(cfg, provider)) return true;
  return false;
};

export async function loadModelRegistry(cfg: OpenClawConfig) {
  await ensureOpenClawModelsJson(cfg);
  const agentDir = resolveOpenClawAgentDir();
  const authStorage = new AuthStorage(join(agentDir, "auth.json"));
  const modelsJsonPath = join(agentDir, "models.json");
  const registry = new ModelRegistry(authStorage, modelsJsonPath);
  const models = registry.getAll() as Model<Api>[];
  const availableModels = registry.getAvailable() as Model<Api>[];

  // Also include custom providers from models.json that aren't in the SDK's built-in catalog
  const fs = await import("node:fs/promises");
  try {
    const modelsJsonRaw = await fs.readFile(modelsJsonPath, "utf8");
    const modelsJson = JSON.parse(modelsJsonRaw) as {
      providers?: Record<
        string,
        {
          baseUrl?: string;
          models?: Array<{
            id?: string;
            name?: string;
            contextWindow?: number;
            reasoning?: boolean;
            input?: Array<"text" | "image">;
          }>;
        }
      >;
    };
    const existingKeys = new Set(models.map((m) => modelKey(m.provider, m.id)));
    for (const [providerName, providerConfig] of Object.entries(modelsJson.providers ?? {})) {
      for (const model of providerConfig.models ?? []) {
        const modelId = String(model?.id ?? "").trim();
        if (!modelId) continue;
        const key = modelKey(providerName, modelId);
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        // Create a Model-like object for custom providers
        models.push({
          id: modelId,
          name: String(model?.name ?? modelId).trim() || modelId,
          provider: providerName,
          baseUrl: providerConfig.baseUrl ?? "",
          contextWindow:
            typeof model?.contextWindow === "number" && model.contextWindow > 0
              ? model.contextWindow
              : undefined,
          reasoning: typeof model?.reasoning === "boolean" ? model.reasoning : undefined,
          input: Array.isArray(model?.input) ? model.input : ["text"],
        } as Model<Api>);
      }
    }
  } catch {
    // Ignore errors reading models.json - custom providers are optional
  }

  const availableKeys = new Set(availableModels.map((model) => modelKey(model.provider, model.id)));
  return { registry, models, availableKeys };
}

export function toModelRow(params: {
  model?: Model<Api>;
  key: string;
  tags: string[];
  aliases?: string[];
  availableKeys?: Set<string>;
  cfg?: OpenClawConfig;
  authStore?: AuthProfileStore;
}): ModelRow {
  const { model, key, tags, aliases = [], availableKeys, cfg, authStore } = params;
  if (!model) {
    return {
      key,
      name: key,
      input: "-",
      contextWindow: null,
      local: null,
      available: null,
      tags: [...tags, "missing"],
      missing: true,
    };
  }

  const input = model.input.join("+") || "text";
  const local = isLocalBaseUrl(model.baseUrl);
  const available =
    cfg && authStore
      ? hasAuthForProvider(model.provider, cfg, authStore)
      : (availableKeys?.has(modelKey(model.provider, model.id)) ?? false);
  const aliasTags = aliases.length > 0 ? [`alias:${aliases.join(",")}`] : [];
  const mergedTags = new Set(tags);
  if (aliasTags.length > 0) {
    for (const tag of mergedTags) {
      if (tag === "alias" || tag.startsWith("alias:")) mergedTags.delete(tag);
    }
    for (const tag of aliasTags) mergedTags.add(tag);
  }

  return {
    key,
    name: model.name || model.id,
    input,
    contextWindow: model.contextWindow ?? null,
    local,
    available,
    tags: Array.from(mergedTags),
    missing: false,
  };
}
