import { test, expect } from "@playwright/test";
import { _electron as electron } from "@playwright/test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { launchApp } from "./helpers/launch";
import type { AppData } from "../../src/renderer/notes/src/types";

const MAIN_PATH = join(__dirname, "../../out/main/index.js");

const SEED_DATA: AppData = {
  settings: {
    hotkeys: {
      toggleVisibility: "Alt+Shift+N",
      toggleEditMode: "Alt+Shift+E",
      startVoiceNote: "Alt+Shift+V",
    },
  },
  appearance: {
    bgColor: "#0a0c10",
    headerColor: "#0a0c10",
    accentColor: "#4ade80",
    textColor: "#e2e8f0",
    noteColor: "#181c24",
    fontSize: 13,
    viewOpacity: 0.82,
    editOpacity: 1.0,
  },
  sections: [{ id: "sec-1", name: "Boss Guide", notes: [] }],
};

test.describe("notes IPC", () => {
  test("notes:load delivers seeded AppData to renderer on startup", async () => {
    const userDataDir = mkdtempSync(join(tmpdir(), "overlay-e2e-seed-"));
    writeFileSync(join(userDataDir, "notes.json"), JSON.stringify(SEED_DATA), "utf-8");

    const app = await electron.launch({
      args: [MAIN_PATH],
      env: { ...process.env, NODE_ENV: "production", E2E_USER_DATA_DIR: userDataDir, E2E_MOCK_VOICE: "1", E2E_NO_TRAY: "1" },
    });
    const page = await app.firstWindow();
    await page.waitForFunction(() => typeof window.api !== "undefined", null, { timeout: 10_000 });

    await expect(page.getByText("Boss Guide")).toBeVisible({ timeout: 5000 });

    await app.close();
    rmSync(userDataDir, { recursive: true, force: true });
  });

  test("notes:save persists data and notes:load delivers it on next launch", async () => {
    const handle = await launchApp();

    await handle.page.evaluate(async (data) => {
      await window.api.saveNotes(data);
    }, SEED_DATA);

    const savedDir = handle.userDataDir;
    await handle.app.close();

    const app2 = await electron.launch({
      args: [MAIN_PATH],
      env: { ...process.env, NODE_ENV: "production", E2E_USER_DATA_DIR: savedDir, E2E_MOCK_VOICE: "1", E2E_NO_TRAY: "1" },
    });
    const page2 = await app2.firstWindow();
    await page2.waitForFunction(() => typeof window.api !== "undefined", null, { timeout: 10_000 });

    await expect(page2.getByText("Boss Guide")).toBeVisible({ timeout: 5000 });

    await app2.close();
    rmSync(savedDir, { recursive: true, force: true });
  });
});
