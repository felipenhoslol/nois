import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Plain Vitest config on purpose: the app config brings SSR/Nitro plugins tests don't need.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts?(x)"] },
});
