import { useState, useEffect, useRef, useMemo } from "react";
import "./index.css";
import { profiles } from "./data/profiles";
import type { Zone, Profile, Button } from "./data/types";
import Legend from "./components/Legend";
import DeviceSection from "./components/DeviceSection";
import RadialMenus from "./components/RadialMenus";
import { loadImportedProfiles, saveProfile, deleteProfile } from "./db";
import { parseRewasd } from "./importers/parseRewasd";
import { ParseError } from "./importers/errors";

const PROFILE_PAIRS = [
  {
    label: "Mac Default",
    platform: "mac",
    cyborgId: "cyborg-mac-onboard",
    cyroId: "cyro-mac-onboard",
    appNames: [] as string[],
  },
  {
    label: "Windows Default",
    platform: "windows",
    cyborgId: "cyborg-windows-default",
    cyroId: "cyro-windows-default",
    appNames: [] as string[],
  },
  {
    label: "VS Code",
    platform: "windows",
    cyborgId: "cyborg-vscode-windows",
    cyroId: "cyro-vscode-windows",
    appNames: ["Code.exe"],
  },
  {
    label: "Browser",
    platform: "windows",
    cyborgId: "cyborg-browser-windows",
    cyroId: "cyro-browser-windows",
    appNames: [
      "chrome.exe",
      "msedge.exe",
      "firefox.exe",
      "brave.exe",
      "opera.exe",
    ],
  },
  {
    label: "Terminal",
    platform: "windows",
    cyborgId: "cyborg-terminal-windows",
    cyroId: "cyro-terminal-windows",
    appNames: ["WindowsTerminal.exe", "cmd.exe", "powershell.exe", "pwsh.exe"],
  },
  {
    label: "Discord",
    platform: "windows",
    cyborgId: "cyborg-discord-windows",
    cyroId: "cyro-discord-windows",
    appNames: ["Discord.exe"],
  },
  {
    label: "Obsidian",
    platform: "windows",
    cyborgId: "cyborg-obsidian-windows",
    cyroId: "cyro-obsidian-windows",
    appNames: ["Obsidian.exe"],
  },
  {
    label: "Spotify",
    platform: "windows",
    cyborgId: "cyborg-spotify-windows",
    cyroId: "cyro-spotify-windows",
    appNames: ["Spotify.exe"],
  },
];

const BUILTIN_IDS = new Set(profiles.map((p) => p.id));

