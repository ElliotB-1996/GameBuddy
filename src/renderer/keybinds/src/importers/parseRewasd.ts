import type {
  Profile,
  Layer,
  Device,
  RadialMenu,
  RadialAction,
} from "../data/types";
import { ParseError } from "./errors";

// ── reWASD file schema types ──────────────────────────────────────────────────

interface RewasdHardware {
  id: number;
  name: string;
  groupId?: number;
}

interface RewasdMacroItem {
  keyboard?: { buttonId: number; description: string; action?: string };
  mouse?: { buttonId: number };
  command?: { id: number };
}

interface RewasdMaskSet {
  deviceId: number;
  buttonId: number;
  description?: string;
}

interface RewasdMask {
  id: number;
  set?: RewasdMaskSet[];
  radialMenuSet?: Array<{ circleId: number; sectorId: number }>;
}

interface RewasdSector {
  id: number;
  parentCircleId: number;
  childCircleId?: number;
  description?: string;
  color?: [number, number, number];
}

interface RewasdCircle {
  id: number;
  parentSectorId?: number;
  sectors: number[];
}

interface RewasdShift {
  id: number;
  type: string;
  description?: string;
}

interface RewasdMapping {
  description?: string;
  condition?: {
    shiftId?: number;
    mask?: { id: number; activator?: { type?: string } };
  };
  jumpToLayer?: { layer: number };
  macros?: RewasdMacroItem[];
}

interface RewasdFile {
  config: { appName: string };
  mappings: RewasdMapping[];
  devices?: { hardware: RewasdHardware[] };
  radialMenuCircles?: RewasdCircle[];
  radialMenuSectors?: RewasdSector[];
  shifts?: RewasdShift[];
  masks?: RewasdMask[];
}

