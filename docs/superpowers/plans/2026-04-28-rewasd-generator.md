# reWASD Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `generateRewasd(profiles)` and an Export button that produce `.rewasd` files openable and editable in reWASD software.

**Architecture:** A pure `generateRewasd(profiles: Profile[]): RewasdFile` function in `src/renderer/keybinds/src/exporters/generateRewasd.ts` reverse-maps Azeron button numbers to reWASD button IDs, converts binding strings to `RewasdMacroItem[]` arrays using DirectInput scan codes, and builds the full `RewasdFile` structure (devices, masks, shifts, mappings, radial circles/sectors). `App.tsx` adds an Export button that resolves the current tab's profiles, calls the generator, and triggers a blob download.

**Tech Stack:** TypeScript, React, Vitest, existing `rewasdSchema.ts` types

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/renderer/keybinds/src/exporters/generateRewasd.ts` |
| Create | `tests/renderer/keybinds/generateRewasd.test.ts` |
| Modify | `src/renderer/keybinds/src/App.tsx` |

---

## Task 1: Data tables + bindingToMacros + activatorToRewasd

**Files:**
- Create: `src/renderer/keybinds/src/exporters/generateRewasd.ts`
- Create: `tests/renderer/keybinds/generateRewasd.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/renderer/keybinds/generateRewasd.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/renderer/keybinds/generateRewasd.test.ts
```

Expected: multiple FAIL errors (module not found).

- [ ] **Step 3: Create generateRewasd.ts with data tables and helpers**

Create `src/renderer/keybinds/src/exporters/generateRewasd.ts`:

```typescript
import type { Profile, RadialMenu } from "../data/types";
import type {
  RewasdFile,
  RewasdHardware,
  RewasdShift,
  RewasdMask,
  RewasdMapping,
  RewasdMappingMask,
  RewasdMacroItem,
  RewasdActivator,
  RewasdCircle,
  RewasdSector,
} from "../importers/rewasdSchema";

// ── Types ─────────────────────────────────────────────────────────────────────

const BINDING_ACTIVATORS = [
  "single", "double", "triple", "long", "down", "up", "turbo", "toggle",
] as const;
type ActivatorType = typeof BINDING_ACTIVATORS[number];

// ── DIK scan codes (DirectInput button IDs for keyboard macros) ───────────────

export const DIK_SCAN: Record<string, number> = {
  DIK_ESCAPE: 1,
  DIK_1: 2, DIK_2: 3, DIK_3: 4, DIK_4: 5, DIK_5: 6,
  DIK_6: 7, DIK_7: 8, DIK_8: 9, DIK_9: 10, DIK_0: 11,
  DIK_MINUS: 12, DIK_EQUALS: 13, DIK_BACK: 14, DIK_TAB: 15,
  DIK_Q: 16, DIK_W: 17, DIK_E: 18, DIK_R: 19, DIK_T: 20,
  DIK_Y: 21, DIK_U: 22, DIK_I: 23, DIK_O: 24, DIK_P: 25,
  DIK_LBRACKET: 26, DIK_RBRACKET: 27, DIK_RETURN: 28, DIK_LCONTROL: 29,
  DIK_A: 30, DIK_S: 31, DIK_D: 32, DIK_F: 33, DIK_G: 34,
  DIK_H: 35, DIK_J: 36, DIK_K: 37, DIK_L: 38,
  DIK_SEMICOLON: 39, DIK_APOSTROPHE: 40, DIK_GRAVE: 41,
  DIK_LSHIFT: 42, DIK_BACKSLASH: 43,
  DIK_Z: 44, DIK_X: 45, DIK_C: 46, DIK_V: 47, DIK_B: 48,
  DIK_N: 49, DIK_M: 50, DIK_COMMA: 51, DIK_PERIOD: 52, DIK_SLASH: 53,
  DIK_RSHIFT: 54, DIK_MULTIPLY: 55, DIK_LMENU: 56, DIK_SPACE: 57,
  DIK_CAPITAL: 58,
  DIK_F1: 59, DIK_F2: 60, DIK_F3: 61, DIK_F4: 62, DIK_F5: 63,
  DIK_F6: 64, DIK_F7: 65, DIK_F8: 66, DIK_F9: 67, DIK_F10: 68,
  DIK_NUMLOCK: 69, DIK_SCROLL: 70,
  DIK_NUMPAD7: 71, DIK_NUMPAD8: 72, DIK_NUMPAD9: 73, DIK_SUBTRACT: 74,
  DIK_NUMPAD4: 75, DIK_NUMPAD5: 76, DIK_NUMPAD6: 77, DIK_ADD: 78,
  DIK_NUMPAD1: 79, DIK_NUMPAD2: 80, DIK_NUMPAD3: 81,
  DIK_NUMPAD0: 82, DIK_DECIMAL: 83,
  DIK_F11: 87, DIK_F12: 88,
  DIK_NUMPADENTER: 156, DIK_RCONTROL: 157, DIK_DIVIDE: 181, DIK_RMENU: 184,
  DIK_PAUSE: 197, DIK_HOME: 199, DIK_UP: 200, DIK_PRIOR: 201,
  DIK_LEFT: 203, DIK_RIGHT: 205, DIK_END: 207, DIK_DOWN: 208,
  DIK_NEXT: 209, DIK_INSERT: 210, DIK_DELETE: 211,
  DIK_LWIN: 219, DIK_RWIN: 220, DIK_APPS: 221,
};

