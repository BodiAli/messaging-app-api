import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    setupFiles: "./src/tests/setup/setup.ts",
  },
});
