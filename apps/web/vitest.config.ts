import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  esbuild: { jsx: "automatic" },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
