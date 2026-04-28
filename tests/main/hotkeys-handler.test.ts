import { vi, describe, it, expect, beforeEach } from "vitest";
import type { Mock } from "vitest";

vi.mock("electron", () => ({
  globalShortcut: {
    register: vi.fn().mockReturnValue(true),
    unregisterAll: vi.fn(),
  },
  ipcMain: { handle: vi.fn() },
  BrowserWindow: vi.fn(),
}));

import { globalShortcut } from "electron";
import {
  buildAccelerator,
  validateAccelerator,
  registerGlobalHotkeys,
  unregisterGlobalHotkeys,
} from "../../src/main/ipc/hotkeys-handler";
import type { Hotkeys } from "../../src/renderer/notes/src/types";

const makeWin = () => ({
  isVisible: vi.fn().mockReturnValue(true),
  hide: vi.fn(),
  show: vi.fn(),
  webContents: { send: vi.fn() },
});

const HOTKEYS: Hotkeys = {
  toggleVisibility: "Alt+V",
  toggleEditMode: "Alt+E",
  startVoiceNote: "Alt+N",
  toggleKeybinds: "Alt+K",
};

describe("buildAccelerator", () => {
  it("returns the accelerator string as-is", () => {
    expect(buildAccelerator("Alt+Shift+N")).toBe("Alt+Shift+N");
  });

  it("handles single key accelerators", () => {
    expect(buildAccelerator("F1")).toBe("F1");
  });
});

describe("validateAccelerator", () => {
  it("accepts a valid modifier + letter combo", () => {
    expect(validateAccelerator("Alt+Shift+N")).toBeNull();
  });

  it("accepts Ctrl + function key", () => {
    expect(validateAccelerator("Ctrl+F5")).toBeNull();
  });

  it("accepts CmdOrCtrl modifier", () => {
    expect(validateAccelerator("CmdOrCtrl+Z")).toBeNull();
  });

  it("accepts multiple modifiers", () => {
    expect(validateAccelerator("Alt+Shift+V")).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(validateAccelerator("")).not.toBeNull();
  });

  it("rejects a bare key with no modifier", () => {
    expect(validateAccelerator("N")).not.toBeNull();
  });

  it("rejects an unrecognised modifier", () => {
    expect(validateAccelerator("Hyper+N")).not.toBeNull();
  });

  it("rejects an unrecognised key", () => {
    expect(validateAccelerator("Alt+$$$")).not.toBeNull();
  });

  it("rejects a modifier-only string", () => {
    expect(validateAccelerator("Alt+Shift")).not.toBeNull();
  });
});

describe("unregisterGlobalHotkeys", () => {
  it("calls globalShortcut.unregisterAll", () => {
    unregisterGlobalHotkeys();
    expect(globalShortcut.unregisterAll).toHaveBeenCalled();
  });
});

describe("registerGlobalHotkeys", () => {
  let notesWin: ReturnType<typeof makeWin>;
  let keybindsWin: ReturnType<typeof makeWin>;

  beforeEach(() => {
    notesWin = makeWin();
    keybindsWin = makeWin();
    vi.mocked(globalShortcut.register).mockClear();
    vi.mocked(globalShortcut.unregisterAll).mockClear();
  });

  const getCallback = (accelerator: string): (() => void) | undefined => {
    const call = (globalShortcut.register as Mock).mock.calls.find(
      ([acc]: [string]) => acc === accelerator,
    );
    return call?.[1];
  };

  it("calls unregisterAll before registering", () => {
    registerGlobalHotkeys(notesWin as any, keybindsWin as any, HOTKEYS);
    expect(globalShortcut.unregisterAll).toHaveBeenCalledOnce();
  });

  it("registers all four valid hotkeys", () => {
    registerGlobalHotkeys(notesWin as any, keybindsWin as any, HOTKEYS);
    expect(globalShortcut.register).toHaveBeenCalledTimes(4);
  });

  it("toggleVisibility hides notes window when visible", () => {
    notesWin.isVisible.mockReturnValue(true);
    registerGlobalHotkeys(notesWin as any, keybindsWin as any, HOTKEYS);
    getCallback("Alt+V")!();
    expect(notesWin.hide).toHaveBeenCalled();
    expect(notesWin.show).not.toHaveBeenCalled();
  });

  it("toggleVisibility shows notes window when hidden", () => {
    notesWin.isVisible.mockReturnValue(false);
    registerGlobalHotkeys(notesWin as any, keybindsWin as any, HOTKEYS);
    getCallback("Alt+V")!();
    expect(notesWin.show).toHaveBeenCalled();
    expect(notesWin.hide).not.toHaveBeenCalled();
  });

  it("toggleEditMode sends hotkey:toggleEditMode IPC", () => {
    registerGlobalHotkeys(notesWin as any, keybindsWin as any, HOTKEYS);
    getCallback("Alt+E")!();
    expect(notesWin.webContents.send).toHaveBeenCalledWith("hotkey:toggleEditMode");
  });

  it("startVoiceNote sends hotkey:startVoiceNote IPC", () => {
    registerGlobalHotkeys(notesWin as any, keybindsWin as any, HOTKEYS);
    getCallback("Alt+N")!();
    expect(notesWin.webContents.send).toHaveBeenCalledWith("hotkey:startVoiceNote");
  });

  it("toggleKeybinds hides keybinds window when visible", () => {
    keybindsWin.isVisible.mockReturnValue(true);
    registerGlobalHotkeys(notesWin as any, keybindsWin as any, HOTKEYS);
    getCallback("Alt+K")!();
    expect(keybindsWin.hide).toHaveBeenCalled();
    expect(keybindsWin.show).not.toHaveBeenCalled();
  });

  it("toggleKeybinds shows keybinds window when hidden", () => {
    keybindsWin.isVisible.mockReturnValue(false);
    registerGlobalHotkeys(notesWin as any, keybindsWin as any, HOTKEYS);
    getCallback("Alt+K")!();
    expect(keybindsWin.show).toHaveBeenCalled();
    expect(keybindsWin.hide).not.toHaveBeenCalled();
  });

  it("skips hotkeys with empty string", () => {
    registerGlobalHotkeys(notesWin as any, keybindsWin as any, {
      ...HOTKEYS,
      toggleVisibility: "",
    });
    expect(globalShortcut.register).toHaveBeenCalledTimes(3);
  });

  it("skips hotkeys that fail validateAccelerator", () => {
    registerGlobalHotkeys(notesWin as any, keybindsWin as any, {
      ...HOTKEYS,
      toggleEditMode: "NotAValidKey",
    });
    expect(globalShortcut.register).toHaveBeenCalledTimes(3);
  });
});
