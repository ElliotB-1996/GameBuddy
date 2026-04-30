// ── Raw reWASD file schema ────────────────────────────────────────────────────

export interface RewasdConfig {
  appName: string;
  processNames?: string[];
  minTimeUnit?: number;
}

export interface RewasdGroup {
  id: number;
  name: "keyboard" | "mouse";
}

export interface RewasdStick {
  name: string;
  diagonalZones?: boolean;
  rotation?: number;
}

export interface RewasdTouchpad {
  id: number;
  mode?: string;
  trackballFriction?: number;
}

export interface RewasdHardware {
  id: number;
  name: "gamepad" | "keyboard" | "mouse";
  groupId?: number;
  type?: string;
  default?: {
    sticks?: RewasdStick[];
    touchpads?: RewasdTouchpad[];
  };
  shifts?: Array<{
    shiftId: number;
    sticks?: RewasdStick[];
  }>;
  applyToPhysicalPriority?: boolean;
}

export interface RewasdDevices {
  groups?: RewasdGroup[];
  hardware: RewasdHardware[];
  virtual?: { gamepads?: Array<{ id: number; type: string }> };
}

export interface RewasdShift {
  id: number;
  type: "default" | "radialMenu";
  description?: string;
}

export interface RewasdMaskSet {
  deviceId: number;
  buttonId: number;
  description?: string;
}

export interface RewasdMask {
  id: number;
  set?: RewasdMaskSet[]; // multiple entries = combination
  radialMenuSet?: Array<{ circleId: number; sectorId: number }>;
}

export interface RewasdCommand {
  id: number;
  type: number;
  name: string;
  params?: Record<string, unknown>;
}

export interface RewasdActivator {
  type: "single" | "long" | "double" | "triple" | "start" | "release";
  mode: "hold_until_release" | "onetime" | "turbo" | "toggle";
  params?: { expert?: boolean; pause?: number };
}

export interface RewasdKeyboardMacro {
  buttonId: number;
  description: string;
  action?: "down" | "up";
}

export type RewasdMouseMacro =
  | { buttonId: number }
  | { direction: "left" | "right" | "up" | "down" }
  | { wheel: "up" | "down" | "left" | "right" };

export interface RewasdMacroItem {
  keyboard?: RewasdKeyboardMacro;
  mouse?: RewasdMouseMacro;
  command?: { id: number };
}

export interface RewasdMappingBase {
  description?: string;
  jumpToLayer?: { layer: number };
  macros?: RewasdMacroItem[];
  hardware?: { unmap: true };
}

export interface RewasdConditionMask {
  shiftId?: number;
  mask: { id: number; activator?: RewasdActivator };
}

export interface RewasdConditionHardware {
  shiftId?: number;
  hardware: RewasdMaskSet;
}

export interface RewasdMappingMask extends RewasdMappingBase {
  condition?: RewasdConditionMask;
}

export interface RewasdMappingHardware extends RewasdMappingBase {
  condition?: RewasdConditionHardware;
}

export type RewasdMapping = RewasdMappingMask | RewasdMappingHardware;

export interface RewasdCircle {
  id: number;
  parentSectorId?: number;
  sectors: number[];
}

export interface RewasdSector {
  id: number;
  parentCircleId: number;
  childCircleId?: number;
  description?: string;
  color?: [number, number, number];
}

export interface RewasdFile {
  schemaVersion?: number;
  appVersion?: string;
  config: RewasdConfig;
  devices: RewasdDevices;
  shifts?: RewasdShift[];
  masks?: RewasdMask[];
  commands?: RewasdCommand[];
  radialMenuCircles?: RewasdCircle[];
  radialMenuSectors?: RewasdSector[];
  mappings: RewasdMapping[];
}
