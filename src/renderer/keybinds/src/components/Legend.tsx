import type { Zone } from "../data/types";

const ZONES: { zone: Zone; label: string }[] = [
  { zone: "app", label: "App Launch" },
  { zone: "terminal", label: "Terminal" },
  { zone: "edit", label: "Editing" },
  { zone: "nav", label: "Navigation" },
  { zone: "git", label: "Git" },
  { zone: "mouse", label: "Mouse" },
  { zone: "system", label: "System" },
  { zone: "thumb", label: "Misc" },
  { zone: "unzoned", label: "Unzoned" },
];

interface Props {
  activeZone: Zone | null;
  onToggle: (zone: Zone) => void;
}

export default function Legend({ activeZone, onToggle }: Props): JSX.Element {
  return (
    <div className="legend-bar">
      <span className="legend-label">Zones</span>
      {ZONES.map(({ zone, label }) => (
        <div
          key={zone}
          className={`legend-item li-${zone} ${activeZone !== null && activeZone !== zone ? "dimmed" : ""}`}
          onClick={() => onToggle(zone)}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
