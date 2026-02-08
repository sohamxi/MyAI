#!/usr/bin/env node

import module from "node:module";

// https://nodejs.org/api/module.html#module-compile-cache
if (module.enableCompileCache && !process.env.NODE_DISABLE_COMPILE_CACHE) {
  try {
    module.enableCompileCache();
  } catch {
    // Ignore errors
  }
}

// [PATCH] Ensure Go is in PATH for skills
if (
  process.platform === "linux" &&
  process.env.PATH &&
  !process.env.PATH.includes("/usr/local/go/bin")
) {
  process.env.PATH = `${process.env.PATH}:/usr/local/go/bin`;
}

await import("./dist/entry.js");
