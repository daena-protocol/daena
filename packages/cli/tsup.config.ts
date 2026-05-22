import { defineConfig } from "tsup";
import { readFileSync, writeFileSync, chmodSync } from "node:fs";

/**
 * tsup's banner option places `#!/usr/bin/env node` after ESM imports
 * (esbuild puts imports first in ESM output). Node requires shebangs to
 * be on line 1, so we use an onSuccess hook to enforce it post-build.
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  clean: true,
  async onSuccess() {
    const file = "dist/index.js";
    const content = readFileSync(file, "utf8");
    // Strip any existing shebang line wherever it landed.
    const stripped = content.replace(/^#!.*\r?\n/m, "");
    // Prepend a fresh shebang on line 1.
    writeFileSync(file, "#!/usr/bin/env node\n" + stripped, "utf8");
    // Make the file executable so `bin: ./dist/index.js` works post-install.
    chmodSync(file, 0o755);
  }
});
