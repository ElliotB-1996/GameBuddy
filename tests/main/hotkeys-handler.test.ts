import { describe, it, expect } from "vitest";
import {
  buildAccelerator,
  validateAccelerator,
} from "../../src/main/ipc/hotkeys-handler";

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