function isRewasdFile(json: unknown): json is RewasdFile {
  return (
    typeof json === "object" &&
    json !== null &&
    "config" in json &&
    "mappings" in json &&
    Array.isArray((json as RewasdFile).mappings)
  );
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

const PREFIX_RE = /^(Cyborg|Cyro)\s+#(\d+)\s+-\s+(.+)$/i;
const COMBO_RE = /((?:(?:Ctrl|Shift|Alt|Win)\+)+\S+|F\d+)$/i;

const DIK_NAMES: Record<string, string> = {
  DIK_0: "0",
  DIK_1: "1",
  DIK_2: "2",
  DIK_3: "3",
  DIK_4: "4",
  DIK_5: "5",
  DIK_6: "6",
  DIK_7: "7",
  DIK_8: "8",
  DIK_9: "9",
  DIK_A: "A",
  DIK_B: "B",
  DIK_C: "C",
  DIK_D: "D",
  DIK_E: "E",
  DIK_F: "F",
  DIK_G: "G",
  DIK_H: "H",
  DIK_I: "I",
  DIK_J: "J",
  DIK_K: "K",
  DIK_L: "L",
  DIK_M: "M",
  DIK_N: "N",
  DIK_O: "O",
  DIK_P: "P",
  DIK_Q: "Q",
  DIK_R: "R",
  DIK_S: "S",
  DIK_T: "T",
  DIK_U: "U",
  DIK_V: "V",
  DIK_W: "W",
  DIK_X: "X",
  DIK_Y: "Y",
  DIK_Z: "Z",
  DIK_F1: "F1",
  DIK_F2: "F2",
  DIK_F3: "F3",
  DIK_F4: "F4",
  DIK_F5: "F5",
  DIK_F6: "F6",
  DIK_F7: "F7",
  DIK_F8: "F8",
  DIK_F9: "F9",
  DIK_F10: "F10",
  DIK_F11: "F11",
  DIK_F12: "F12",
  DIK_LCONTROL: "Ctrl",
  DIK_RCONTROL: "Ctrl",
  DIK_LSHIFT: "Shift",
  DIK_RSHIFT: "Shift",
  DIK_LMENU: "Alt",
  DIK_RMENU: "Alt",
  DIK_LWIN: "Win",
  DIK_RWIN: "Win",
  DIK_ESCAPE: "Esc",
  DIK_RETURN: "Enter",
  DIK_SPACE: "Space",
  DIK_TAB: "Tab",
  DIK_BACK: "Backspace",
  DIK_DELETE: "Del",
  DIK_HOME: "Home",
  DIK_END: "End",
  DIK_INSERT: "Ins",
  DIK_PRIOR: "PgUp",
  DIK_NEXT: "PgDn",
  DIK_UP: "↑",
  DIK_DOWN: "↓",
  DIK_LEFT: "←",
  DIK_RIGHT: "→",
  DIK_GRAVE: "`",
  DIK_MINUS: "-",
  DIK_EQUALS: "=",
  DIK_LBRACKET: "[",
  DIK_RBRACKET: "]",
  DIK_SEMICOLON: ";",
  DIK_APOSTROPHE: "'",
  DIK_BACKSLASH: "\\",
  DIK_COMMA: ",",
  DIK_PERIOD: ".",
  DIK_SLASH: "/",
  DIK_ADD: "+",
  DIK_SUBTRACT: "Num-",
  DIK_MULTIPLY: "Num*",
  DIK_DIVIDE: "Num/",
  DIK_DECIMAL: "Num.",
  DIK_NUMLOCK: "NumLock",
  DIK_NUMPADENTER: "NumEnter",
  DIK_NUMPAD0: "Num0",
  DIK_NUMPAD1: "Num1",
  DIK_NUMPAD2: "Num2",
  DIK_NUMPAD3: "Num3",
  DIK_NUMPAD4: "Num4",
  DIK_NUMPAD5: "Num5",
  DIK_NUMPAD6: "Num6",
  DIK_NUMPAD7: "Num7",
  DIK_NUMPAD8: "Num8",
  DIK_NUMPAD9: "Num9",
  DIK_CAPITAL: "CapsLock",
  DIK_SCROLL: "ScrollLock",
  DIK_PAUSE: "Pause",
  DIK_APPS: "Menu",
};

function dikToKey(dik: string): string {
  return DIK_NAMES[dik] ?? dik.replace(/^DIK_/, "");
}

const MODIFIER_KEYS = new Set(["Ctrl", "Shift", "Alt", "Win"]);

const MOUSE_NAMES: Record<number, string> = {
  1: "LClick",
  2: "RClick",
  3: "MClick",
  4: "Mouse4",
  5: "Mouse5",
};

function macrosToBinding(macros: RewasdMacroItem[]): string | undefined {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const m of macros) {
    let key: string | undefined;
    if (m.keyboard) {
      key = dikToKey(m.keyboard.description);
    } else if (m.mouse) {
      key = MOUSE_NAMES[m.mouse.buttonId] ?? `Mouse${m.mouse.buttonId}`;
    }
    if (key && !seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  if (keys.length === 0) return undefined;
  const mods = keys.filter((k) => MODIFIER_KEYS.has(k));
  const rest = keys.filter((k) => !MODIFIER_KEYS.has(k));
  return [...mods, ...rest].join("+") || undefined;
}

// ── reWASD → Azeron button ID translation ────────────────────────────────────
// reWASD assigns its own button IDs that differ from Azeron's numbering.

const CYBORG_BTN: Record<number, string> = {
  1: "1",
  5: "2",
  13: "3",
  17: "4",
  2: "5",
  6: "6",
  14: "7",
  18: "8",
  3: "9",
  7: "10",
  15: "11",
  19: "12",
  26: "13",
  4: "14",
  8: "15",
  16: "16",
  20: "17",
  27: "18",
  12: "19",
  11: "20",
  10: "22",
  9: "23",
  33: "28",
  35: "29",
  34: "30",
  36: "31",
  23: "36",
  24: "37",
  25: "38",
  28: "41",
};

const CYRO_BTN: Record<number, string> = {
  20: "1",
  19: "2",
  18: "3",
  17: "4",
  16: "5",
  15: "6",
  14: "7",
  13: "8",
  8: "9",
  7: "10",
  6: "11",
  5: "12",
  4: "14",
  3: "15",
  2: "16",
  1: "17",
  10: "20",
  9: "22",
  33: "28",
  35: "29",
  34: "30",
  36: "31",
};

function toAzeronId(device: Device, rewasdButtonId: number): string {
  const map = device === "cyborg" ? CYBORG_BTN : CYRO_BTN;
  return map[rewasdButtonId] ?? String(rewasdButtonId);
}

// ── Radial menu parsing ───────────────────────────────────────────────────────

const DIRS_4: RadialAction["direction"][] = ["↑", "→", "↓", "←"];
const DIRS_8: RadialAction["direction"][] = [
  "↑",
  "↗",
  "→",
  "↘",
  "↓",
  "↙",
  "←",
  "↖",
];

function getDirections(count: number): RadialAction["direction"][] {
  if (count === 4) return DIRS_4;
  if (count === 8) return DIRS_8;
  return DIRS_8.slice(0, Math.min(count, 8)) as RadialAction["direction"][];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function parseRadialMenus(
  file: RewasdFile,
  physicalMasks: Map<number, RewasdMaskSet>,
  deviceIdToDevice: Map<number, Device>,
): RadialMenu[] {
  const circles = file.radialMenuCircles ?? [];
  const sectors = file.radialMenuSectors ?? [];
  const shifts = file.shifts ?? [];
  const masks = file.masks ?? [];

  if (circles.length === 0) return [];

  const radialShiftIds = new Set(
    shifts.filter((s) => s.type === "radialMenu").map((s) => s.id),
  );
  if (radialShiftIds.size === 0) return [];

  const virtualMasks = masks.filter(
    (m) => m.radialMenuSet && m.radialMenuSet.length > 0,
  );

  const sectorToMaskId = new Map<number, number>();
  for (const vm of virtualMasks) {
    for (const entry of vm.radialMenuSet!) {
      sectorToMaskId.set(entry.sectorId, vm.id);
    }
  }

  const maskToLabel = new Map<number, string>();
  for (const m of file.mappings) {
    if (!m.condition?.shiftId || !radialShiftIds.has(m.condition.shiftId))
      continue;
    if (!m.description || !m.condition.mask) continue;
    const maskId = m.condition.mask.id;
    if (!virtualMasks.some((vm) => vm.id === maskId)) continue;
    maskToLabel.set(maskId, m.description);
  }

  const sectorById = new Map(sectors.map((s) => [s.id, s]));
  const circleById = new Map(circles.map((c) => [c.id, c]));

  function buildActions(circleId: number): RadialAction[] {
    const circle = circleById.get(circleId);
    if (!circle) return [];
    const dirs = getDirections(circle.sectors.length);
    const actions: RadialAction[] = [];

    circle.sectors.forEach((sectorId, i) => {
      const sector = sectorById.get(sectorId);
      if (!sector) return;
      const direction = dirs[i % dirs.length];

      if (sector.childCircleId) {
        const subActions = buildActions(sector.childCircleId);
        const subCircle = circleById.get(sector.childCircleId);
        const firstColor = subCircle?.sectors
          .map((sid) => sectorById.get(sid)?.color)
          .find(Boolean);
        const submenu: RadialMenu = {
          id: `circle-${sector.childCircleId}`,
          label: sector.description ?? "Submenu",
          trigger: String(sectorId),
          color: firstColor ? rgbToHex(firstColor) : "#4c1d95",
          actions: subActions,
        };
        actions.push({
          label: sector.description ?? "Submenu",
          direction,
          submenu,
        });
        return;
      }

      const maskId = sectorToMaskId.get(sectorId);
      if (maskId === undefined) return;
      const label = maskToLabel.get(maskId);
      if (!label) return;
      actions.push({ label, direction });
    });

    return actions;
  }

  const triggers = file.mappings.filter(
    (m) => m.jumpToLayer && radialShiftIds.has(m.jumpToLayer.layer),
  );
  const rootCircles = circles.filter((c) => !c.parentSectorId);

  return triggers.flatMap((trigger, i) => {
    const rootCircle = rootCircles[i];
    if (!rootCircle) return [];

    let label = "Radial Menu";
    let triggerBtn = "?";

    const prefixMatch = PREFIX_RE.exec(trigger.description ?? "");
    if (prefixMatch) {
      const [, , btnId, rest] = prefixMatch;
      label = rest.replace(/\s*Trigger\s*$/i, "").trim() || rest.trim();
      triggerBtn = btnId;
    } else {
      if (trigger.description) {
        label =
          trigger.description.replace(/\s*Trigger\s*$/i, "").trim() ||
          trigger.description;
      }
      const maskId = trigger.condition?.mask?.id;
      if (maskId !== undefined) {
        const entry = physicalMasks.get(maskId);
        if (entry) {
          const device = deviceIdToDevice.get(entry.deviceId);
          triggerBtn = device
            ? toAzeronId(device, entry.buttonId)
            : String(entry.buttonId);
        }
      }
    }

    const firstColor = rootCircle.sectors
      .map((sid) => sectorById.get(sid)?.color)
      .find(Boolean);

    const menu: RadialMenu = {
      id: `radial-${trigger.jumpToLayer!.layer}`,
      label,
      trigger: triggerBtn,
      color: firstColor ? rgbToHex(firstColor) : "#4c1d95",
      actions: buildActions(rootCircle.id),
    };
    return [menu];
  });
}

// ── Main parser ───────────────────────────────────────────────────────────────

type ActivatorType = "single" | "long" | "double";

function shiftLayerDisplayName(key: string): string {
  if (key === "shift") return "Shift";
  const m = /^shift-(\d+)$/.exec(key);
  return m ? `Shift ${m[1]}` : key;
}

export function parseRewasd(json: unknown): Profile[] {
  if (!isRewasdFile(json))
    throw new ParseError("Not a valid reWASD profile file");

  const appName = json.config.appName;
  const shifts = json.shifts ?? [];

  const radialShiftIds = new Set(
    shifts.filter((s) => s.type === "radialMenu").map((s) => s.id),
  );

  // Map each non-radial shiftId to a stable layer key and collect display labels.
  // First shift → "shift" (backward compat), subsequent → "shift-2", "shift-3", …
  const shiftIdToLayerKey = new Map<number, string>();
  const layerLabelsMap = new Map<string, string>();
  let shiftCount = 0;
  for (const shift of shifts) {
    if (radialShiftIds.has(shift.id)) continue;
    shiftCount++;
    const key = shiftCount === 1 ? "shift" : `shift-${shiftCount}`;
    shiftIdToLayerKey.set(shift.id, key);
    if (shift.description) layerLabelsMap.set(key, shift.description);
  }

  // Physical mask index: maskId → {deviceId, buttonId}
  const physicalMasks = new Map<number, RewasdMaskSet>();
  for (const mask of json.masks ?? []) {
    if (mask.set && mask.set.length > 0) {
      physicalMasks.set(mask.id, mask.set[0]);
    }
  }

  // Device map: hardware deviceId → 'cyborg' | 'cyro' (sorted gamepads)
  const deviceIdToDevice = new Map<number, Device>();
  const gamepads = (json.devices?.hardware ?? [])
    .filter((h) => h.name === "gamepad")
    .sort((a, b) => a.id - b.id);
  if (gamepads[0]) deviceIdToDevice.set(gamepads[0].id, "cyborg");
  if (gamepads[1]) deviceIdToDevice.set(gamepads[1].id, "cyro");

  const byDevice = new Map<Device, Record<string, Layer>>();

  function getLayer(device: Device, layerKey: string): Layer {
    if (!byDevice.has(device)) byDevice.set(device, { default: {} });
    const deviceLayers = byDevice.get(device)!;
    if (!deviceLayers[layerKey]) deviceLayers[layerKey] = {};
    return deviceLayers[layerKey]!;
  }

  function setButton(
    device: Device,
    layerKey: string,
    btnId: string,
    label: string,
    binding: string | undefined,
    activator: ActivatorType,
  ): void {
    const layer = getLayer(device, layerKey);
    if (!layer[btnId]) {
      layer[btnId] = { zone: "unzoned", label, bindings: {} };
    }
    if (binding) layer[btnId].bindings[activator] = binding;
  }

  for (const mapping of json.mappings) {
    const shiftId = mapping.condition?.shiftId;

    // Skip radial-menu-layer mappings (handled by parseRadialMenus)
    if (shiftId !== undefined && radialShiftIds.has(shiftId)) continue;

    const layerKey: string =
      shiftId !== undefined
        ? (shiftIdToLayerKey.get(shiftId) ?? "shift")
        : "default";
    const activatorRaw = mapping.condition?.mask?.activator?.type ?? "single";
    const activator: ActivatorType =
      activatorRaw === "long"
        ? "long"
        : activatorRaw === "double"
          ? "double"
          : "single";

    // ── Description-based (VSCode-style "Cyborg #N - Label KeyCombo") ──
    if (mapping.description) {
      const prefixMatch = PREFIX_RE.exec(mapping.description);
      if (prefixMatch) {
        const [, deviceStr, btnId, rest] = prefixMatch;
        const device = deviceStr.toLowerCase() as Device;
        const comboMatch = COMBO_RE.exec(rest);
        const binding = comboMatch ? comboMatch[1] : undefined;
        const label = comboMatch
          ? rest.slice(0, comboMatch.index).trim()
          : rest.trim();
        setButton(
          device,
          layerKey,
          btnId,
          label || `Button ${btnId}`,
          binding,
          activator,
        );
        continue;
      }
    }

    // ── Mask-based fallback (WoW-style unlabeled / short-description) ──
    if (!mapping.condition?.mask) continue;

    const maskId = mapping.condition.mask.id;
    const maskEntry = physicalMasks.get(maskId);
    if (!maskEntry) continue;
    const device = deviceIdToDevice.get(maskEntry.deviceId);
    if (!device) continue;

    const btnId = toAzeronId(device, maskEntry.buttonId);

    if (mapping.jumpToLayer) {
      const targetId = mapping.jumpToLayer.layer;
      // Radial menu jumps are rendered by parseRadialMenus — skip here
      if (radialShiftIds.has(targetId)) continue;
      // layer 0 = return to default; otherwise look up the named shift layer
      let targetName: string;
      if (targetId === 0) {
        targetName = "Default";
      } else {
        const targetKey = shiftIdToLayerKey.get(targetId);
        if (!targetKey) continue;
        targetName =
          layerLabelsMap.get(targetKey) ?? shiftLayerDisplayName(targetKey);
      }
      const label = mapping.description?.trim() ?? "Layer Switch";
      setButton(device, layerKey, btnId, label, `→ ${targetName}`, activator);
      continue;
    }

    const binding = macrosToBinding(mapping.macros ?? []);
    const label = mapping.description?.trim() || (binding ?? `Button ${btnId}`);
    setButton(device, layerKey, btnId, label, binding, activator);
  }

  if (byDevice.size === 0)
    throw new ParseError("No valid mappings found in reWASD file");

  const slug = appName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const ts = Date.now();
  const pairId = `imported-rewasd-${slug}-${ts}`;
  const radialMenus = parseRadialMenus(json, physicalMasks, deviceIdToDevice);
  const layerLabels =
    layerLabelsMap.size > 0 ? Object.fromEntries(layerLabelsMap) : undefined;

  return Array.from(byDevice.entries()).map(([device, layers]) => ({
    id: `${pairId}-${device}`,
    label: appName,
    platform: "windows" as const,
    type: "rewasd" as const,
    device,
    pairId,
    layers: layers as Profile["layers"],
    ...(layerLabels ? { layerLabels } : {}),
    radialMenus,
    imported: true as const,
  }));
}
