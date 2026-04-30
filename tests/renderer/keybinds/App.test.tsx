import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@keybinds/App";
import type { Profile } from "@keybinds/data/types";

const importedProfile: Profile = {
  id: "cyborg-vscode-windows",
  label: "VS Code Override",
  platform: "windows",
  type: "rewasd",
  device: "cyborg",
  layers: {
    default: {
      "1": { zone: "app", label: "Custom", bindings: { single: "Win+1" } },
    },
  },
  imported: true,
};

beforeEach(() => {
  let loadCb: ((profiles: Profile[]) => void) | undefined;
  (window as any).keybindsApi = {
    onProfilesLoad: vi.fn((cb: (p: Profile[]) => void) => { loadCb = cb; }),
    saveProfile: vi.fn().mockResolvedValue(undefined),
    deleteProfile: vi.fn().mockResolvedValue(undefined),
    onActiveApp: vi.fn(),
    removeActiveAppListener: vi.fn(),
  };
  // Trigger profiles load with no imported profiles by default
  setTimeout(() => loadCb?.([]), 0);
});

describe("App — resolveProfile override", () => {
  it("displays built-in profile button label on Windows Default tab", async () => {
    render(<App />);
    await act(async () => {});
    // Windows Default tab is active by default (index 1)
    // Built-in cyborg-windows-default should render
    expect(screen.getByText("Windows Default")).toBeInTheDocument();
  });

  it("uses imported override instead of built-in when ids match", async () => {
    let loadCb: ((profiles: Profile[]) => void) | undefined;
    (window as any).keybindsApi.onProfilesLoad = vi.fn(
      (cb: (p: Profile[]) => void) => { loadCb = cb; },
    );
    render(<App />);
    await act(async () => { loadCb?.([importedProfile]); });
    // Switch to VS Code tab (index 2)
    await userEvent.click(screen.getAllByText("VS Code")[0]);
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("does not show built-in override as an extra imported tab", async () => {
    let loadCb: ((profiles: Profile[]) => void) | undefined;
    (window as any).keybindsApi.onProfilesLoad = vi.fn(
      (cb: (p: Profile[]) => void) => { loadCb = cb; },
    );
    render(<App />);
    await act(async () => { loadCb?.([importedProfile]); });
    // Should not have an extra "VS Code Override" tab
    expect(screen.queryByText("VS Code Override")).toBeNull();
  });
});

describe("App — handleButtonSave", () => {
  it("calls saveProfile with the patched profile", async () => {
    let loadCb: ((profiles: Profile[]) => void) | undefined;
    (window as any).keybindsApi.onProfilesLoad = vi.fn(
      (cb: (p: Profile[]) => void) => { loadCb = cb; },
    );
    render(<App />);
    await act(async () => { loadCb?.([]); });

    // Switch to VS Code tab and enter edit mode on cyborg section
    await userEvent.click(screen.getAllByText("VS Code")[0]);
    // Click "✎ Edit" on the first DeviceSection (cyborg)
    const editBtns = screen.getAllByText("✎ Edit");
    await userEvent.click(editBtns[0]);

    // Click button #1 — find a .btn--editing element
    const editableBtns = document.querySelectorAll(".btn--editing");
    expect(editableBtns.length).toBeGreaterThan(0); // edit mode must be active
    await userEvent.click(editableBtns[0]);
    const saveBtn = document.querySelector(".edit-popup-save");
    expect(saveBtn).toBeTruthy(); // popup must have opened
    await userEvent.click(saveBtn!);
    expect((window as any).keybindsApi.saveProfile).toHaveBeenCalled();
  });
});

describe("App — combo selection", () => {
  it("renders combos panel with empty state for profiles without combos", async () => {
    render(<App />);
    await act(async () => {});
    expect(
      screen.getByText("No combos defined for this profile."),
    ).toBeInTheDocument();
  });

  it("clears combo selection when a zone is toggled", async () => {
    const profileWithCombos: Profile = {
      id: "cyborg-windows-default",
      label: "Windows Default",
      platform: "windows",
      type: "rewasd",
      device: "cyborg",
      layers: { default: {} },
      imported: true,
      combos: [
        {
          buttons: ["1", "2"],
          zone: "edit",
          label: "Chord",
          bindings: { single: "Ctrl+Z" },
          layer: "default",
        },
      ],
    };
    let loadCb: ((profiles: Profile[]) => void) | undefined;
    (window as any).keybindsApi.onProfilesLoad = vi.fn(
      (cb: (p: Profile[]) => void) => {
        loadCb = cb;
      },
    );
    render(<App />);
    await act(async () => {
      loadCb?.([profileWithCombos]);
    });

    // Select the combo row
    await userEvent.click(screen.getByText("Chord"));
    expect(document.querySelector(".combo-row.selected")).toBeTruthy();

    // Toggle a zone — combo selection should clear
    await userEvent.click(screen.getByText("Editing"));
    expect(document.querySelector(".combo-row.selected")).toBeNull();
  });
});
