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

describe("generateRewasd — shift layers", () => {
  const withShift: Profile = {
    id: "shift-cyborg",
    label: "ShiftApp",
    platform: "windows",
    type: "rewasd",
    device: "cyborg",
    layerLabels: { shift: "Fn" },
    layers: {
      default: {
        "1": { zone: "unzoned", label: "Alpha", bindings: { single: "A" } },
        "2": { zone: "unzoned", label: "SwitchToFn", bindings: { single: "→ Fn" } },
      },
      shift: {
        "1": { zone: "unzoned", label: "Beta",  bindings: { single: "B" } },
        "2": { zone: "unzoned", label: "ReturnToDefault", bindings: { single: "→ Default" } },
      },
    },
  };

  it("emits a shift entry for the named layer", () => {
    const file = generateRewasd([withShift]);
    expect(file.shifts).toHaveLength(1);
    expect(file.shifts?.[0].type).toBe("default");
    expect(file.shifts?.[0].description).toBe("Fn");
  });

  it("shift-layer mappings carry the shiftId on their condition", () => {
    const file = generateRewasd([withShift]);
    const shiftId = file.shifts?.[0].id!;
    const betaMapping = file.mappings.find((m) => m.description === "Beta");
    expect((betaMapping as any).condition.shiftId).toBe(shiftId);
  });

  it("default-layer mappings have no shiftId", () => {
    const file = generateRewasd([withShift]);
    const alphaMapping = file.mappings.find((m) => m.description === "Alpha");
    expect((alphaMapping as any).condition.shiftId).toBeUndefined();
  });

  it("layer-switch binding emits jumpToLayer with shift id", () => {
    const file = generateRewasd([withShift]);
    const shiftId = file.shifts?.[0].id!;
    const switchMapping = file.mappings.find((m) => m.description === "SwitchToFn");
    expect(switchMapping?.jumpToLayer?.layer).toBe(shiftId);
    expect(switchMapping?.macros).toBeUndefined();
  });

  it("→ Default binding emits jumpToLayer layer:0", () => {
    const file = generateRewasd([withShift]);
    const returnMapping = file.mappings.find((m) => m.description === "ReturnToDefault");
    expect(returnMapping?.jumpToLayer?.layer).toBe(0);
  });
});

describe("generateRewasd — all activator types", () => {
  const allActivators: Profile = {
    id: "act-test",
    label: "ActivatorTest",
    platform: "windows",
    type: "rewasd",
    device: "cyborg",
    layers: {
      default: {
        "1": {
          zone: "unzoned",
          label: "Btn1",
          bindings: {
            single: "A", double: "B", triple: "C",
            long: "D", down: "E", up: "F", turbo: "G", toggle: "H",
          },
        },
      },
    },
  };

  it("emits one mapping per non-empty activator", () => {
    const file = generateRewasd([allActivators]);
    const btn1Mappings = file.mappings.filter((m) => m.description === "Btn1");
    expect(btn1Mappings).toHaveLength(8);
  });

  it("double activator produces type:double on the condition", () => {
    const file = generateRewasd([allActivators]);
    const m = file.mappings.find(
      (m) => m.description === "Btn1" && (m as any).condition.mask.activator.type === "double",
    );
    expect(m).toBeDefined();
  });

  it("turbo activator produces mode:turbo on the condition", () => {
    const file = generateRewasd([allActivators]);
    const m = file.mappings.find(
      (m) => m.description === "Btn1" && (m as any).condition.mask.activator.mode === "turbo",
    );
    expect(m).toBeDefined();
  });
});

