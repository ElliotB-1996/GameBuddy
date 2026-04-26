import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("electron", () => ({
  ipcMain: { handle: vi.fn() },
  BrowserWindow: vi.fn(),
}));

import { ipcMain } from "electron";
import { registerWindowHandlers } from "../../src/main/ipc/window-handler";

const makeWin = () => ({
  setIgnoreMouseEvents: vi.fn(),
  setOpacity: vi.fn(),
});

let win: ReturnType<typeof makeWin>;

const getHandler = (channel: string) => {
  const call = vi.mocked(ipcMain.handle).mock.calls.find(([ch]) => ch === channel);
  return call?.[1] as ((event: unknown, ...args: unknown[]) => unknown) | undefined;
};

beforeEach(() => {
  win = makeWin();
  vi.mocked(ipcMain.handle).mockClear();
  registerWindowHandlers(win as any);
});

describe("window:setMode handler", () => {
  it("view mode sets ignoreMouseEvents with forward:true", () => {
    getHandler("window:setMode")!({}, "view");
    expect(win.setIgnoreMouseEvents).toHaveBeenCalledWith(true, { forward: true });
  });

  it("edit mode unsets ignoreMouseEvents", () => {
    getHandler("window:setMode")!({}, "edit");
    expect(win.setIgnoreMouseEvents).toHaveBeenCalledWith(false);
  });
});

describe("window:setOpacity handler", () => {
  it("passes a valid opacity through unchanged", () => {
    getHandler("window:setOpacity")!({}, 0.5);
    expect(win.setOpacity).toHaveBeenCalledWith(0.5);
  });

  it("clamps opacity above 1 to 1", () => {
    getHandler("window:setOpacity")!({}, 1.5);
    expect(win.setOpacity).toHaveBeenCalledWith(1);
  });

  it("clamps opacity below 0 to 0", () => {
    getHandler("window:setOpacity")!({}, -0.5);
    expect(win.setOpacity).toHaveBeenCalledWith(0);
  });
});
