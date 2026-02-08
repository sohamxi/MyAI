---
summary: "Run local models with Ollama and connect them to OpenClaw"
read_when:
  - You want to use local LLMs (open source)
  - You want to reduce API costs or ensure privacy
---

# Ollama (Local)

[Ollama](https://ollama.com) allows you to run open-source large language models (like Llama 3, Mistral, Gemma) locally on your machine. OpenClaw supports Ollama out of the box.

## Setup

1.  **Install Ollama**: Follow instructions at [ollama.com/download](https://ollama.com/download).
2.  **Pull a model**: Run `ollama pull llama3` (or any other model).
3.  **Start server**: Ensure `ollama serve` is running (default port 11434).

## Configuration

Add an `ollama` provider entry in your `~/.openclaw/openclaw.json` (or `models.json`):

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://127.0.0.1:11434/v1",
        api: "openai-completions",
        models: [
          {
            id: "llama3",
            name: "Llama 3 Local",
            contextWindow: 8192,
            maxTokens: 4096,
            cost: { input: 0, output: 0 },
          },
          {
            id: "mistral",
            name: "Mistral Local",
            contextWindow: 8192,
            maxTokens: 4096,
            cost: { input: 0, output: 0 },
          },
        ],
      },
    },
  },
}
```

## Usage

Refer to models using `ollama/<model-id>`, for example:

- `ollama/llama3`

If your models are not showing up, ensure the `id` in your config matches the name in `ollama list`.

## Troubleshooting

- **Connection Refused**: Ensure Ollama is running (`curl http://127.0.0.1:11434`).
- **Context limit**: Increase `num_ctx` in your Ollama Modelfile if you need larger context windows, and update config accordingly.