export default function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState(0);
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [importedProfiles, setImportedProfiles] = useState<Profile[]>([]);
  const importedProfilesRef = useRef<Profile[]>([]);
  useEffect(() => {
    importedProfilesRef.current = importedProfiles;
  }, [importedProfiles]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImportedProfiles().then(setImportedProfiles);
  }, []);

  useEffect(() => {
    const windowsDefaultIdx = PROFILE_PAIRS.findIndex(
      (p) => p.label === "Windows Default",
    );
    window.keybindsApi.onActiveApp((processName) => {
      const idx = PROFILE_PAIRS.findIndex((p) =>
        p.appNames.some((n) => n.toLowerCase() === processName.toLowerCase()),
      );
      setActiveTab(idx >= 0 ? idx : windowsDefaultIdx);
    });
    return () => window.keybindsApi.removeActiveAppListener();
  }, []);

  // Reads from state snapshot — safe for render-time derivations (cyborg, cyro).
  // Event handlers that need the latest value use importedProfilesRef.current directly.
  function resolveProfile(id: string): Profile | undefined {
    return (
      importedProfiles.find((p) => p.id === id) ??
      profiles.find((p) => p.id === id)
    );
  }

  const importedGroups = useMemo(() => {
    const seen = new Map<string, Profile[]>();
    for (const p of importedProfiles) {
      if (BUILTIN_IDS.has(p.id)) continue;
      const key = p.pairId ?? p.id;
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push(p);
    }
    return Array.from(seen.values());
  }, [importedProfiles]);

  function toggleZone(zone: Zone): void {
    setActiveZone((prev) => (prev === zone ? null : zone));
  }

  async function handleDeleteGroup(key: string): Promise<void> {
    const toDelete = importedProfiles.filter((p) => (p.pairId ?? p.id) === key);
    for (const p of toDelete) await deleteProfile(p.id);
    setImportedProfiles((prev) =>
      prev.filter((p) => (p.pairId ?? p.id) !== key),
    );
    setActiveTab(0);
  }

  async function handleImport(file: File): Promise<void> {
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      const parsed = parseRewasd(json);
      for (const profile of parsed) {
        await saveProfile(profile);
      }
      const next = [...importedProfiles, ...parsed];
      setImportedProfiles(next);
      const nextGroupCount = new Set(next.map((p) => p.pairId ?? p.id)).size;
      setActiveTab(PROFILE_PAIRS.length + nextGroupCount - 1);
      setImportError(null);
    } catch (e) {
      setImportError(
        e instanceof ParseError
          ? e.message
          : "Could not read file — is it a valid reWASD export?",
      );
    }
  }

  async function handleButtonSave(
    profileId: string,
    layerKey: string,
    buttonId: string,
    updated: Button,
  ): Promise<void> {
    const current =
      importedProfilesRef.current.find((p) => p.id === profileId) ??
      profiles.find((p) => p.id === profileId);
    if (!current) return;
    const next: Profile = {
      ...current,
      layers: {
        ...current.layers,
        [layerKey]: {
          ...current.layers[layerKey],
          [buttonId]: updated,
        },
      },
    };
    await saveProfile(next);
    setImportedProfiles((prev) => {
      const idx = prev.findIndex((p) => p.id === profileId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = next;
        return copy;
      }
      return [...prev, next];
    });
  }

  const isImportedTab = activeTab >= PROFILE_PAIRS.length;
  const importedGroup = isImportedTab
    ? importedGroups[activeTab - PROFILE_PAIRS.length]
    : undefined;
  const importedCyborg = importedGroup?.find((p) => p.device === "cyborg");
  const importedCyro = importedGroup?.find((p) => p.device === "cyro");
  const pair = !isImportedTab ? PROFILE_PAIRS[activeTab] : null;
  const cyborg = pair ? resolveProfile(pair.cyborgId) : undefined;
  const cyro = pair ? resolveProfile(pair.cyroId) : undefined;

  return (
    <>
      <header className="header">
        <h1>Azeron Dashboard</h1>
        <div className="profile-tabs">
          {PROFILE_PAIRS.map((p, i) => (
            <button
              key={i}
              className={`tab ${activeTab === i ? "active" : "inactive"}`}
              onClick={() => setActiveTab(i)}
            >
              {p.label}
              <span className="platform">{p.platform}</span>
            </button>
          ))}
          {importedGroups.map((group, i) => {
            const tabIndex = PROFILE_PAIRS.length + i;
            const key = group[0].pairId ?? group[0].id;
            return (
              <button
                key={key}
                className={`tab ${activeTab === tabIndex ? "active" : "inactive"} tab-imported`}
                onClick={() => setActiveTab(tabIndex)}
              >
                {group[0].label}
                <span className="platform">rewasd</span>
                <span
                  className="tab-delete"
                  role="button"
                  aria-label="Remove profile"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGroup(key);
                  }}
                >
                  ✕
                </span>
              </button>
            );
          })}
          <input
            ref={fileInputRef}
            type="file"
            accept=".rewasd"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
          <button
            className="tab tab-import"
            onClick={() => fileInputRef.current?.click()}
          >
            + Import
          </button>
        </div>
      </header>

      {importError && (
        <div className="import-error" onClick={() => setImportError(null)}>
          {importError}
        </div>
      )}

      <div className="main">
        <Legend activeZone={activeZone} onToggle={toggleZone} />

        <div className="device-panel">
          {importedGroup ? (
            <>
              {importedCyborg && (
                <DeviceSection
                  profile={importedCyborg}
                  activeZone={activeZone}
                  onSave={handleButtonSave}
                />
              )}
              <div className="right-col">
                {importedCyro && (
                  <DeviceSection
                    profile={importedCyro}
                    activeZone={activeZone}
                    className="column"
                    onSave={handleButtonSave}
                  />
                )}
                <RadialMenus
                  menus={(importedCyborg ?? importedCyro)?.radialMenus ?? []}
                />
              </div>
            </>
          ) : (
            <>
              {cyborg && (
                <DeviceSection
                  profile={cyborg}
                  activeZone={activeZone}
                  onSave={handleButtonSave}
                />
              )}
              <div className="right-col">
                {cyro && (
                  <DeviceSection
                    profile={cyro}
                    activeZone={activeZone}
                    className="column"
                    onSave={handleButtonSave}
                  />
                )}
                <RadialMenus menus={cyborg?.radialMenus ?? []} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