describe("generateRewasd — radial menus", () => {
  const withRadial: Profile = {
    id: "radial-cyborg",
    label: "RadialApp",
    platform: "windows",
    type: "rewasd",
    device: "cyborg",
    layers: {
      default: {
        "28": { zone: "unzoned", label: "RadialTrigger", bindings: {} },
      },
    },
    radialMenus: [
      {
        id: "menu-1",
        label: "My Menu",
        trigger: "28",
        color: "#ff1e1e",
        actions: [
          { label: "Up",    direction: "↑", binding: "A" },
          { label: "Down",  direction: "↓", binding: "B" },
          { label: "Left",  direction: "←", binding: "C" },
          { label: "Right", direction: "→", binding: "D" },
        ],
      },
    ],
  };

  it("emits a radialMenu shift", () => {
    const file = generateRewasd([withRadial]);
    expect(file.shifts?.some((s) => s.type === "radialMenu")).toBe(true);
  });

  it("emits radialMenuCircles with one root circle", () => {
    const file = generateRewasd([withRadial]);
    expect(file.radialMenuCircles).toHaveLength(1);
    expect(file.radialMenuCircles?.[0].sectors).toHaveLength(4);
  });

  it("emits four radialMenuSectors", () => {
    const file = generateRewasd([withRadial]);
    expect(file.radialMenuSectors).toHaveLength(4);
  });

  it("sector description matches action label", () => {
    const file = generateRewasd([withRadial]);
    const upSector = file.radialMenuSectors?.find((s) => s.description === "Up");
    expect(upSector).toBeDefined();
  });

  it("sector color matches menu color #ff1e1e → [255, 30, 30]", () => {
    const file = generateRewasd([withRadial]);
    expect(file.radialMenuSectors?.[0].color).toEqual([255, 30, 30]);
  });

  it("emits radialMenuSet masks for each leaf sector", () => {
    const file = generateRewasd([withRadial]);
    const radialMasks = file.masks?.filter((m) => m.radialMenuSet);
    expect(radialMasks).toHaveLength(4);
  });

  it("emits a jumpToLayer trigger mapping for the menu trigger button", () => {
    const file = generateRewasd([withRadial]);
    const radialShiftId = file.shifts?.find((s) => s.type === "radialMenu")?.id!;
    const triggerMapping = file.mappings.find(
      (m) => m.jumpToLayer?.layer === radialShiftId && m.description === "My Menu",
    );
    expect(triggerMapping).toBeDefined();
  });

  it("emits action mappings under the radial shift", () => {
    const file = generateRewasd([withRadial]);
    const radialShiftId = file.shifts?.find((s) => s.type === "radialMenu")?.id!;
    const actionMappings = file.mappings.filter(
      (m) => (m as any).condition?.shiftId === radialShiftId,
    );
    expect(actionMappings).toHaveLength(4);
  });

  it("nested submenu produces a child circle", () => {
    const withNested: Profile = {
      ...withRadial,
      radialMenus: [
        {
          id: "menu-nested",
          label: "Nested",
          trigger: "28",
          color: "#4c1d95",
          actions: [
            {
              label: "Sub",
              direction: "↑",
              submenu: {
                id: "submenu-1",
                label: "Sub Menu",
                trigger: "28",
                color: "#4c1d95",
                actions: [
                  { label: "A1", direction: "↑", binding: "A" },
                  { label: "A2", direction: "↓", binding: "B" },
                ],
              },
            },
            { label: "Other", direction: "↓", binding: "C" },
          ],
        },
      ],
    };
    const file = generateRewasd([withNested]);
    expect(file.radialMenuCircles).toHaveLength(2);
    const subSector = file.radialMenuSectors?.find((s) => s.description === "Sub");
    expect(subSector?.childCircleId).toBeDefined();
    // Parent circle must appear before child circle.
    const circles = file.radialMenuCircles!;
    const parentIdx = circles.findIndex((c) => !c.parentSectorId);
    const childIdx = circles.findIndex((c) => c.parentSectorId !== undefined);
    expect(parentIdx).toBeLessThan(childIdx);
  });
});

