export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface TextNote {
  id: string;
  type: "text";
  content: string;
  collapsed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistNote {
  id: string;
  type: "checklist";
  content: ChecklistItem[];
  collapsed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Note = TextNote | ChecklistNote;

export interface Section {
  id: string;
  name: string;
  notes: Note[];
}

export interface Hotkeys {
  toggleVisibility: string;
  toggleEditMode: string;
  startVoiceNote: string;
}

export interface Settings {
  hotkeys: Hotkeys;
  audioDeviceId?: string;
}

export interface Appearance {
  bgColor: string;
  headerColor: string;
  accentColor: string;
  textColor: string;
  noteColor: string;
  fontSize: number;
  viewOpacity: number;
  editOpacity: number;
}

export interface AppData {
  settings: Settings;
  appearance: Appearance;
  sections: Section[];
}

export type WindowMode = "view" | "edit";

export interface ToastMessage {
  id: string;
  type: "error" | "info" | "success";
  message: string;
}
