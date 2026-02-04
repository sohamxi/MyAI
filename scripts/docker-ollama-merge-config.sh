#!/usr/bin/env bash
# Merge Ollama provider into OpenClaw config for Docker (gateway connects to http://ollama:11434/v1).
# Run from host: OPENCLAW_CONFIG_DIR=~/.openclaw ./scripts/docker-ollama-merge-config.sh
# Or from repo root: ./scripts/docker-ollama-merge-config.sh /path/to/openclaw/config

set -e
CONFIG_DIR="${1:-${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}}"
CONFIG_FILE="$CONFIG_DIR/openclaw.json"

if ! command -v jq &>/dev/null; then
  echo "jq is required. Install with: apt-get install jq / brew install jq" >&2
  exit 1
fi

OLLAMA_PROVIDER='{
  "baseUrl": "http://ollama:11434/v1",
  "apiKey": "ollama-local",
  "api": "openai-completions",
  "models": [
    { "id": "llama3.2", "name": "Llama 3.2", "reasoning": false, "input": ["text"], "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }, "contextWindow": 128000, "maxTokens": 8192 },
    { "id": "phi3", "name": "Phi-3", "reasoning": false, "input": ["text"], "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }, "contextWindow": 4096, "maxTokens": 4096 },
    { "id": "mistral", "name": "Mistral", "reasoning": false, "input": ["text"], "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }, "contextWindow": 32768, "maxTokens": 8192 },
    { "id": "qwen2.5-coder:7b", "name": "Qwen2.5 Coder 7B", "reasoning": false, "input": ["text"], "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }, "contextWindow": 32768, "maxTokens": 8192 }
  ]
}'

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Config not found: $CONFIG_FILE" >&2
  echo "Creating minimal config with Ollama provider." >&2
  mkdir -p "$CONFIG_DIR"
  echo "{}" | jq --argjson ollama "$OLLAMA_PROVIDER" \
    '.models.providers.ollama = $ollama | .models.mode = (.models.mode // "merge")' \
    > "$CONFIG_FILE"
  echo "Created $CONFIG_FILE. Add agents.defaults.model.primary and restart the gateway." >&2
  exit 0
fi

# Merge: set models.providers.ollama and ensure models.mode is merge
TMP=$(mktemp)
jq --argjson ollama "$OLLAMA_PROVIDER" '
  .models = ((.models // {}) | .providers = ((.providers // {}) + { "ollama": $ollama }) | .mode = (.mode // "merge"))
' "$CONFIG_FILE" > "$TMP"
mv "$TMP" "$CONFIG_FILE"
echo "Merged Ollama provider into $CONFIG_FILE"
echo "To use as fallback, add \"ollama/llama3.2\" to agents.defaults.model.fallbacks in config."
echo "Pull models after starting Ollama: docker exec openclaw-ollama ollama pull llama3.2"
