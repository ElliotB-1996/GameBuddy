import type { Layer, Zone } from "../data/types";
import { CYBORG_THUMB } from "../data/layout";
import type { ThumbCell } from "../data/layout";

interface Props {
  layer: Layer;
  activeZone: Zone | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}

interface TBtnProps {
  id: string;
  dir: string;
  layer: Layer;
  activeZone: Zone | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}

function TBtn({
  id,
  dir,
  layer,
  activeZone,
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
      <div className="tbtn z-thumb" onClick={handleClick}>
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
}

export default function CyborgThumb({
  layer,
  activeZone,
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
