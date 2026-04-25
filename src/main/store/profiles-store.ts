import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { Profile } from "../../renderer/keybinds/src/data/types";

export function loadProfiles(filePath: string): {
  data: Profile[];
  error: string | null;
} {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return {
        data: [],
        error: "Profiles file is corrupted. Starting with empty state.",
      };
    }
    return { data: parsed as Profile[], error: null };
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return { data: [], error: null };
    }
    return {
      data: [],
      error: "Profiles file is corrupted. Starting with empty state.",
    };
  }
}

export function saveProfiles(filePath: string, profiles: Profile[]): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(profiles, null, 2), "utf-8");
}
