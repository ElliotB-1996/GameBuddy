export type Device = "cyborg" | "cyro";
export type Platform = "mac" | "windows";
export type Zone =
  | "app"
  | "terminal"
  | "edit"
  | "nav"
  | "git"
  | "mouse"
  | "system"
  | "thumb"
  | "unzoned";

export interface ButtonBinding {
  single?: string;
  double?: string;
  triple?: string;
  long?: string;
  down?: string;
  up?: string;
  turbo?: string;
  toggle?: string;
}

export interface Button {
  zone: Zone;
  label: string;
  bindings: ButtonBinding;
}

export type Layer = Record<string, Button>;

export interface Combo {
  buttons: string[]; // Azeron button numbers that must all be held simultaneously
  zone: Zone;
  label: string;
  bindings: ButtonBinding;
  layer: string; // "default" | "shift" | "shift-2" | …
}

export interface Profile {
  id: string;
  label: string;
  platform: Platform;
  type: "azeron" | "rewasd";
  device: Device;
  pairId?: string;
  layers: {
    default: Layer;
    [key: string]: Layer | undefined;
  };
  layerLabels?: Record<string, string>;
  radialMenus?: RadialMenu[];
  combos?: Combo[];
  notes?: string;
  imported?: true;
}

export interface RadialAction {
  label: string;
  direction: "↑" | "↓" | "←" | "→" | "↗" | "↘" | "↙" | "↖";
  binding?: string;
  submenu?: RadialMenu;
}

export interface RadialMenu {
  id: string;
  label: string;
  trigger: string;
  color: string;
  actions: RadialAction[];
}