// ── Display name → DIK name (inverse of DIK_NAMES in the parser) ─────────────

export const DISPLAY_TO_DIK: Record<string, string> = {
  "0": "DIK_0", "1": "DIK_1", "2": "DIK_2", "3": "DIK_3", "4": "DIK_4",
  "5": "DIK_5", "6": "DIK_6", "7": "DIK_7", "8": "DIK_8", "9": "DIK_9",
  "A": "DIK_A", "B": "DIK_B", "C": "DIK_C", "D": "DIK_D", "E": "DIK_E",
  "F": "DIK_F", "G": "DIK_G", "H": "DIK_H", "I": "DIK_I", "J": "DIK_J",
  "K": "DIK_K", "L": "DIK_L", "M": "DIK_M", "N": "DIK_N", "O": "DIK_O",
  "P": "DIK_P", "Q": "DIK_Q", "R": "DIK_R", "S": "DIK_S", "T": "DIK_T",
  "U": "DIK_U", "V": "DIK_V", "W": "DIK_W", "X": "DIK_X", "Y": "DIK_Y",
  "Z": "DIK_Z",
  "F1": "DIK_F1", "F2": "DIK_F2", "F3": "DIK_F3", "F4": "DIK_F4",
  "F5": "DIK_F5", "F6": "DIK_F6", "F7": "DIK_F7", "F8": "DIK_F8",
  "F9": "DIK_F9", "F10": "DIK_F10", "F11": "DIK_F11", "F12": "DIK_F12",
  "Ctrl": "DIK_LCONTROL", "Shift": "DIK_LSHIFT",
  "Alt": "DIK_LMENU", "Win": "DIK_LWIN",
  "Esc": "DIK_ESCAPE", "Enter": "DIK_RETURN", "Space": "DIK_SPACE",
  "Tab": "DIK_TAB", "Backspace": "DIK_BACK", "Del": "DIK_DELETE",
  "Home": "DIK_HOME", "End": "DIK_END", "Ins": "DIK_INSERT",
  "PgUp": "DIK_PRIOR", "PgDn": "DIK_NEXT",
  "↑": "DIK_UP", "↓": "DIK_DOWN", "←": "DIK_LEFT", "→": "DIK_RIGHT",
  "`": "DIK_GRAVE", "-": "DIK_MINUS", "=": "DIK_EQUALS",
  "[": "DIK_LBRACKET", "]": "DIK_RBRACKET",
  ";": "DIK_SEMICOLON", "'": "DIK_APOSTROPHE",
  "\\": "DIK_BACKSLASH", ",": "DIK_COMMA", ".": "DIK_PERIOD", "/": "DIK_SLASH",
  "+": "DIK_ADD", "Num-": "DIK_SUBTRACT", "Num*": "DIK_MULTIPLY",
  "Num/": "DIK_DIVIDE", "Num.": "DIK_DECIMAL",
  "NumLock": "DIK_NUMLOCK", "NumEnter": "DIK_NUMPADENTER",
  "Num0": "DIK_NUMPAD0", "Num1": "DIK_NUMPAD1", "Num2": "DIK_NUMPAD2",
  "Num3": "DIK_NUMPAD3", "Num4": "DIK_NUMPAD4", "Num5": "DIK_NUMPAD5",
  "Num6": "DIK_NUMPAD6", "Num7": "DIK_NUMPAD7", "Num8": "DIK_NUMPAD8",
  "Num9": "DIK_NUMPAD9",
  "CapsLock": "DIK_CAPITAL", "ScrollLock": "DIK_SCROLL",
  "Pause": "DIK_PAUSE", "Menu": "DIK_APPS",
};

