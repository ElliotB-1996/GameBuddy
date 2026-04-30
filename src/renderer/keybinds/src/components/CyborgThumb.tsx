import type { Layer, Zone } from "../data/types";
import { CYBORG_THUMB } from "../data/layout";
import type { ThumbCell } from "../data/layout";

interface Props {
  layer: Layer;
  activeZone: Zone | null;
  highlightedButtons?: Set<string> | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}

interface TBtnProps {
  id: string;
  dir: string;
  layer: Layer;
  activeZone: Zone | null;
  highlightedButtons?: Set<string> | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}

function TBtn({
  id,
  dir,
  layer,
  activeZone,
  highlightedButtons,
  isEditing,
  onEditButton,
}: TBtnProps): JSX.Element {
  const btn = layer[id];

  function handleClick(e: React.MouseEvent<HTMLDivElement>): void {
    if (isEditing && onEditButton) {
      onEditButton(id, e.currentTarget.getBoundingClientRect());
    }
  }

  if (!btn)
    return (
      <div
        className={`tbtn z-thumb${isEditing ? " tbtn--editing" : ""}`}
        onClick={handleClick}
      >
        <span className="dir">{dir}</span>
        <span className="label">—</span>
        <span className="num">#{id}</span>
      </div>
    );
  const dimmed =
    (activeZone !== null && activeZone !== btn.zone) ||
    (highlightedButtons != null && !highlightedButtons.has(id))
      ? { opacity: 0.1 }
      : undefined;
  return (
    <div
      className={`tbtn z-${btn.zone}${isEditing ? " tbtn--editing" : ""}`}
      style={dimmed}
      onClick={handleClick}
    >
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
        {btn.bindings.double && (
          <div className="tip-row">
            <span className="tip-type">Double</span>
            <span className="tip-binding">{btn.bindings.double}</span>
          </div>
        )}
        {btn.bindings.triple && (
          <div className="tip-row">
            <span className="tip-type">Triple</span>
            <span className="tip-binding">{btn.bindings.triple}</span>
          </div>
        )}
        {btn.bindings.long && (
          <div className="tip-row">
            <span className="tip-type">Long</span>
            <span className="tip-binding">{btn.bindings.long}</span>
          </div>
        )}
        {btn.bindings.down && (
          <div className="tip-row">
            <span className="tip-type">Down</span>
            <span className="tip-binding">{btn.bindings.down}</span>
          </div>
        )}
        {btn.bindings.up && (
          <div className="tip-row">
            <span className="tip-type">Up</span>
            <span className="tip-binding">{btn.bindings.up}</span>
          </div>
        )}
        {btn.bindings.turbo && (
          <div className="tip-row">
            <span className="tip-type">Turbo</span>
            <span className="tip-binding">{btn.bindings.turbo}</span>
          </div>
        )}
        {btn.bindings.toggle && (
          <div className="tip-row">
            <span className="tip-type">Toggle</span>
            <span className="tip-binding">{btn.bindings.toggle}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CyborgThumb({
  layer,
  activeZone,
  highlightedButtons,
  isEditing,
  onEditButton,
}: Props): JSX.Element {
  return (
    <div className="thumb-area">
      <div
        className="thumb-btns"
        style={{ gridTemplateColumns: "repeat(5, auto)" }}
      >
        {CYBORG_THUMB.flatMap((row, ri) => [
          ...(ri > 0 ? [<div key={`sep-${ri}`} className="thumb-sep" />] : []),
          ...row.map((cell: ThumbCell, ci) =>
            cell ? (
              <TBtn
                key={cell.id}
                id={cell.id}
                dir={cell.dir}
                layer={layer}
                activeZone={activeZone}
                highlightedButtons={highlightedButtons}
                isEditing={isEditing}
                onEditButton={onEditButton}
              />
            ) : (
              <div key={`sp-${ri}-${ci}`} />
            ),
          ),
        ])}
      </div>
    </div>
  );
}
