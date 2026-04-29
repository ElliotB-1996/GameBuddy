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

const cyborgOnly: Profile = {
  id: "test-cyborg",
  label: "My App",
  platform: "windows",
  type: "rewasd",
  device: "cyborg",
  layers: {
    default: {
      "1": { zone: "unzoned", label: "Alpha",  bindings: { single: "A" } },
      "2": { zone: "unzoned", label: "Combo",  bindings: { single: "Ctrl+Z" } },
      "5": { zone: "unzoned", label: "Click",  bindings: { single: "LClick" } },
      "9": { zone: "unzoned", label: "Unmap",  bindings: {} },
    },
  },
};

describe("generateRewasd — structure", () => {
  it("sets config.appName from profile label", () => {
    expect(generateRewasd([cyborgOnly]).config.appName).toBe("My App");
  });

  it("emits cyborg gamepad as device id 1", () => {
    const file = generateRewasd([cyborgOnly]);
    const gp = file.devices.hardware.find((h) => h.name === "gamepad");
    expect(gp?.id).toBe(1);
  });

  it("always emits keyboard (id 21) and mouse (id 33) output devices", () => {
    const file = generateRewasd([cyborgOnly]);
    expect(file.devices.hardware.some((h) => h.id === 21 && h.name === "keyboard")).toBe(true);
    expect(file.devices.hardware.some((h) => h.id === 33 && h.name === "mouse")).toBe(true);
  });

  it("does not emit device id 2 when there is no cyro", () => {
    const file = generateRewasd([cyborgOnly]);
    expect(file.devices.hardware.some((h) => h.id === 2)).toBe(false);
  });

  it("creates one mask per mapped button (Azeron btn 1 → reWASD btn 1)", () => {
    const file = generateRewasd([cyborgOnly]);
    const btn1Mask = file.masks?.find((m) => m.set?.[0]?.buttonId === 1);
    expect(btn1Mask).toBeDefined();
    expect(btn1Mask?.set?.[0].deviceId).toBe(1);
  });

  it("skips shifts when there are no named layers", () => {
    expect(generateRewasd([cyborgOnly]).shifts).toBeUndefined();
  });

  it("emits a mapping with the button label as description", () => {
    const file = generateRewasd([cyborgOnly]);
    const m = file.mappings.find((m) => m.description === "Alpha");
    expect(m).toBeDefined();
  });

  it("emits DIK_A macro for binding A", () => {
    const file = generateRewasd([cyborgOnly]);
    const m = file.mappings.find((m) => m.description === "Alpha");
    expect(m?.macros?.[0].keyboard?.description).toBe("DIK_A");
  });

  it("emits two keyboard macros for Ctrl+Z", () => {
    const file = generateRewasd([cyborgOnly]);
    const m = file.mappings.find((m) => m.description === "Combo");
    expect(m?.macros).toHaveLength(2);
    expect(m?.macros?.[0].keyboard?.description).toBe("DIK_LCONTROL");
    expect(m?.macros?.[1].keyboard?.description).toBe("DIK_Z");
  });

  it("emits mouse button macro for LClick", () => {
    const file = generateRewasd([cyborgOnly]);
    const m = file.mappings.find((m) => m.description === "Click");
    expect(m?.macros?.[0].mouse).toEqual({ buttonId: 1 });
  });

  it("skips buttons with no bindings", () => {
    const file = generateRewasd([cyborgOnly]);
    expect(file.mappings.find((m) => m.description === "Unmap")).toBeUndefined();
  });

  it("emits single activator on the condition", () => {
    const file = generateRewasd([cyborgOnly]);
    const m = file.mappings.find((m) => m.description === "Alpha");
    expect((m as any).condition.mask.activator).toEqual({
      type: "single",
      mode: "hold_until_release",
    });
  });
});

describe("generateRewasd — cyborg+cyro pair", () => {
  const cyroOnly: Profile = {
    id: "test-cyro",
    label: "My App",
    platform: "windows",
    type: "rewasd",
    device: "cyro",
    layers: {
      default: {
        "1": { zone: "unzoned", label: "Beta", bindings: { single: "B" } },
      },
    },
  };

  it("emits device id 1 for cyborg, id 2 for cyro", () => {
    const file = generateRewasd([cyborgOnly, cyroOnly]);
    expect(file.devices.hardware.some((h) => h.id === 1 && h.name === "gamepad")).toBe(true);
    expect(file.devices.hardware.some((h) => h.id === 2 && h.name === "gamepad")).toBe(true);
  });

  it("cyro mask has deviceId 2", () => {
    const file = generateRewasd([cyborgOnly, cyroOnly]);
    const cyroMask = file.masks?.find(
      (m) => m.set?.[0].deviceId === 2 && m.set?.[0].buttonId === 20,
    );
    expect(cyroMask).toBeDefined();
  });

  it("emits mappings for both devices", () => {
    const file = generateRewasd([cyborgOnly, cyroOnly]);
    expect(file.mappings.find((m) => m.description === "Alpha")).toBeDefined();
    expect(file.mappings.find((m) => m.description === "Beta")).toBeDefined();
  });
});
