import type { Combo, Device } from "../data/types";

const BINDING_KEYS: (keyof Combo["bindings"])[] = [
  "single",
  "double",
  "triple",
  "long",
  "down",
  "up",
  "turbo",
  "toggle",
];

interface Props {
  combos: { combo: Combo; device: Device }[];
  selectedIndex: number | null;
  onSelect: (idx: number | null) => void;
}

export default function CombosPanel({
  combos,
  selectedIndex,
  onSelect,
}: Props): JSX.Element {
  return (
    <div className="panel">
      <div className="panel-title">Combos</div>
      {combos.length === 0 ? (
        <p style={{ fontSize: 11, color: "#6b7280" }}>
          No combos defined for this profile.
        </p>
      ) : (
        <ul className="combo-list">
          {combos.map(({ combo }, idx) => (
            <li
              key={`${combo.buttons.join("+")}-${combo.layer}`}
              className={`combo-row${selectedIndex === idx ? " selected" : ""}`}
              onClick={() => onSelect(selectedIndex === idx ? null : idx)}
            >
              <span className="combo-chips">
                {combo.buttons.map((b, bi) => (
                  <span key={b} className="combo-chip-group">
                    {bi > 0 && <span className="combo-plus">+</span>}
                    <span className="combo-chip">#{b}</span>
                  </span>
                ))}
              </span>
              <span className="combo-label">{combo.label}</span>
              <span className={`combo-zone li-${combo.zone}`}>
                {combo.zone}
              </span>
              {combo.layer !== "default" && (
                <span className="combo-layer">{combo.layer}</span>
              )}
              <span className="combo-bindings">
                {BINDING_KEYS.filter((k) => combo.bindings[k]).map((k) => (
                  <span key={k} className="combo-binding-entry">
                    <span className="combo-binding-type">{k}</span>
                    <span className="combo-binding-value">
                      {combo.bindings[k]}
                    </span>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
