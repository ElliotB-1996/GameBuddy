import { vi, describe, it, expect, beforeEach } from "vitest";
import { loadImportedProfiles, saveProfile, deleteProfile } from "@keybinds/db";
import type { Profile } from "@keybinds/data/types";

const PROFILE: Profile = {
  id: "test-1",
  label: "Test Profile",
  platform: "windows",
  type: "rewasd",
  device: "cyborg",
  pairId: null,
  layers: { default: {} },
  imported: true,
};

beforeEach(() => {
  (window as any).keybindsApi = {
    onProfilesLoad: vi.fn(),
    saveProfile: vi.fn().mockResolvedValue(undefined),
    deleteProfile: vi.fn().mockResolvedValue(undefined),
  };
});

describe("loadImportedProfiles", () => {
  it("returns a promise that resolves when the callback is invoked", async () => {
    let captured: ((profiles: Profile[]) => void) | undefined;
    (window as any).keybindsApi.onProfilesLoad = vi.fn((cb: (p: Profile[]) => void) => {
      captured = cb;
    });

    const promise = loadImportedProfiles();
    captured!([PROFILE]);
    const result = await promise;
    expect(result).toEqual([PROFILE]);
  });

  it("resolves with an empty array when callback receives none", async () => {
    let captured: ((profiles: Profile[]) => void) | undefined;
    (window as any).keybindsApi.onProfilesLoad = vi.fn((cb: (p: Profile[]) => void) => {
      captured = cb;
    });

    const promise = loadImportedProfiles();
    captured!([]);
    expect(await promise).toEqual([]);
  });
});

describe("saveProfile", () => {
  it("delegates to window.keybindsApi.saveProfile", async () => {
    await saveProfile(PROFILE);
    expect((window as any).keybindsApi.saveProfile).toHaveBeenCalledWith(PROFILE);
  });
});

describe("deleteProfile", () => {
  it("delegates to window.keybindsApi.deleteProfile", async () => {
    await deleteProfile("test-1");
    expect((window as any).keybindsApi.deleteProfile).toHaveBeenCalledWith("test-1");
  });
});
