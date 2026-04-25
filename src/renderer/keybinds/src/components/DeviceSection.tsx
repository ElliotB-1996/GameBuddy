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
  const [activeLayer, setActiveLayer] = useState<"default" | "shift">(
    "default",
  );

  const layer = profile.layers[activeLayer] ?? profile.layers.default;
  const grid = profile.device === "cyborg" ? CYBORG_GRID : CYRO_GRID;
  const gridClass = profile.device === "cyborg" ? "cyborg-grid" : "cyro-grid";
  const hasShift = !!profile.layers.shift;

  return (
    <div className={`device-section ${className ?? ""}`}>
      <div className="device-header">
        <div className="device-title">
          {profile.device === "cyborg" ? "Azeron Cyborg V2" : "Azeron Cyro"}
        </div>
        {hasShift && (
          <div className="layer-selector">
            <span>Layer</span>
            <button
              className={`layer-btn ${activeLayer === "default" ? "active" : ""}`}
              onClick={() => setActiveLayer("default")}
            >
              Default
            </button>
            <button
              className={`layer-btn ${activeLayer === "shift" ? "active" : ""}`}
              onClick={() => setActiveLayer("shift")}
            >
              Shift
            </button>
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
