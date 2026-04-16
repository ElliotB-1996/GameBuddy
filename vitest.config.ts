import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/renderer/setup.ts"],
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
    alias: {
      "@renderer": resolve(__dirname, "src/renderer/src"),
    },
  },
});
