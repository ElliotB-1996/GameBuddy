import type { Profile } from "../data/types";
import type {
  RewasdFile,
  RewasdMacroItem,
  RewasdActivator,
} from "../importers/rewasdSchema";

// ── Types ─────────────────────────────────────────────────────────────────────

export const BINDING_ACTIVATORS = [
  "single",
  "double",
  "triple",
  "long",
  "down",
  "up",
  "turbo",
  "toggle",
] as const;
type ActivatorType = (typeof BINDING_ACTIVATORS)[number];

// ── DIK scan codes (DirectInput button IDs for keyboard macros) ───────────────

export const DIK_SCAN: Record<string, number> = {
  DIK_ESCAPE: 1,
  DIK_1: 2,
  DIK_2: 3,
  DIK_3: 4,
  DIK_4: 5,
  DIK_5: 6,
  DIK_6: 7,
  DIK_7: 8,
  DIK_8: 9,
  DIK_9: 10,
  DIK_0: 11,
  DIK_MINUS: 12,
  DIK_EQUALS: 13,
  DIK_BACK: 14,
  DIK_TAB: 15,
  DIK_Q: 16,
  DIK_W: 17,
  DIK_E: 18,
  DIK_R: 19,
  DIK_T: 20,
  DIK_Y: 21,
  DIK_U: 22,
  DIK_I: 23,
  DIK_O: 24,
  DIK_P: 25,
  DIK_LBRACKET: 26,
  DIK_RBRACKET: 27,
  DIK_RETURN: 28,
  DIK_LCONTROL: 29,
  DIK_A: 30,
  DIK_S: 31,
  DIK_D: 32,
  DIK_F: 33,
  DIK_G: 34,
  DIK_H: 35,
  DIK_J: 36,
  DIK_K: 37,
  DIK_L: 38,
  DIK_SEMICOLON: 39,
  DIK_APOSTROPHE: 40,
  DIK_GRAVE: 41,
  DIK_LSHIFT: 42,
  DIK_BACKSLASH: 43,
  DIK_Z: 44,
  DIK_X: 45,
  DIK_C: 46,
  DIK_V: 47,
  DIK_B: 48,
  DIK_N: 49,
  DIK_M: 50,
  DIK_COMMA: 51,
  DIK_PERIOD: 52,
  DIK_SLASH: 53,
  DIK_RSHIFT: 54,
  DIK_MULTIPLY: 55,
  DIK_LMENU: 56,
  DIK_SPACE: 57,
  DIK_CAPITAL: 58,
  DIK_F1: 59,
  DIK_F2: 60,
  DIK_F3: 61,
  DIK_F4: 62,
  DIK_F5: 63,
  DIK_F6: 64,
  DIK_F7: 65,
  DIK_F8: 66,
  DIK_F9: 67,
  DIK_F10: 68,
  DIK_NUMLOCK: 69,
  DIK_SCROLL: 70,
  DIK_NUMPAD7: 71,
  DIK_NUMPAD8: 72,
  DIK_NUMPAD9: 73,
  DIK_SUBTRACT: 74,
  DIK_NUMPAD4: 75,
  DIK_NUMPAD5: 76,
  DIK_NUMPAD6: 77,
  DIK_ADD: 78,
  DIK_NUMPAD1: 79,
  DIK_NUMPAD2: 80,
  DIK_NUMPAD3: 81,
  DIK_NUMPAD0: 82,
  DIK_DECIMAL: 83,
  DIK_F11: 87,
  DIK_F12: 88,
  DIK_NUMPADENTER: 156,
  DIK_RCONTROL: 157,
  DIK_DIVIDE: 181,
  DIK_RMENU: 184,
  DIK_PAUSE: 197,
  DIK_HOME: 199,
  DIK_UP: 200,
  DIK_PRIOR: 201,
  DIK_LEFT: 203,
  DIK_RIGHT: 205,
  DIK_END: 207,
  DIK_DOWN: 208,
  DIK_NEXT: 209,
  DIK_INSERT: 210,
  DIK_DELETE: 211,
  DIK_LWIN: 219,
  DIK_RWIN: 220,
  DIK_APPS: 221,
};

// ── Display name → DIK name (inverse of DIK_NAMES in the parser) ─────────────

