import { useState } from "react";
import type { Profile, Zone } from "../data/types";
import { CYBORG_GRID, CYRO_GRID } from "../data/layout";
import Btn from "./Btn";
import CyborgThumb from "./CyborgThumb";
import CyroThumb from "./CyroThumb";

interface Props {
  profile: Profile;
  activeZone: Zone | null;
  className?: string;
}

export default function DeviceSection({
  profile,
  activeZone,
  className,
}: Props): JSX.Element {
  const [activeLayer, setActiveLayer] = useState<string>("default");

  const layerKeys = [
    "default",
    ...Object.keys(profile.layers).filter((k) => k !== "default"),
  ];
  const layer = profile.layers[activeLayer] ?? profile.layers.default;
  const grid = profile.device === "cyborg" ? CYBORG_GRID : CYRO_GRID;
  const gridClass = profile.device === "cyborg" ? "cyborg-grid" : "cyro-grid";

  function layerLabel(key: string): string {
    if (profile.layerLabels?.[key]) return profile.layerLabels[key];
    if (key === "default") return "Default";
    if (key === "shift") return "Shift";
    const m = /^shift-(\d+)$/.exec(key);
    if (m) return `Shift ${m[1]}`;
    return key;
  }

  return (
    <div className={`device-section ${className ?? ""}`}>
      <div className="device-header">
        <div className="device-title">
          {profile.device === "cyborg" ? "Azeron Cyborg V2" : "Azeron Cyro"}
        </div>
        {layerKeys.length > 1 && (
          <div className="layer-selector">
            <span>Layer</span>
            {layerKeys.map((key) => (
              <button
                key={key}
                className={`layer-btn ${activeLayer === key ? "active" : ""}`}
                onClick={() => setActiveLayer(key)}
              >
                {layerLabel(key)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={gridClass}>
        {grid
          .flat()
          .map((id, i) =>
            id ? (
              <Btn
                key={id}
                id={id}
                button={layer[id]}
                activeZone={activeZone}
              />
            ) : (
              <div key={`sp-${i}`} className="spacer" />
            ),
          )}
      </div>

      {profile.device === "cyborg" ? (
        <CyborgThumb layer={layer} activeZone={activeZone} />
      ) : (
        <CyroThumb layer={layer} activeZone={activeZone} />
      )}
    </div>
  );
}
