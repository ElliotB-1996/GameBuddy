import { describe, it, expect } from "vitest";
import {
  generateRewasd,
  CYBORG_BTN_INV,
  CYRO_BTN_INV,
  DIK_SCAN,
  DISPLAY_TO_DIK,
  bindingToMacros,
  activatorToRewasd,
} from "../../../src/renderer/keybinds/src/exporters/generateRewasd";
import type { Profile } from "../../../src/renderer/keybinds/src/data/types";
import { parseRewasd } from "../../../src/renderer/keybinds/src/importers/parseRewasd";

describe("CYBORG_BTN_INV", () => {
  it("Azeron btn 1 → reWASD 1", () => expect(CYBORG_BTN_INV["1"]).toBe(1));
  it("Azeron btn 2 → reWASD 5", () => expect(CYBORG_BTN_INV["2"]).toBe(5));
  it("Azeron btn 13 → reWASD 26", () => expect(CYBORG_BTN_INV["13"]).toBe(26));
});

describe("CYRO_BTN_INV", () => {
  it("Azeron btn 1 → reWASD 20", () => expect(CYRO_BTN_INV["1"]).toBe(20));
  it("Azeron btn 17 → reWASD 1", () => expect(CYRO_BTN_INV["17"]).toBe(1));
});

describe("DIK_SCAN", () => {
  it("DIK_A → 30", () => expect(DIK_SCAN["DIK_A"]).toBe(30));
  it("DIK_LCONTROL → 29", () => expect(DIK_SCAN["DIK_LCONTROL"]).toBe(29));
  it("DIK_LEFT → 203", () => expect(DIK_SCAN["DIK_LEFT"]).toBe(203));
});

describe("DISPLAY_TO_DIK", () => {
  it("A → DIK_A", () => expect(DISPLAY_TO_DIK["A"]).toBe("DIK_A"));
  it("Ctrl → DIK_LCONTROL", () => expect(DISPLAY_TO_DIK["Ctrl"]).toBe("DIK_LCONTROL"));
  it("→ → DIK_RIGHT", () => expect(DISPLAY_TO_DIK["→"]).toBe("DIK_RIGHT"));
});

describe("bindingToMacros", () => {
  it("single key A", () => {
    expect(bindingToMacros("A")).toEqual([
      { keyboard: { buttonId: 30, description: "DIK_A" } },
    ]);
  });

  it("Ctrl+Z combo", () => {
    expect(bindingToMacros("Ctrl+Z")).toEqual([
      { keyboard: { buttonId: 29, description: "DIK_LCONTROL" } },
      { keyboard: { buttonId: 44, description: "DIK_Z" } },
    ]);
  });

  it("Shift+Alt+K combo", () => {
    expect(bindingToMacros("Shift+Alt+K")).toEqual([
      { keyboard: { buttonId: 42, description: "DIK_LSHIFT" } },
      { keyboard: { buttonId: 56, description: "DIK_LMENU" } },
      { keyboard: { buttonId: 37, description: "DIK_K" } },
    ]);
  });

  it("LClick → mouse button 1", () => {
    expect(bindingToMacros("LClick")).toEqual([{ mouse: { buttonId: 1 } }]);
  });

  it("RClick → mouse button 2", () => {
    expect(bindingToMacros("RClick")).toEqual([{ mouse: { buttonId: 2 } }]);
  });

  it("Mouse Left → mouse direction", () => {
    expect(bindingToMacros("Mouse Left")).toEqual([{ mouse: { direction: "left" } }]);
  });

  it("Mouse Right → mouse direction", () => {
    expect(bindingToMacros("Mouse Right")).toEqual([{ mouse: { direction: "right" } }]);
  });

  it("Wheel Up → mouse wheel", () => {
    expect(bindingToMacros("Wheel Up")).toEqual([{ mouse: { wheel: "up" } }]);
  });

  it("Wheel Down → mouse wheel", () => {
    expect(bindingToMacros("Wheel Down")).toEqual([{ mouse: { wheel: "down" } }]);
  });

  it("right arrow key → DIK_RIGHT keyboard macro", () => {
    expect(bindingToMacros("→")).toEqual([
      { keyboard: { buttonId: 205, description: "DIK_RIGHT" } },
    ]);
  });

  it("layer switch → empty array", () => {
    expect(bindingToMacros("→ Shift")).toEqual([]);
  });

  it("unknown binding → empty array", () => {
    expect(bindingToMacros("LAUNCH_APP")).toEqual([]);
  });

  it("numpad plus (+) as sole key", () => {
    expect(bindingToMacros("+")).toEqual([
      { keyboard: { buttonId: 78, description: "DIK_ADD" } },
    ]);
  });
});

describe("activatorToRewasd", () => {
  it("single", () => {
    expect(activatorToRewasd("single")).toEqual({
      type: "single",
      mode: "hold_until_release",
    });
  });
  it("double", () => {
    expect(activatorToRewasd("double")).toEqual({
      type: "double",
      mode: "hold_until_release",
    });
  });
  it("triple", () => {
    expect(activatorToRewasd("triple")).toEqual({
      type: "triple",
      mode: "hold_until_release",
    });
  });
  it("long", () => {
    expect(activatorToRewasd("long")).toEqual({
      type: "long",
      mode: "hold_until_release",
    });
  });
  it("down → start/onetime", () => {
    expect(activatorToRewasd("down")).toEqual({
      type: "start",
      mode: "onetime",
      params: { expert: true },
    });
  });
  it("up → release/onetime", () => {
    expect(activatorToRewasd("up")).toEqual({
      type: "release",
      mode: "onetime",
      params: { expert: true },
    });
  });
  it("turbo", () => {
    expect(activatorToRewasd("turbo")).toEqual({ type: "single", mode: "turbo" });
  });
  it("toggle", () => {
    expect(activatorToRewasd("toggle")).toEqual({ type: "single", mode: "toggle" });
  });
});
