import type { Profile, RadialMenu } from "../data/types";
import type {
  RewasdFile,
  RewasdHardware,
  RewasdShift,
  RewasdMask,
  RewasdMapping,
  RewasdConditionMask,
  RewasdMacroItem,
  RewasdActivator,
  RewasdCircle,
  RewasdSector,
} from "../importers/rewasdSchema";

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

export function generateRewasd(profiles: Profile[]): RewasdFile {
  if (profiles.length === 0)
    throw new Error("generateRewasd requires at least one profile");
  const cyborg = profiles.find((p) => p.device === "cyborg");
  const cyro = profiles.find((p) => p.device === "cyro");
  const first = cyborg ?? cyro!;

  const hardware: RewasdHardware[] = [];
  if (cyborg) hardware.push({ id: 1, name: "gamepad" });
  if (cyro) hardware.push({ id: 2, name: "gamepad" });
  hardware.push({ id: 21, name: "keyboard", type: "standard" });
  hardware.push({ id: 33, name: "mouse" });

  const allLayerKeys = new Set<string>();
  for (const p of profiles) {
    for (const key of Object.keys(p.layers)) {
      if (key !== "default") allLayerKeys.add(key);
    }
  }

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

  const radialMenus = (cyborg ?? cyro)?.radialMenus ?? [];
  const radialMenuShiftIds: number[] = [];
  for (let i = 0; i < radialMenus.length; i++) {
    const id = nextShiftId++;
    radialMenuShiftIds.push(id);
    shifts.push({ id, type: "radialMenu" });
  }

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
  const radialBtnInv =
    radialOwner.device === "cyborg" ? CYBORG_BTN_INV : CYRO_BTN_INV;
  for (const menu of radialMenus) {
    getOrCreateButtonMask(radialDeviceId, menu.trigger, radialBtnInv);
  }

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

          const condition: RewasdConditionMask = {
            ...(shiftId !== undefined ? { shiftId } : {}),
            mask: { id: maskId, activator: activatorToRewasd(activatorType) },
          };

          if (binding.startsWith("→ ")) {
            const targetLayer = resolveLayerTarget(binding);
            if (targetLayer !== undefined) {
              mappings.push({
                description: button.label,
                condition,
                jumpToLayer: { layer: targetLayer },
              });
            }
          } else {
            const macros = bindingToMacros(binding);
            if (macros.length > 0) {
              mappings.push({
                description: button.label,
                condition,
                macros,
              });
            }
          }
        }
      }
    }
  }

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

    // Push parent before recursing so it appears before child circles in the array.
    radialMenuCircles.push({
      id: circleId,
      sectors: sectorIds,
      ...(parentSectorId !== undefined ? { parentSectorId } : {}),
    });

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
        sector.childCircleId = buildCircle(
          action.submenu,
          sectorId,
          radialShiftId,
        );
      } else if (action.binding) {
        const sectorMaskId = nextMaskId++;
        masks.push({
          id: sectorMaskId,
          radialMenuSet: [{ circleId, sectorId }],
        });

        const sectorCondition: RewasdConditionMask = {
          shiftId: radialShiftId,
          mask: {
            id: sectorMaskId,
            activator: {
              type: "single",
              mode: "hold_until_release",
            },
          },
        };

        if (action.binding.startsWith("→ ")) {
          const targetLayer = resolveLayerTarget(action.binding);
          if (targetLayer !== undefined) {
            mappings.push({
              description: action.label,
              condition: sectorCondition,
              jumpToLayer: { layer: targetLayer },
            });
          }
        } else {
          const macros = bindingToMacros(action.binding);
          if (macros.length > 0) {
            mappings.push({
              description: action.label,
              condition: sectorCondition,
              macros,
            });
          }
        }
      }

      radialMenuSectors.push(sector);
    }

    return circleId;
  }

  radialMenus.forEach((menu, i) => {
    const radialShiftId = radialMenuShiftIds[i];
    buildCircle(menu, undefined, radialShiftId);

    const triggerMaskId = buttonMaskMap.get(
      `${radialDeviceId}-${menu.trigger}`,
    );
    if (triggerMaskId !== undefined) {
      mappings.push({
        description: menu.label,
        condition: {
          mask: {
            id: triggerMaskId,
            activator: { type: "single", mode: "hold_until_release" },
          },
        },
        jumpToLayer: { layer: radialShiftId },
      });
    }
  });

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
