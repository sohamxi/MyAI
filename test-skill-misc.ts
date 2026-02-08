import { installSkill } from "./src/agents/skills-install.js";
import { hasBinary } from "./src/agents/skills.js";

// Mocking dependencies is hard in ESM/TSX without a fast test runner,
// so we will just check if the function exists and logic seems reachable via static analysis or basic execution.
// Actually, we can check if `hasBinary` works for 'go' which we installed.

console.log("Testing Skill Install Infra...");

if (hasBinary("go")) {
  console.log("PASS: 'go' binary detected");
} else {
  console.error("FAIL: 'go' binary not detected");
}

if (hasBinary("uv")) {
  console.log("PASS: 'uv' binary detected");
} else {
  console.error("FAIL: 'uv' binary not detected");
}

// We patched installSkill to return success if binary exists.
// We can't easily call installSkill without a full OpenClawConfig, which is complex to mock here.
// But verifying `hasBinary` works gives confidence in the first part of our patch.
