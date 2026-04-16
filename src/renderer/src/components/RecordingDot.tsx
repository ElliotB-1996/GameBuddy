import { JSX } from "react";

export function RecordingDot(): JSX.Element {
  return (
    <span
      title="Recording…"
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#ef4444",
        display: "inline-block",
        flexShrink: 0,
        animation: "recording-pulse 1s ease-in-out infinite",
      }}
    />
  );
}
