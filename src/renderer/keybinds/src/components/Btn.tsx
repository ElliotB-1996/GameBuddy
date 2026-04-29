import type { Button, Zone } from "../data/types";

interface Props {
  id: string;
  button?: Button;
  activeZone: Zone | null;
  highlightedButtons?: Set<string> | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}

export default function Btn({
  id,
  button,
  activeZone,
  highlightedButtons,
  isEditing,
  onEditButton,
}: Props): JSX.Element {
  if (!button) {
    return (
      <div className="btn empty">
        <span className="label">—</span>
        <span className="num">#{id}</span>
      </div>
    );
  }

  const { zone, label, bindings } = button;
  const dimmed =
    (activeZone !== null && activeZone !== zone) ||
    (highlightedButtons != null && !highlightedButtons.has(id))
      ? { opacity: 0.1 }
      : undefined;

  function handleClick(e: React.MouseEvent<HTMLDivElement>): void {
    if (isEditing && onEditButton) {
      onEditButton(id, e.currentTarget.getBoundingClientRect());
    }
  }

  return (
    <div
      className={`btn z-${zone}${isEditing ? " btn--editing" : ""}`}
      style={dimmed}
      data-zone={zone}
      onClick={handleClick}
    >
      <span className="label">{label}</span>
      <span className="num">#{id}</span>
      <div className="btn-tip">
        {bindings.single && (
          <div className="tip-row">
            <span className="tip-type">Single</span>
            <span className="tip-binding">{bindings.single}</span>
          </div>
        )}
        {bindings.double && (
          <div className="tip-row">
            <span className="tip-type">Double</span>
            <span className="tip-binding">{bindings.double}</span>
          </div>
        )}
        {bindings.triple && (
          <div className="tip-row">
            <span className="tip-type">Triple</span>
            <span className="tip-binding">{bindings.triple}</span>
          </div>
        )}
        {bindings.long && (
          <div className="tip-row">
            <span className="tip-type">Long</span>
            <span className="tip-binding">{bindings.long}</span>
          </div>
        )}
        {bindings.down && (
          <div className="tip-row">
            <span className="tip-type">Down</span>
            <span className="tip-binding">{bindings.down}</span>
          </div>
        )}
        {bindings.up && (
          <div className="tip-row">
            <span className="tip-type">Up</span>
            <span className="tip-binding">{bindings.up}</span>
          </div>
        )}
        {bindings.turbo && (
          <div className="tip-row">
            <span className="tip-type">Turbo</span>
            <span className="tip-binding">{bindings.turbo}</span>
          </div>
        )}
        {bindings.toggle && (
          <div className="tip-row">
            <span className="tip-type">Toggle</span>
            <span className="tip-binding">{bindings.toggle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
