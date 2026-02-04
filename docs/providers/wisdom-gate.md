---
summary: "Use Wisdom Gate as a unified OpenAI-compatible API for multiple LLMs in OpenClaw"
read_when:
  - You subscribe to Wisdom Gate (JuheAPI) for model aggregation
  - You want a single API key and base URL for many LLMs (OpenAI, Claude, Gemini, etc.)
---
# Wisdom Gate (JuheAPI)

[Wisdom Gate](https://wisdom-gate.juheapi.com/) is an OpenAI-compatible API gateway that aggregates multiple LLM providers (OpenAI, Anthropic, Google, DeepSeek, etc.) behind one endpoint and API key. OpenClaw can use it like [OpenRouter](/providers/openrouter): set a custom provider with Wisdom Gate's base URL and your API key.

## API details

- **Base URL:** `https://wisdom-gate.juheapi.com/v1`
- **Auth:** Bearer token (your Wisdom Gate API key)
- **Endpoint:** `POST /v1/chat/completions` (OpenAI Chat Completions format)
- **Docs:** [Wisdom Gate API reference](https://wisdom-docs.juheapi.com/api-reference/text/completion)

## Config (recommended)

Add a `wisdom-gate` provider under `models.providers` and set your primary model to a model ID supported by Wisdom Gate.

### Option A: API key in config

```json5
{
  "models": {
    "providers": {
      "wisdom-gate": {
        "baseUrl": "https://wisdom-gate.juheapi.com/v1",
        "apiKey": "YOUR_WISDOM_GATE_API_KEY",
        "api": "openai-completions",
        "models": [
          {
            "id": "gpt-4",
            "name": "GPT-4",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 128000,
            "maxTokens": 8192
          },
          {
            "id": "claude-sonnet-4-5",
            "name": "Claude Sonnet 4.5",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 200000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "wisdom-gate/gpt-4" }
    }
  }
}
```

Replace `YOUR_WISDOM_GATE_API_KEY` with your key. Add more entries to `models` from [Wisdom Gate's model catalog](https://wisdom-gate.juheapi.com/models) as needed.

### Option B: API key from environment

Set the key in the environment and reference it in config (or omit `apiKey` and rely on env):

```bash
export WISDOM_GATE_API_KEY="your-api-key"
```

```json5
{
  "models": {
    "providers": {
      "wisdom-gate": {
        "baseUrl": "https://wisdom-gate.juheapi.com/v1",
        "api": "openai-completions",
        "models": [
          { "id": "gpt-4", "name": "GPT-4", "reasoning": false, "input": ["text"], "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }, "contextWindow": 128000, "maxTokens": 8192 }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "wisdom-gate/gpt-4" }
    }
  }
}
```

OpenClaw will resolve the API key from `WISDOM_GATE_API_KEY` when not set in the provider config.

## Model refs

Use the form `wisdom-gate/<model-id>` where `<model-id>` is the model ID supported by Wisdom Gate (e.g. `gpt-4`, `claude-sonnet-4-5`, or the exact IDs from their catalog).

Examples:

- `wisdom-gate/gpt-4`
- `wisdom-gate/claude-sonnet-4-5`

## Model IDs (catalog)

The [Wisdom Gate AI Models Gallery](https://wisdom-gate.juheapi.com/models) lists available models (the page loads the catalog dynamically). For configure and `models.providers["wisdom-gate"].models`, use these IDs so they are available under the wisdom-gate provider:

| Model ID | Description |
|----------|-------------|
| `gpt-4` | GPT-4 |
| `gpt-4o` | GPT-4o (text + image) |
| `gpt-5` | GPT-5 |
| `wisdom-ai-gpt5` | Wisdom GPT-5 (reasoning) |
| `claude-sonnet-4-5` | Claude Sonnet 4.5 |
| `claude-opus-4-5` | Claude Opus 4.5 |
| `claude-opus-4-5-20251101` | Claude Opus 4.5 (dated; use for sessions_spawn when the agent requests this ID) |
| `claude-opus-4.1` | Claude Opus 4.1 |
| `wisdom-ai-Cld` | Wisdom Claude |
| `gemini-2.5-flash` | Gemini 2.5 Flash (text + image) |
| `gemini-3-pro` | Gemini 3 Pro (text + image) |
| `gemini-3-pro-image-preview` | Gemini 3 Pro Image |
| `nano-banana-pro` | Nano Banana Pro (image generation) |
| `deepseek-chat` | DeepSeek Chat |
| `wisdom-ai-dsv3` | Wisdom DeepSeek V3 (reasoning) |
| `wisdom-ai-dsr1` | Wisdom DeepSeek R1 (reasoning) |
| `wisdom-ai-oss` | Wisdom Open Source |
| `sora-2` | Sora 2 (video) |
| `sora-2-pro` | Sora 2 Pro (video) |

Add entries to `models.providers["wisdom-gate"].models` in `~/.openclaw/openclaw.json` with the same `id` and appropriate `name`, `input`, `contextWindow`, and `maxTokens` so they appear in the configure UI and model selection.

## Onboarding

To store the key via the CLI (auth profiles):

```bash
openclaw agents add default
# When prompted for provider, choose or add one that uses API key; then add a profile for wisdom-gate with your key.
```

Or set `WISDOM_GATE_API_KEY` in your environment or in `models.providers["wisdom-gate"].apiKey` in `~/.openclaw/openclaw.json`.

## See also

- [Wisdom Gate](https://wisdom-gate.juheapi.com/) – product and model list
- [Wisdom Gate API docs](https://wisdom-docs.juheapi.com/api-reference/text/completion) – Chat Completions reference
- [OpenRouter](/providers/openrouter) – similar unified API pattern in OpenClaw
- [Model providers](/concepts/model-providers) – concepts and other providers
