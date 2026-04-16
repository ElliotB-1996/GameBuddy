import { useState, useEffect, useCallback, JSX } from "react";
import type { Hotkeys, Appearance } from "../types";

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface Props {
  hotkeys: Hotkeys;
  audioDeviceId: string;
  appearance: Appearance;
  onSave: (hotkeys: Hotkeys, audioDeviceId: string) => void;
  onAppearanceChange: (appearance: Appearance) => void;
  onClose: () => void;
}

type HotkeyKey = keyof Hotkeys;
type Tab = "hotkeys" | "audio" | "appearance";

const LABELS: Record<HotkeyKey, string> = {
  toggleVisibility: "Show / Hide Overlay",
  toggleEditMode: "Toggle Edit Mode",
  startVoiceNote: "Start Voice Note",
};

const TAB_LABELS: Record<Tab, string> = {
  hotkeys: "Hotkeys",
  audio: "Audio",
  appearance: "Appearance",
};

const COLOR_FIELDS: [keyof Appearance, string][] = [
  ["bgColor", "Background"],
  ["headerColor", "Header"],
  ["accentColor", "Accent"],
  ["textColor", "Text"],
  ["noteColor", "Note Card"],
];

export function SettingsPanel({
  hotkeys,
  audioDeviceId,
  appearance,
  onSave,
  onAppearanceChange,
  onClose,
}: Props): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>("hotkeys");
  const [draft, setDraft] = useState<Hotkeys>({ ...hotkeys });
  const [draftDeviceId, setDraftDeviceId] = useState(audioDeviceId);
  const [capturing, setCapturing] = useState<HotkeyKey | null>(null);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const inputs = devices
          .filter((d) => d.kind === "audioinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${i + 1}`,
          }));
        setAudioDevices(inputs);
      })
      .catch(() => {});
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, key: HotkeyKey) => {
      e.preventDefault();
      const parts: string[] = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      if (e.metaKey) parts.push("Meta");
      const main = e.key;
      if (!["Control", "Alt", "Shift", "Meta"].includes(main)) {
        parts.push(main.length === 1 ? main.toUpperCase() : main);
        setDraft((prev) => ({ ...prev, [key]: parts.join("+") }));
        setCapturing(null);
      }
    },
    [],
  );

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "rgba(255,255,255,0.1)" : "none",
    border: "none",
    borderRadius: 4,
    color: active ? "#e2e8f0" : "#94a3b8",
    cursor: "pointer",
    flex: 1,
    fontSize: 11,
    padding: "4px 0",
  });

  return (
    <div
      style={{
        background: "rgba(15,15,15,0.95)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 8,
        color: "#e2e8f0",
        padding: 16,
        position: "absolute",
        right: 8,
        top: 40,
        width: 280,
        zIndex: 100,
      }}
    >
      <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>
        Settings
      </h3>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 12,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 4,
          padding: 2,
        }}
      >
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={tabBtnStyle(activeTab === tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Hotkeys tab */}
      {activeTab === "hotkeys" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(Object.keys(LABELS) as HotkeyKey[]).map((key) => (
            <div key={key}>
              <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 3 }}>
                {LABELS[key]}
              </div>
              <div
                onKeyDown={
                  capturing === key ? (e) => handleKeyDown(e, key) : undefined
                }
                onClick={() => setCapturing(key)}
                tabIndex={0}
                style={{
                  background:
                    capturing === key
                      ? "rgba(74,222,128,0.1)"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${capturing === key ? "#4ade80" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 4,
                  color: "#e2e8f0",
                  cursor: "pointer",
                  fontSize: 12,
                  padding: "4px 8px",
                }}
              >
                {capturing === key ? "Press keys…" : draft[key]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audio tab */}
      {activeTab === "audio" && (
        <div>
          <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 3 }}>
            Microphone
          </div>
          <select
            value={draftDeviceId}
            onChange={(e) => setDraftDeviceId(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              color: "#e2e8f0",
              fontSize: 12,
              padding: "4px 8px",
              width: "100%",
            }}
          >
            <option value="">System Default</option>
            {audioDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Appearance tab */}
      {activeTab === "appearance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {COLOR_FIELDS.map(([key, label]) => (
            <div
              key={key}
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ color: "#94a3b8", fontSize: 11 }}>{label}</span>
              <input
                title={label}
                type="color"
                value={appearance[key] as string}
                onChange={(e) =>
                  onAppearanceChange({ ...appearance, [key]: e.target.value })
                }
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 3,
                  cursor: "pointer",
                  height: 24,
                  padding: 1,
                  width: 36,
                }}
              />
            </div>
          ))}

          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: 11 }}>Font size</span>
            <input
              type="number"
              min={10}
              max={20}
              value={appearance.fontSize}
              onChange={(e) =>
                onAppearanceChange({
                  ...appearance,
                  fontSize: Math.max(10, Math.min(20, Number(e.target.value))),
                })
              }
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                color: "#e2e8f0",
                fontSize: 12,
                padding: "3px 6px",
                width: 52,
              }}
            />
          </div>

          <div>
            <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 3 }}>
              Opacity (view mode) — {appearance.viewOpacity.toFixed(2)}
            </div>
            <input
              type="range"
              min={0.2}
              max={1.0}
              step={0.01}
              value={appearance.viewOpacity}
              onChange={(e) =>
                onAppearanceChange({
                  ...appearance,
                  viewOpacity: Number(e.target.value),
                })
              }
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 3 }}>
              Opacity (edit mode) — {appearance.editOpacity.toFixed(2)}
            </div>
            <input
              type="range"
              min={0.5}
              max={1.0}
              step={0.01}
              value={appearance.editOpacity}
              onChange={(e) =>
                onAppearanceChange({
                  ...appearance,
                  editOpacity: Number(e.target.value),
                })
              }
              style={{ width: "100%" }}
            />
          </div>
        </div>
      )}

      {/* Save/Cancel — hidden on Appearance tab (changes are live) */}
      {activeTab !== "appearance" && (
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 14,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 4,
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 12,
              padding: "4px 12px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(draft, draftDeviceId);
              onClose();
            }}
            style={{
              background: "rgba(74,222,128,0.15)",
              border: "1px solid #4ade80",
              borderRadius: 4,
              color: "#4ade80",
              cursor: "pointer",
              fontSize: 12,
              padding: "4px 12px",
            }}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
