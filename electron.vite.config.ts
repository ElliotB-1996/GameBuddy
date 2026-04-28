import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: [] })],
    build: {
      rollupOptions: {
        input: {
          index: resolve("src/main/index.ts"),
          "whisper-worker": resolve("src/main/voice/whisper-worker.ts"),
        },
        external: ["@huggingface/transformers"],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve("src/preload/index.ts"),
          keybinds: resolve("src/preload/keybinds.ts"),
        },
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/notes/src"),
        "@keybinds": resolve("src/renderer/keybinds/src"),
      },
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          index: resolve("src/renderer/notes/index.html"),
          keybinds: resolve("src/renderer/keybinds/index.html"),
        },
      },
    },
  },
});