// ── Reverse button maps (inverse of CYBORG_BTN / CYRO_BTN in the parser) ─────
// Azeron button number (string) → reWASD buttonId (number)

export const CYBORG_BTN_INV: Record<string, number> = {
  "1": 1,  "2": 5,  "3": 13, "4": 17, "5": 2,  "6": 6,
  "7": 14, "8": 18, "9": 3,  "10": 7, "11": 15, "12": 19,
  "13": 26, "14": 4, "15": 8, "16": 16, "17": 20, "18": 27,
  "19": 12, "20": 11, "22": 10, "23": 9,
  "28": 33, "29": 35, "30": 34, "31": 36,
  "36": 23, "37": 24, "38": 25, "41": 28,
};

export const CYRO_BTN_INV: Record<string, number> = {
  "1": 20, "2": 19, "3": 18, "4": 17, "5": 16, "6": 15,
  "7": 14, "8": 13, "9": 8,  "10": 7, "11": 6,  "12": 5,
  "14": 4, "15": 3, "16": 2, "17": 1,
  "20": 10, "22": 9,
  "28": 33, "29": 35, "30": 34, "31": 36,
};

// ── Mouse helpers ─────────────────────────────────────────────────────────────

const MOUSE_BTN: Record<string, number> = {
  LClick: 1, RClick: 2, MClick: 3, Mouse4: 4, Mouse5: 5,
};

const MOUSE_DIR: Record<string, string> = {
  "Mouse Left": "left", "Mouse Right": "right",
  "Mouse Up": "up",    "Mouse Down": "down",
};

const WHEEL_DIR: Record<string, string> = {
  "Wheel Up": "up",   "Wheel Down": "down",
  "Wheel Left": "left", "Wheel Right": "right",
};

// ── bindingToMacros ───────────────────────────────────────────────────────────

export function bindingToMacros(binding: string): RewasdMacroItem[] {
  if (!binding || binding.startsWith("→ ")) return [];

  if (binding in MOUSE_BTN)
    return [{ mouse: { buttonId: MOUSE_BTN[binding] } }];

  if (binding in MOUSE_DIR)
    return [{ mouse: { direction: MOUSE_DIR[binding] as "left" | "right" | "up" | "down" } }];

  if (binding in WHEEL_DIR)
    return [{ mouse: { wheel: WHEEL_DIR[binding] as "up" | "down" | "left" | "right" } }];

  // Numpad plus is "+" which is also the combo separator — handle as sole key.
  if (binding === "+") {
    const scanCode = DIK_SCAN["DIK_ADD"];
    return [{ keyboard: { buttonId: scanCode, description: "DIK_ADD" } }];
  }

  const parts = binding.split("+");
  const macros: RewasdMacroItem[] = [];
  for (const part of parts) {
    const dikName = DISPLAY_TO_DIK[part];
    if (!dikName) continue;
    const scanCode = DIK_SCAN[dikName];
    if (scanCode === undefined) continue;
    macros.push({ keyboard: { buttonId: scanCode, description: dikName } });
  }
  return macros;
}

// ── activatorToRewasd ─────────────────────────────────────────────────────────

