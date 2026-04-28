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
const POPUP_HEIGHT = 330;

interface Props {
  buttonId: string;
  layerKey: string;
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
  const [long, setLong] = useState(button.bindings.long ?? "");
  const [double, setDouble] = useState(button.bindings.double ?? "");
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
    if (long) bindings.long = long;
    if (double) bindings.double = double;
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
          <span className="edit-popup-binding-type">Long</span>
          <input
            className="edit-popup-input"
            value={long}
            onChange={(e) => setLong(e.target.value)}
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