describe("round-trip: generateRewasd → parseRewasd", () => {
  it("keyboard binding survives round-trip", () => {
    const profile: Profile = {
      id: "rt-kb",
      label: "RTKeyboard",
      platform: "windows",
      type: "rewasd",
      device: "cyborg",
      layers: {
        default: {
          "1": { zone: "unzoned", label: "Alpha", bindings: { single: "A" } },
          "2": { zone: "unzoned", label: "Combo", bindings: { single: "Ctrl+Z" } },
          "3": { zone: "unzoned", label: "Multi", bindings: { single: "Shift+Alt+K" } },
        },
      },
    };
    const reparsed = parseRewasd(generateRewasd([profile]));
    const cyborg = reparsed.find((p) => p.device === "cyborg")!;
    expect(cyborg.layers.default["1"]?.bindings.single).toBe("A");
    expect(cyborg.layers.default["2"]?.bindings.single).toBe("Ctrl+Z");
    expect(cyborg.layers.default["3"]?.bindings.single).toBe("Shift+Alt+K");
  });

  it("mouse bindings survive round-trip", () => {
    const profile: Profile = {
      id: "rt-mouse",
      label: "RTMouse",
      platform: "windows",
      type: "rewasd",
      device: "cyborg",
      layers: {
        default: {
          "1": { zone: "unzoned", label: "LClick",    bindings: { single: "LClick" } },
          "2": { zone: "unzoned", label: "MouseLeft", bindings: { single: "Mouse Left" } },
          "3": { zone: "unzoned", label: "WheelUp",   bindings: { single: "Wheel Up" } },
        },
      },
    };
    const reparsed = parseRewasd(generateRewasd([profile]));
    const cyborg = reparsed.find((p) => p.device === "cyborg")!;
    expect(cyborg.layers.default["1"]?.bindings.single).toBe("LClick");
    expect(cyborg.layers.default["2"]?.bindings.single).toBe("Mouse Left");
    expect(cyborg.layers.default["3"]?.bindings.single).toBe("Wheel Up");
  });

  it("shift layer and layer-switch binding survive round-trip", () => {
    const profile: Profile = {
      id: "rt-shift",
      label: "RTShift",
      platform: "windows",
      type: "rewasd",
      device: "cyborg",
      layerLabels: { shift: "Fn" },
      layers: {
        default: {
          "1": { zone: "unzoned", label: "Alpha",    bindings: { single: "A" } },
          "5": { zone: "unzoned", label: "GoToFn",   bindings: { single: "→ Fn" } },
        },
        shift: {
          "1": { zone: "unzoned", label: "Beta",     bindings: { single: "B" } },
          "5": { zone: "unzoned", label: "GoBack",   bindings: { single: "→ Default" } },
        },
      },
    };
    const reparsed = parseRewasd(generateRewasd([profile]));
    const cyborg = reparsed.find((p) => p.device === "cyborg")!;
    expect(cyborg.layers.default["1"]?.bindings.single).toBe("A");
    expect(cyborg.layers.shift?.["1"]?.bindings.single).toBe("B");
    // Layer switches produce "→ <name>" — just verify the prefix
    expect(cyborg.layers.default["5"]?.bindings.single).toMatch(/^→/);
    expect(cyborg.layers.shift?.["5"]?.bindings.single).toMatch(/^→/);
  });

  it("all 8 activator types survive round-trip", () => {
    const profile: Profile = {
      id: "rt-act",
      label: "RTActivators",
      platform: "windows",
      type: "rewasd",
      device: "cyborg",
      layers: {
        default: {
          "1": {
            zone: "unzoned",
            label: "Multi",
            bindings: {
              single: "A", double: "B", triple: "C", long: "D",
              down: "E", up: "F", turbo: "G", toggle: "H",
            },
          },
        },
      },
    };
    const reparsed = parseRewasd(generateRewasd([profile]));
    const cyborg = reparsed.find((p) => p.device === "cyborg")!;
    const b = cyborg.layers.default["1"]?.bindings;
    expect(b?.single).toBe("A");
    expect(b?.double).toBe("B");
    expect(b?.triple).toBe("C");
    expect(b?.long).toBe("D");
    expect(b?.down).toBe("E");
    expect(b?.up).toBe("F");
    expect(b?.turbo).toBe("G");
    expect(b?.toggle).toBe("H");
  });

  it("radial menu action bindings survive round-trip", () => {
    const profile: Profile = {
      id: "rt-radial",
      label: "RTRadial",
      platform: "windows",
      type: "rewasd",
      device: "cyborg",
      layers: {
        default: {
          "1":  { zone: "unzoned", label: "Anchor", bindings: { single: "Z" } },
          "28": { zone: "unzoned", label: "RadialTrigger", bindings: {} },
        },
      },
      radialMenus: [
        {
          id: "menu-rt",
          label: "My Menu",
          trigger: "28",
          color: "#ff1e1e",
          actions: [
            { label: "Up",    direction: "↑", binding: "A" },
            { label: "Down",  direction: "↓", binding: "B" },
            { label: "Left",  direction: "←", binding: "C" },
            { label: "Right", direction: "→", binding: "D" },
          ],
        },
      ],
    };
    const reparsed = parseRewasd(generateRewasd([profile]));
    const menus = reparsed[0].radialMenus;
    expect(menus).toHaveLength(1);
    const actions = menus![0].actions;
    expect(actions).toHaveLength(4);
    expect(actions[0].binding).toBe("A");
    expect(actions[1].binding).toBe("B");
    expect(actions[2].binding).toBe("C");
    expect(actions[3].binding).toBe("D");
  });

  it("cyborg+cyro pair survives round-trip", () => {
    const cyborg: Profile = {
      id: "rt-cyborg",
      label: "RTBoth",
      platform: "windows",
      type: "rewasd",
      device: "cyborg",
      layers: { default: { "1": { zone: "unzoned", label: "CyborgBtn", bindings: { single: "A" } } } },
    };
    const cyro: Profile = {
      id: "rt-cyro",
      label: "RTBoth",
      platform: "windows",
      type: "rewasd",
      device: "cyro",
      layers: { default: { "1": { zone: "unzoned", label: "CyroBtn", bindings: { single: "B" } } } },
    };
    const reparsed = parseRewasd(generateRewasd([cyborg, cyro]));
    expect(reparsed.find((p) => p.device === "cyborg")?.layers.default["1"]?.bindings.single).toBe("A");
    expect(reparsed.find((p) => p.device === "cyro")?.layers.default["1"]?.bindings.single).toBe("B");
  });
});
