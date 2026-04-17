import { _electron as electron, type ElectronApplication, type Page } from "@playwright/test";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export interface AppHandle {
  app: ElectronApplication;
  page: Page;
  userDataDir: string;
}

export async function launchApp(env: Record<string, string> = {}): Promise<AppHandle> {
  const userDataDir = mkdtempSync(join(tmpdir(), "overlay-e2e-"));
  const app = await electron.launch({
    args: [join(__dirname, "../../../out/main/index.js")],
    env: {
      ...process.env,
      NODE_ENV: "production",
      E2E_USER_DATA_DIR: userDataDir,
      E2E_MOCK_VOICE: "1",
      E2E_NO_TRAY: "1",
      ...env,
    },
  });
  const page = await app.firstWindow();
  await page.waitForFunction(() => typeof window.api !== "undefined", null, {
    timeout: 10_000,
  });
  return { app, page, userDataDir };
}

export async function teardown({ app, userDataDir }: AppHandle): Promise<void> {
  await app.close();
  rmSync(userDataDir, { recursive: true, force: true });
}
