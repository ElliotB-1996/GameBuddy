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
  long?: string;
  double?: string;
}

export interface Button {
  zone: Zone;
  label: string;
  bindings: ButtonBinding;
}

export type Layer = Record<string, Button>;

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
