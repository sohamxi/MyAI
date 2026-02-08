import { resolveApiKeyForProvider } from "./src/agents/model-auth.js";
import { normalizeProviderId } from "./src/agents/model-selection.js";

async function test() {
  console.log("Testing Auth Resolution...");

  try {
    const auth = await resolveApiKeyForProvider({ provider: "ollama" });
    console.log("Ollama Auth Result:", auth);
  } catch (err) {
    console.error("Ollama Auth Failed:", err.message);
  }
}

test();
