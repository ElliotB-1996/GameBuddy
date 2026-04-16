import { useState, useEffect, useCallback } from "react";
import type { Hotkeys } from "../types";

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface Props {
  hotkeys: Hotkeys;
  audioDeviceId: string;
  onSave: (hotkeys: Hotkeys, audioDeviceId: string) => void;
  onClose: () => void;
}

type HotkeyKey = keyof Hotkeys;

const LABELS: Record<HotkeyKey, string> = {
  toggleVisibility: "Show / Hide Overlay",
  toggleEditMode: "Toggle Edit Mode",
  startVoiceNote: "Start Voice Note",
};

export function SettingsPanel({
  hotkeys,
  audioDeviceId,
  onSave,
  onClose,
}: Props) {
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
      .catch(() => {
        // mediaDevices unavailable (e.g. in tests)
      });
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
      <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>
        Settings
      </h3>

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
      </div>

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
    </div>
  );
}
