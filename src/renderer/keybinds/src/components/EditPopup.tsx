import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import type { Button, Zone } from "../data/types";

const ZONES: Zone[] = [
  "app",
  "terminal",
  "edit",
  "nav",
  "git",
  "mouse",
  "system",
  "thumb",
  "unzoned",
];

const POPUP_WIDTH = 240;
const POPUP_HEIGHT = 490;

interface Props {
  buttonId: string;
  button: Button;
  rect: DOMRect;
  onSave: (updated: Button) => void;
  onClose: () => void;
}

export default function EditPopup({
  buttonId,
  button,
  rect,
  onSave,
  onClose,
}: Props): JSX.Element {
  const [label, setLabel] = useState(button.label);
  const [zone, setZone] = useState<Zone>(button.zone);
  const [single, setSingle] = useState(button.bindings.single ?? "");
  const [double, setDouble] = useState(button.bindings.double ?? "");
  const [triple, setTriple] = useState(button.bindings.triple ?? "");
  const [long, setLong] = useState(button.bindings.long ?? "");
  const [down, setDown] = useState(button.bindings.down ?? "");
  const [up, setUp] = useState(button.bindings.up ?? "");
  const [turbo, setTurbo] = useState(button.bindings.turbo ?? "");
  const [toggle, setToggle] = useState(button.bindings.toggle ?? "");
  const popupRef = useRef<HTMLDivElement>(null);

  const margin = 8;
  let top = rect.bottom + 6;
  let left = rect.left;
  if (top + POPUP_HEIGHT > window.innerHeight - margin)
    top = rect.top - POPUP_HEIGHT - 6;
  if (left + POPUP_WIDTH > window.innerWidth - margin)
    left = rect.right - POPUP_WIDTH;
  top = Math.max(margin, top);
  left = Math.max(margin, left);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent): void {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose]);

  function handleSave(): void {
    const bindings: Button["bindings"] = {};
    if (single) bindings.single = single;
    if (double) bindings.double = double;
    if (triple) bindings.triple = triple;
    if (long) bindings.long = long;
    if (down) bindings.down = down;
    if (up) bindings.up = up;
    if (turbo) bindings.turbo = turbo;
    if (toggle) bindings.toggle = toggle;
    onSave({ label, zone, bindings });
  }

  return ReactDOM.createPortal(
    <div ref={popupRef} className="edit-popup" style={{ top, left }}>
      <div className="edit-popup-header">
        <span>Button #{buttonId}</span>
        <button className="edit-popup-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <label className="edit-popup-label">Label</label>
      <input
        className="edit-popup-input"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />

      <label className="edit-popup-label">Zone</label>
      <div className="edit-popup-zones">
        {ZONES.map((z) => (
          <button
            key={z}
            className={`edit-popup-zone z-${z}${zone === z ? " selected" : ""}`}
            onClick={() => setZone(z)}
          >
            {z}
          </button>
        ))}
      </div>

      <label className="edit-popup-label">Bindings</label>
      <div className="edit-popup-bindings">
        <div className="edit-popup-binding-row">
          <span className="edit-popup-binding-type">Single</span>
          <input
            className="edit-popup-input"
            value={single}
            onChange={(e) => setSingle(e.target.value)}
            placeholder="none"
          />
        </div>
        <div className="edit-popup-binding-row">
          <span className="edit-popup-binding-type">Double</span>
          <input
            className="edit-popup-input"
            value={double}
            onChange={(e) => setDouble(e.target.value)}
            placeholder="none"
          />
        </div>
        <div className="edit-popup-binding-row">
          <span className="edit-popup-binding-type">Triple</span>
          <input
            className="edit-popup-input"
            value={triple}
            onChange={(e) => setTriple(e.target.value)}
            placeholder="none"
          />
        </div>
        <div className="edit-popup-binding-row">
          <span className="edit-popup-binding-type">Long</span>
          <input
            className="edit-popup-input"
            value={long}
            onChange={(e) => setLong(e.target.value)}
            placeholder="none"
          />
        </div>
        <div className="edit-popup-binding-row">
          <span className="edit-popup-binding-type">Down</span>
          <input
            className="edit-popup-input"
            value={down}
            onChange={(e) => setDown(e.target.value)}
            placeholder="none"
          />
        </div>
        <div className="edit-popup-binding-row">
          <span className="edit-popup-binding-type">Up</span>
          <input
            className="edit-popup-input"
            value={up}
            onChange={(e) => setUp(e.target.value)}
            placeholder="none"
          />
        </div>
        <div className="edit-popup-binding-row">
          <span className="edit-popup-binding-type">Turbo</span>
          <input
            className="edit-popup-input"
            value={turbo}
            onChange={(e) => setTurbo(e.target.value)}
            placeholder="none"
          />
        </div>
        <div className="edit-popup-binding-row">
          <span className="edit-popup-binding-type">Toggle</span>
          <input
            className="edit-popup-input"
            value={toggle}
            onChange={(e) => setToggle(e.target.value)}
            placeholder="none"
          />
        </div>
      </div>

      <div className="edit-popup-actions">
        <button className="edit-popup-cancel" onClick={onClose}>
          Cancel
        </button>
        <button className="edit-popup-save" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>,
    document.body,
  );
}