export function activatorToRewasd(type: ActivatorType): RewasdActivator {
  switch (type) {
    case "single": return { type: "single", mode: "hold_until_release" };
    case "double": return { type: "double", mode: "hold_until_release" };
    case "triple": return { type: "triple", mode: "hold_until_release" };
    case "long":   return { type: "long",   mode: "hold_until_release" };
    case "down":   return { type: "start",  mode: "onetime", params: { expert: true } };
    case "up":     return { type: "release", mode: "onetime", params: { expert: true } };
    case "turbo":  return { type: "single", mode: "turbo" };
    case "toggle": return { type: "single", mode: "toggle" };
  }
}

// ── generateRewasd placeholder (added in Task 2) ──────────────────────────────

export function generateRewasd(_profiles: Profile[]): RewasdFile {
  throw new Error("Not implemented");
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/renderer/keybinds/generateRewasd.test.ts
```

Expected: all tests in `CYBORG_BTN_INV`, `CYRO_BTN_INV`, `DIK_SCAN`, `DISPLAY_TO_DIK`, `bindingToMacros`, `activatorToRewasd` pass. The `generateRewasd` describe blocks added in Task 2 don't exist yet so nothing else runs.

- [ ] **Step 5: Lint and typecheck**

```
npm run lint
npx tsc -p tsconfig.web.json --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```
git add src/renderer/keybinds/src/exporters/generateRewasd.ts tests/renderer/keybinds/generateRewasd.test.ts
git commit -m "feat: add reWASD generator data tables and binding/activator helpers"
```

---

## Task 2: generateRewasd — config, devices, masks, default-layer mappings

**Files:**
- Modify: `src/renderer/keybinds/src/exporters/generateRewasd.ts`
- Modify: `tests/renderer/keybinds/generateRewasd.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `tests/renderer/keybinds/generateRewasd.test.ts` (all imports are already at the top of the file from Task 1):

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/renderer/keybinds/generateRewasd.test.ts
```

Expected: `generateRewasd — structure` and `generateRewasd — cyborg+cyro pair` tests throw "Not implemented".

- [ ] **Step 3: Replace the generateRewasd placeholder with the full implementation**

Replace the last function in `src/renderer/keybinds/src/exporters/generateRewasd.ts` (the `generateRewasd` placeholder) with:

```typescript
export function generateRewasd(profiles: Profile[]): RewasdFile {
  const cyborg = profiles.find((p) => p.device === "cyborg");
  const cyro = profiles.find((p) => p.device === "cyro");
  const first = cyborg ?? cyro!;

  // ── devices.hardware ──────────────────────────────────────────────────────
  const hardware: RewasdHardware[] = [];
  if (cyborg) hardware.push({ id: 1, name: "gamepad" });
  if (cyro)   hardware.push({ id: 2, name: "gamepad" });
  hardware.push({ id: 21, name: "keyboard", type: "standard" });
  hardware.push({ id: 33, name: "mouse" });

  // ── Collect named layer keys across all profiles ──────────────────────────
  const allLayerKeys = new Set<string>();
  for (const p of profiles) {
    for (const key of Object.keys(p.layers)) {
      if (key !== "default") allLayerKeys.add(key);
    }
  }

  // ── Shifts (non-radial) ───────────────────────────────────────────────────
  let nextShiftId = 1;
  const layerKeyToShiftId = new Map<string, number>();
  const shifts: RewasdShift[] = [];
  const layerLabels = first.layerLabels ?? {};

  for (const key of allLayerKeys) {
    const id = nextShiftId++;
    layerKeyToShiftId.set(key, id);
    const shift: RewasdShift = { id, type: "default" };
    if (layerLabels[key]) shift.description = layerLabels[key];
    shifts.push(shift);
  }

  // ── Radial menu shifts ────────────────────────────────────────────────────
  const radialMenus = (cyborg ?? cyro)?.radialMenus ?? [];
  const radialMenuShiftIds: number[] = [];
  for (let i = 0; i < radialMenus.length; i++) {
    const id = nextShiftId++;
    radialMenuShiftIds.push(id);
    shifts.push({ id, type: "radialMenu" });
  }

  // ── Masks + mappings (mutable state shared by helpers below) ─────────────
  let nextMaskId = 1;
  const masks: RewasdMask[] = [];
  const mappings: RewasdMapping[] = [];
  const buttonMaskMap = new Map<string, number>();

  function getOrCreateButtonMask(
    deviceId: number,
    azeronBtnId: string,
    btnInv: Record<string, number>,
  ): number | undefined {
    const rewasdBtnId = btnInv[azeronBtnId];
    if (rewasdBtnId === undefined) return undefined;
    const key = `${deviceId}-${azeronBtnId}`;
    if (buttonMaskMap.has(key)) return buttonMaskMap.get(key)!;
    const maskId = nextMaskId++;
    buttonMaskMap.set(key, maskId);
    masks.push({ id: maskId, set: [{ deviceId, buttonId: rewasdBtnId }] });
    return maskId;
  }

  // Pre-allocate button masks for every button in every layer.
  for (const p of profiles) {
    const deviceId = p.device === "cyborg" ? 1 : 2;
    const btnInv = p.device === "cyborg" ? CYBORG_BTN_INV : CYRO_BTN_INV;
    for (const layer of Object.values(p.layers)) {
      if (!layer) continue;
      for (const azeronBtnId of Object.keys(layer)) {
        getOrCreateButtonMask(deviceId, azeronBtnId, btnInv);
      }
    }
  }

  // Pre-allocate trigger button masks for radial menus.
  const radialOwner = cyborg ?? cyro!;
  const radialDeviceId = radialOwner.device === "cyborg" ? 1 : 2;
  const radialBtnInv = radialOwner.device === "cyborg" ? CYBORG_BTN_INV : CYRO_BTN_INV;
  for (const menu of radialMenus) {
    getOrCreateButtonMask(radialDeviceId, menu.trigger, radialBtnInv);
  }

  // ── Layer-switch resolution ───────────────────────────────────────────────

  function layerDisplayName(key: string): string {
    if (key === "shift") return "Shift";
    const m = /^shift-(\d+)$/.exec(key);
    return m ? `Shift ${m[1]}` : key;
  }

  function resolveLayerTarget(binding: string): number | undefined {
    if (!binding.startsWith("→ ")) return undefined;
    const target = binding.slice(2).trim();
    if (target === "Default") return 0;
    for (const [key, label] of Object.entries(layerLabels)) {
      if (label === target) return layerKeyToShiftId.get(key);
    }
    for (const [key, shiftId] of layerKeyToShiftId.entries()) {
      if (layerDisplayName(key) === target) return shiftId;
    }
    return undefined;
  }

  // ── Button mappings ───────────────────────────────────────────────────────

  for (const p of profiles) {
    const deviceId = p.device === "cyborg" ? 1 : 2;
    const btnInv = p.device === "cyborg" ? CYBORG_BTN_INV : CYRO_BTN_INV;

    for (const [layerKey, layer] of Object.entries(p.layers)) {
      if (!layer) continue;
      const shiftId =
        layerKey !== "default" ? layerKeyToShiftId.get(layerKey) : undefined;

      for (const [azeronBtnId, button] of Object.entries(layer)) {
        const maskId = getOrCreateButtonMask(deviceId, azeronBtnId, btnInv);
        if (maskId === undefined) continue;

        for (const activatorType of BINDING_ACTIVATORS) {
          const binding = button.bindings[activatorType];
          if (!binding) continue;

          const condition = {
            ...(shiftId !== undefined ? { shiftId } : {}),
            mask: { id: maskId, activator: activatorToRewasd(activatorType) },
          };

          if (binding.startsWith("→ ")) {
            const targetLayer = resolveLayerTarget(binding);
            if (targetLayer !== undefined) {
              mappings.push({ description: button.label, condition, jumpToLayer: { layer: targetLayer } } as RewasdMappingMask);
            }
          } else {
            const macros = bindingToMacros(binding);
            if (macros.length > 0) {
              mappings.push({ description: button.label, condition, macros } as RewasdMappingMask);
            }
          }
        }
      }
    }
  }

  // ── Radial menus ──────────────────────────────────────────────────────────

  const radialMenuCircles: RewasdCircle[] = [];
  const radialMenuSectors: RewasdSector[] = [];
  let nextCircleId = 1;
  let nextSectorId = 1;

  function hexToRgb(hex: string): [number, number, number] {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }

  function buildCircle(
    menu: RadialMenu,
    parentSectorId: number | undefined,
    radialShiftId: number,
  ): number {
    const circleId = nextCircleId++;
    const sectorIds: number[] = [];

    for (const action of menu.actions) {
      const sectorId = nextSectorId++;
      sectorIds.push(sectorId);

      const sector: RewasdSector = {
        id: sectorId,
        parentCircleId: circleId,
        description: action.label,
        color: hexToRgb(menu.color),
      };

      if (action.submenu) {
        sector.childCircleId = buildCircle(action.submenu, sectorId, radialShiftId);
      } else if (action.binding) {
        const sectorMaskId = nextMaskId++;
        masks.push({ id: sectorMaskId, radialMenuSet: [{ circleId, sectorId }] });

        const sectorCondition = {
          shiftId: radialShiftId,
          mask: { id: sectorMaskId, activator: { type: "single" as const, mode: "hold_until_release" as const } },
        };

        if (action.binding.startsWith("→ ")) {
          const targetLayer = resolveLayerTarget(action.binding);
          if (targetLayer !== undefined) {
            mappings.push({ description: action.label, condition: sectorCondition, jumpToLayer: { layer: targetLayer } } as RewasdMappingMask);
          }
        } else {
          const macros = bindingToMacros(action.binding);
          if (macros.length > 0) {
            mappings.push({ description: action.label, condition: sectorCondition, macros } as RewasdMappingMask);
          }
        }
      }

      radialMenuSectors.push(sector);
    }

    radialMenuCircles.push({
      id: circleId,
      sectors: sectorIds,
      ...(parentSectorId !== undefined ? { parentSectorId } : {}),
    });
    return circleId;
  }

  radialMenus.forEach((menu, i) => {
    const radialShiftId = radialMenuShiftIds[i];
    buildCircle(menu, undefined, radialShiftId);

    const triggerMaskId = buttonMaskMap.get(`${radialDeviceId}-${menu.trigger}`);
    if (triggerMaskId !== undefined) {
      mappings.push({
        description: menu.label,
        condition: {
          mask: { id: triggerMaskId, activator: { type: "single", mode: "hold_until_release" } },
        },
        jumpToLayer: { layer: radialShiftId },
      } as RewasdMappingMask);
    }
  });

  // ── Assemble ──────────────────────────────────────────────────────────────

  return {
    schemaVersion: 3,
    appVersion: "9.3.3",
    config: { appName: first.label },
    devices: { hardware },
    ...(shifts.length > 0 ? { shifts } : {}),
    ...(masks.length > 0 ? { masks } : {}),
    ...(radialMenuCircles.length > 0 ? { radialMenuCircles } : {}),
    ...(radialMenuSectors.length > 0 ? { radialMenuSectors } : {}),
    mappings,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/renderer/keybinds/generateRewasd.test.ts
```

Expected: all tests in `generateRewasd — structure` and `generateRewasd — cyborg+cyro pair` pass.

- [ ] **Step 5: Lint and typecheck**

```
npm run lint
npx tsc -p tsconfig.web.json --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```
git add src/renderer/keybinds/src/exporters/generateRewasd.ts tests/renderer/keybinds/generateRewasd.test.ts
git commit -m "feat: implement generateRewasd core — devices, masks, default-layer mappings"
```

---

## Task 3: Shift layers + layer-switch bindings

**Files:**
- Modify: `tests/renderer/keybinds/generateRewasd.test.ts`

(No changes to `generateRewasd.ts` — shift support is already in the Task 2 implementation.)

- [ ] **Step 1: Add failing tests**

Append to `tests/renderer/keybinds/generateRewasd.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they pass**

```
npx vitest run tests/renderer/keybinds/generateRewasd.test.ts
```

Expected: all new tests pass (shift support was already implemented in Task 2).

- [ ] **Step 3: Commit**

```
git add tests/renderer/keybinds/generateRewasd.test.ts
git commit -m "test: add shift layer and activator coverage for generateRewasd"
```

---

## Task 4: Radial menus

**Files:**
- Modify: `tests/renderer/keybinds/generateRewasd.test.ts`

(No changes to `generateRewasd.ts` — radial menu support is already in the Task 2 implementation.)

- [ ] **Step 1: Add failing tests**

Append to `tests/renderer/keybinds/generateRewasd.test.ts`:

```typescript
import { parseRewasd } from "../../../src/renderer/keybinds/src/importers/parseRewasd";

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
          { label: "Up",   direction: "↑", binding: "A" },
          { label: "Down", direction: "↓", binding: "B" },
          { label: "Left", direction: "←", binding: "C" },
          { label: "Right",direction: "→", binding: "D" },
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
    const rootCircle = file.radialMenuCircles?.[0];
    const subSector = file.radialMenuSectors?.find((s) => s.description === "Sub");
    expect(subSector?.childCircleId).toBeDefined();
    expect(rootCircle?.id).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

```
npx vitest run tests/renderer/keybinds/generateRewasd.test.ts
```

Expected: all new radial menu tests pass.

- [ ] **Step 3: Commit**

```
git add tests/renderer/keybinds/generateRewasd.test.ts
git commit -m "test: add radial menu coverage for generateRewasd"
```

---

## Task 5: Round-trip integration tests

**Files:**
- Modify: `tests/renderer/keybinds/generateRewasd.test.ts`

- [ ] **Step 1: Add round-trip tests**

Append to `tests/renderer/keybinds/generateRewasd.test.ts` (all imports are already at the top from Task 1):

```typescript
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
```

- [ ] **Step 2: Run all tests**

```
npx vitest run tests/renderer/keybinds/generateRewasd.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```
git add tests/renderer/keybinds/generateRewasd.test.ts
git commit -m "test: add round-trip integration tests for generateRewasd"
```

---

## Task 6: Export button in App.tsx

**Files:**
- Modify: `src/renderer/keybinds/src/App.tsx`

- [ ] **Step 1: Add import**

In `src/renderer/keybinds/src/App.tsx`, add to the existing import block at the top of the file:

```typescript
import { generateRewasd } from "./exporters/generateRewasd";
```

- [ ] **Step 2: Add handleExport function**

In `src/renderer/keybinds/src/App.tsx`, insert `handleExport` after `handleButtonSave` (around line 193) and before the `const isImportedTab` line:

```typescript
function handleExport(): void {
  const exportProfiles: Profile[] = [];
  if (activeTab < PROFILE_PAIRS.length) {
    const pair = PROFILE_PAIRS[activeTab];
    const c = resolveProfile(pair.cyborgId);
    const cr = resolveProfile(pair.cyroId);
    if (c) exportProfiles.push(c);
    if (cr) exportProfiles.push(cr);
  } else {
    const group = importedGroups[activeTab - PROFILE_PAIRS.length];
    if (group) {
      const cb = group.find((p) => p.device === "cyborg");
      const cr = group.find((p) => p.device === "cyro");
      if (cb) exportProfiles.push(cb);
      if (cr) exportProfiles.push(cr);
    }
  }
  if (exportProfiles.length === 0) return;

  const file = generateRewasd(exportProfiles);
  const json = JSON.stringify(file, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${exportProfiles[0].label}.rewasd`;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 3: Add Export button to JSX**

In the `return` block, locate the existing Import button:

```tsx
<button
  className="tab tab-import"
  onClick={() => fileInputRef.current?.click()}
>
  + Import
</button>
```

Add the Export button immediately after it:

```tsx
<button className="tab tab-export" onClick={handleExport}>
  ↓ Export
</button>
```

- [ ] **Step 4: Lint and typecheck**

```
npm run lint
npx tsc -p tsconfig.web.json --noEmit
```

Expected: no errors.

- [ ] **Step 5: Run the full test suite**

```
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```
git add src/renderer/keybinds/src/App.tsx
git commit -m "feat: add Export button to keybinds dashboard"
```