export const DISPLAY_TO_DIK: Record<string, string> = {
  "0": "DIK_0",
  "1": "DIK_1",
  "2": "DIK_2",
  "3": "DIK_3",
  "4": "DIK_4",
  "5": "DIK_5",
  "6": "DIK_6",
  "7": "DIK_7",
  "8": "DIK_8",
  "9": "DIK_9",
  A: "DIK_A",
  B: "DIK_B",
  C: "DIK_C",
  D: "DIK_D",
  E: "DIK_E",
  F: "DIK_F",
  G: "DIK_G",
  H: "DIK_H",
  I: "DIK_I",
  J: "DIK_J",
  K: "DIK_K",
  L: "DIK_L",
  M: "DIK_M",
  N: "DIK_N",
  O: "DIK_O",
  P: "DIK_P",
  Q: "DIK_Q",
  R: "DIK_R",
  S: "DIK_S",
  T: "DIK_T",
  U: "DIK_U",
  V: "DIK_V",
  W: "DIK_W",
  X: "DIK_X",
  Y: "DIK_Y",
  Z: "DIK_Z",
  F1: "DIK_F1",
  F2: "DIK_F2",
  F3: "DIK_F3",
  F4: "DIK_F4",
  F5: "DIK_F5",
  F6: "DIK_F6",
  F7: "DIK_F7",
  F8: "DIK_F8",
  F9: "DIK_F9",
  F10: "DIK_F10",
  F11: "DIK_F11",
  F12: "DIK_F12",
  Ctrl: "DIK_LCONTROL",
  Shift: "DIK_LSHIFT",
  Alt: "DIK_LMENU",
  Win: "DIK_LWIN",
  Esc: "DIK_ESCAPE",
  Enter: "DIK_RETURN",
  Space: "DIK_SPACE",
  Tab: "DIK_TAB",
  Backspace: "DIK_BACK",
  Del: "DIK_DELETE",
  Home: "DIK_HOME",
  End: "DIK_END",
  Ins: "DIK_INSERT",
  PgUp: "DIK_PRIOR",
  PgDn: "DIK_NEXT",
  "↑": "DIK_UP",
  "↓": "DIK_DOWN",
  "←": "DIK_LEFT",
  "→": "DIK_RIGHT",
  "`": "DIK_GRAVE",
  "-": "DIK_MINUS",
  "=": "DIK_EQUALS",
  "[": "DIK_LBRACKET",
  "]": "DIK_RBRACKET",
  ";": "DIK_SEMICOLON",
  "'": "DIK_APOSTROPHE",
  "\\": "DIK_BACKSLASH",
  ",": "DIK_COMMA",
  ".": "DIK_PERIOD",
  "/": "DIK_SLASH",
  "+": "DIK_ADD",
  "Num-": "DIK_SUBTRACT",
  "Num*": "DIK_MULTIPLY",
  "Num/": "DIK_DIVIDE",
  "Num.": "DIK_DECIMAL",
  NumLock: "DIK_NUMLOCK",
  NumEnter: "DIK_NUMPADENTER",
  Num0: "DIK_NUMPAD0",
  Num1: "DIK_NUMPAD1",
  Num2: "DIK_NUMPAD2",
  Num3: "DIK_NUMPAD3",
  Num4: "DIK_NUMPAD4",
  Num5: "DIK_NUMPAD5",
  Num6: "DIK_NUMPAD6",
  Num7: "DIK_NUMPAD7",
  Num8: "DIK_NUMPAD8",
  Num9: "DIK_NUMPAD9",
  CapsLock: "DIK_CAPITAL",
  ScrollLock: "DIK_SCROLL",
  Pause: "DIK_PAUSE",
  Menu: "DIK_APPS",
};

// ── Reverse button maps (inverse of CYBORG_BTN / CYRO_BTN in the parser) ─────
// Azeron button number (string) → reWASD buttonId (number)

export const CYBORG_BTN_INV: Record<string, number> = {
  "1": 1,
  "2": 5,
  "3": 13,
  "4": 17,
  "5": 2,
  "6": 6,
  "7": 14,
  "8": 18,
  "9": 3,
  "10": 7,
  "11": 15,
  "12": 19,
  "13": 26,
  "14": 4,
  "15": 8,
  "16": 16,
  "17": 20,
  "18": 27,
  "19": 12,
  "20": 11,
  "22": 10,
  "23": 9,
  "28": 33,
  "29": 35,
  "30": 34,
  "31": 36,
  "36": 23,
  "37": 24,
  "38": 25,
  "41": 28,
};

export const CYRO_BTN_INV: Record<string, number> = {
  "1": 20,
  "2": 19,
  "3": 18,
  "4": 17,
  "5": 16,
  "6": 15,
  "7": 14,
  "8": 13,
  "9": 8,
  "10": 7,
  "11": 6,
  "12": 5,
  "14": 4,
  "15": 3,
  "16": 2,
  "17": 1,
  "20": 10,
  "22": 9,
  "28": 33,
  "29": 35,
  "30": 34,
  "31": 36,
};

// ── Mouse helpers ─────────────────────────────────────────────────────────────

const MOUSE_BTN: Record<string, number> = {
  LClick: 1,
  RClick: 2,
  MClick: 3,
  Mouse4: 4,
  Mouse5: 5,
};

const MOUSE_DIR: Record<string, string> = {
  "Mouse Left": "left",
  "Mouse Right": "right",
  "Mouse Up": "up",
  "Mouse Down": "down",
};

const WHEEL_DIR: Record<string, string> = {
  "Wheel Up": "up",
  "Wheel Down": "down",
  "Wheel Left": "left",
  "Wheel Right": "right",
};

// ── bindingToMacros ───────────────────────────────────────────────────────────

export function bindingToMacros(binding: string): RewasdMacroItem[] {
  if (!binding || binding.startsWith("→ ")) return [];

  if (binding in MOUSE_BTN)
    return [{ mouse: { buttonId: MOUSE_BTN[binding] } }];

  if (binding in MOUSE_DIR)
    return [
      {
        mouse: {
          direction: MOUSE_DIR[binding] as "left" | "right" | "up" | "down",
        },
      },
    ];

  if (binding in WHEEL_DIR)
    return [
      {
        mouse: {
          wheel: WHEEL_DIR[binding] as "up" | "down" | "left" | "right",
        },
      },
    ];

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
    case "single":
      return { type: "single", mode: "hold_until_release" };
    case "double":
      return { type: "double", mode: "hold_until_release" };
    case "triple":
      return { type: "triple", mode: "hold_until_release" };
    case "long":
      return { type: "long", mode: "hold_until_release" };
    case "down":
      return { type: "start", mode: "onetime", params: { expert: true } };
    case "up":
      return { type: "release", mode: "onetime", params: { expert: true } };
    case "turbo":
      return { type: "single", mode: "turbo" };
    case "toggle":
      return { type: "single", mode: "toggle" };
  }
}

// ── generateRewasd placeholder (added in Task 2) ──────────────────────────────

export function generateRewasd(_profiles: Profile[]): RewasdFile {
  throw new Error("Not implemented");
}
