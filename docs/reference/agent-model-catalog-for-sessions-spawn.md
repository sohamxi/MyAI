# Model catalog summary for sessions_spawn (agent reference)

This document summarizes the **effective model catalog** for this OpenClaw setup so the agent can use `sessions_spawn` with valid model refs only.

## Why model selection was failing

- `sessions_spawn` sends a **sessions.patch** request with `model: "<ref>"`.
- The gateway accepts **only** model refs that exist in the configured **catalog** (from `models.providers.*.models` in config).
- If you pass a ref that is **not** in the catalog (e.g. `gpt-5.2`, `kimi-k2.5`, `deepseek-v3.2`, `gemini-3-flash`), the patch is **rejected**. The sub-agent then runs with the **default** model (`wisdom-gate/gemini-2.5-flash`). The tool may still report `modelApplied: true` when the patch is accepted; if the ref was invalid, the patch fails and the sub-agent uses the default.
- So you must use **only** the refs listed below for `sessions_spawn.model`.

## Global config: `~/.openclaw/openclaw.json`

### Default model (main and sub-agents when no override)

- **Primary:** `wisdom-gate/gemini-2.5-flash`
- **Fallbacks:** `wisdom-gate/deepseek-chat`, `wisdom-gate/claude-sonnet-4-5`, `wisdom-gate/gpt-4`
- **Sub-agents:** `agents.defaults.subagents` has only `maxConcurrent: 8`; there is **no** `agents.defaults.subagents.model`. So when you don’t pass `model` in `sessions_spawn`, the sub-agent uses the same default as above (primary + fallbacks).

### Wisdom-gate provider: allowed model refs

The catalog is built from `models.providers.wisdom-gate.models`. Each entry has an `id`. The **model ref** you must use in `sessions_spawn` is:

**`wisdom-gate/<id>`**

with one of the following **exact** IDs (no other IDs are in the catalog):

| Model ref | Name |
|-----------|------|
| `wisdom-gate/gpt-4` | GPT-4 |
| `wisdom-gate/gpt-4o` | GPT-4o |
| `wisdom-gate/gpt-5` | GPT-5 |
| `wisdom-gate/wisdom-ai-gpt5` | Wisdom GPT-5 |
| `wisdom-gate/claude-sonnet-4-5` | Claude Sonnet 4.5 |
| `wisdom-gate/claude-opus-4-5` | Claude Opus 4.5 |
| `wisdom-gate/claude-opus-4-5-20251101` | Claude Opus 4.5 (2025-11-01) |
| `wisdom-gate/claude-opus-4.1` | Claude Opus 4.1 |
| `wisdom-gate/wisdom-ai-Cld` | Wisdom Claude |
| `wisdom-gate/gemini-2.5-flash` | Gemini 2.5 Flash (default) |
| `wisdom-gate/gemini-3-pro` | Gemini 3 Pro |
| `wisdom-gate/gemini-3-pro-image-preview` | Gemini 3 Pro Image |
| `wisdom-gate/deepseek-chat` | DeepSeek Chat |
| `wisdom-gate/wisdom-ai-dsv3` | Wisdom DeepSeek V3 |
| `wisdom-gate/wisdom-ai-dsr1` | Wisdom DeepSeek R1 |
| `wisdom-gate/wisdom-ai-oss` | Wisdom Open Source |
| `wisdom-gate/nano-banana-pro` | Nano Banana Pro |
| `wisdom-gate/sora-2` | Sora 2 |
| `wisdom-gate/sora-2-pro` | Sora 2 Pro |
| `wisdom-gate/gpt-5.2` | GPT-5.2 |
| `wisdom-gate/deepseek-v3.2` | DeepSeek V3.2 |
| `wisdom-gate/gemini-3-flash` | Gemini 3 Flash |
| `wisdom-gate/claude-opus-4-20250514-thinking` | Claude Opus 4 (thinking) |
| `wisdom-gate/claude-opus-4-1-20250805-thinking` | Claude Opus 4.1 (thinking) |
| `wisdom-gate/kimi-k2.5` | Kimi K2.5 |
| `wisdom-gate/claude-3-5-sonnet-20240620` | Claude 3.5 Sonnet |
| `wisdom-gate/claude-sonnet-4-20250514-thinking` | Claude Sonnet 4 (thinking) |
| `wisdom-gate/glm-4.7` | GLM-4.7 |
| `wisdom-gate/qwen3-coder` | Qwen3 Coder |
| `wisdom-gate/kimi-k2-thinking` | Kimi K2 (thinking) |
| `wisdom-gate/minimax-m2.1` | Minimax M2.1 |
| `wisdom-gate/grok-4.1` | Grok 4.1 |
| `wisdom-gate/qwen3-32b` | Qwen3 32B |
| `wisdom-gate/gpt-4o-mini` | GPT-4o Mini |
| `wisdom-gate/claude-haiku-4-5-20251001` | Claude Haiku 4.5 |
| `wisdom-gate/veo-3.1-pro` | Veo 3.1 Pro |
| `wisdom-gate/veo-3.1` | Veo 3.1 |

## Model IDs you must not use (not in this catalog)

If a model ref is not in the table above, it is not in the catalog. Use only refs from the table for `sessions_spawn.model`. (The catalog was updated to include gpt-5.2, deepseek-v3.2, gemini-3-flash, kimi-k2.5, minimax-m2.1, qwen3-32b, and the other IDs listed in the table.)

## Agent-specific config: `~/.openclaw/agents/main/agent/models.json`

This file exists and mirrors the same wisdom-gate provider and model list as the global config. The gateway builds the catalog from the **effective** config (global + agent scope); for this setup the allowed model refs are the same as in the table above. No extra or different model IDs are introduced here.

## How to use this

- For **sessions_spawn**, set `model` to **exactly** one of the refs in the table, e.g. `wisdom-gate/claude-opus-4-5-20251101` or `wisdom-gate/claude-opus-4-5`.
- Do **not** use provider/model IDs that are not in that table; they are not in the catalog and the sub-agent will fall back to `wisdom-gate/gemini-2.5-flash`.
- After the fix (adding `claude-opus-4-5-20251101` to the catalog), using `wisdom-gate/claude-opus-4-5-20251101` in `sessions_spawn` should result in the sub-agent run and transcript showing that model.

## If you see "Model ... is not allowed"

The gateway loads the model catalog once at startup from `~/.openclaw/openclaw.json` (via `~/.openclaw/agents/main/agent/models.json`) and caches it for the process lifetime. If you added or changed models in `openclaw.json` **after** the gateway was already running, the running process still has the old catalog (e.g. only 15 wisdom-gate models). **Restart the gateway** so it reloads config and rebuilds the catalog; then `/models wisdom-gate` and model selection will include all models from your current config.
