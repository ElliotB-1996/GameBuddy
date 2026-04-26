import type { Layer, Zone } from "../data/types";
import { CYRO_THUMB } from "../data/layout";

interface Props {
  layer: Layer;
  activeZone: Zone | null;
}

export default function CyroThumb({ layer, activeZone }: Props): JSX.Element {
  return (
    <div className="cyro-thumb thumb-area">
      <div
        className="thumb-btns"
        style={{ gridTemplateColumns: `repeat(${CYRO_THUMB.length}, auto)` }}
      >
        {CYRO_THUMB.map(({ id, dir }) => {
          const btn = layer[id];
          if (!btn)
            return (
              <div key={id} className="tbtn z-thumb">
                <span className="dir">{dir}</span>
                <span className="label">—</span>
                <span className="num">#{id}</span>
              </div>
            );
          const dimmed =
            activeZone !== null && activeZone !== btn.zone
              ? { opacity: 0.1 }
              : undefined;
          return (
            <div key={id} className={`tbtn z-${btn.zone}`} style={dimmed}>
              <span className="dir">{dir}</span>
              <span className="label">{btn.label}</span>
              <span className="num">#{id}</span>
              <div className="btn-tip">
                {btn.bindings.single && (
                  <div className="tip-row">
                    <span className="tip-type">Single</span>
                    <span className="tip-binding">{btn.bindings.single}</span>
                  </div>
                )}
                {btn.bindings.long && (
                  <div className="tip-row">
                    <span className="tip-type">Long</span>
                    <span className="tip-binding">{btn.bindings.long}</span>
                  </div>
                )}
                {btn.bindings.double && (
                  <div className="tip-row">
                    <span className="tip-type">Double</span>
                    <span className="tip-binding">{btn.bindings.double}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
