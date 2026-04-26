import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

vi.mock("electron", () => ({
  ipcMain: { handle: vi.fn() },
  app: { getPath: vi.fn() },
}));

import { ipcMain, app } from "electron";
import { registerKeybindsHandlers } from "../../src/main/ipc/keybinds-handler";
import { saveProfiles } from "../../src/main/store/profiles-store";
import type { Profile } from "../../src/renderer/keybinds/src/data/types";

const PROFILE_A: Profile = {
  id: "profile-a",
  label: "Profile A",
  platform: "windows",
  type: "rewasd",
  device: "cyborg",
  pairId: null,
  layers: { default: {} },
  imported: true,
};

const PROFILE_B: Profile = {
  id: "profile-b",
  label: "Profile B",
  platform: "windows",
  type: "rewasd",
  device: "cyro",
  pairId: null,
  layers: { default: {} },
  imported: true,
};

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "keybinds-handler-test-"));
  vi.mocked(app.getPath).mockReturnValue(tempDir);
  vi.mocked(ipcMain.handle).mockClear();
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

const getHandler = (channel: string) => {
  const call = vi.mocked(ipcMain.handle).mock.calls.find(([ch]) => ch === channel);
  return call?.[1] as ((event: unknown, ...args: unknown[]) => unknown) | undefined;
};

describe("registerKeybindsHandlers", () => {
  it("returns empty initialProfiles when no file exists", () => {
    const { initialProfiles } = registerKeybindsHandlers();
    expect(initialProfiles).toEqual([]);
  });

  it("returns initialProfiles loaded from existing file", () => {
    saveProfiles(join(tempDir, "profiles.json"), [PROFILE_A]);
    const { initialProfiles } = registerKeybindsHandlers();
    expect(initialProfiles).toEqual([PROFILE_A]);
  });

  it("registers keybinds:save and keybinds:delete handlers", () => {
    registerKeybindsHandlers();
    const channels = vi.mocked(ipcMain.handle).mock.calls.map(([ch]) => ch);
    expect(channels).toContain("keybinds:save");
    expect(channels).toContain("keybinds:delete");
  });
});

describe("keybinds:save handler", () => {
  it("adds a new profile that did not exist", async () => {
    registerKeybindsHandlers();
    const handler = getHandler("keybinds:save")!;
    await handler({}, PROFILE_A);

    const { initialProfiles } = registerKeybindsHandlers();
    expect(initialProfiles).toEqual([PROFILE_A]);
  });

  it("upserts an existing profile by id", async () => {
    saveProfiles(join(tempDir, "profiles.json"), [PROFILE_A]);
    registerKeybindsHandlers();
    const handler = getHandler("keybinds:save")!;

    const updated = { ...PROFILE_A, label: "Updated Label" };
    await handler({}, updated);

    const { initialProfiles } = registerKeybindsHandlers();
    expect(initialProfiles).toHaveLength(1);
    expect(initialProfiles[0].label).toBe("Updated Label");
  });

  it("appends when multiple profiles exist", async () => {
    saveProfiles(join(tempDir, "profiles.json"), [PROFILE_A]);
    registerKeybindsHandlers();
    const handler = getHandler("keybinds:save")!;
    await handler({}, PROFILE_B);

    const { initialProfiles } = registerKeybindsHandlers();
    expect(initialProfiles).toHaveLength(2);
  });
});

describe("keybinds:delete handler", () => {
  it("removes a profile by id", async () => {
    saveProfiles(join(tempDir, "profiles.json"), [PROFILE_A, PROFILE_B]);
    registerKeybindsHandlers();
    const handler = getHandler("keybinds:delete")!;
    await handler({}, "profile-a");

    const { initialProfiles } = registerKeybindsHandlers();
    expect(initialProfiles).toEqual([PROFILE_B]);
  });

  it("is a no-op when id does not exist", async () => {
    saveProfiles(join(tempDir, "profiles.json"), [PROFILE_A]);
    registerKeybindsHandlers();
    const handler = getHandler("keybinds:delete")!;
    await handler({}, "nonexistent-id");

    const { initialProfiles } = registerKeybindsHandlers();
    expect(initialProfiles).toEqual([PROFILE_A]);
  });
});
