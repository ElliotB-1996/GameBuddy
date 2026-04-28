import { useState, useEffect } from "react";
import type { Profile, Zone, Button } from "../data/types";
import { CYBORG_GRID, CYRO_GRID } from "../data/layout";
import Btn from "./Btn";
import CyborgThumb from "./CyborgThumb";
import CyroThumb from "./CyroThumb";
import EditPopup from "./EditPopup";

interface Props {
  profile: Profile;
  activeZone: Zone | null;
  className?: string;
  onSave: (
    profileId: string,
    layerKey: string,
    buttonId: string,
    updated: Button,
  ) => void;
}

export default function DeviceSection({
  profile,
  activeZone,
  className,
  onSave,
}: Props): JSX.Element {
  const [activeLayer, setActiveLayer] = useState<string>("default");
  const [isEditing, setIsEditing] = useState(false);
  const [editingButton, setEditingButton] = useState<{
    id: string;
    layerKey: string;
    rect: DOMRect;
  } | null>(null);

  const layerKeys = [
    "default",
    ...Object.keys(profile.layers).filter((k) => k !== "default"),
  ];
  const layer = profile.layers[activeLayer] ?? profile.layers.default;
  const grid = profile.device === "cyborg" ? CYBORG_GRID : CYRO_GRID;
  const gridClass = profile.device === "cyborg" ? "cyborg-grid" : "cyro-grid";

  useEffect(() => {
    if (!isEditing) return;
    function handleKey(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        setIsEditing(false);
        setEditingButton(null);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isEditing]);

  function toggleEditing(): void {
    setIsEditing((prev) => !prev);
    setEditingButton(null);
  }

  function handleEditButton(id: string, rect: DOMRect): void {
    setEditingButton({ id, layerKey: activeLayer, rect });
  }

  function handlePopupSave(updated: Button): void {
    if (!editingButton) return;
    onSave(profile.id, editingButton.layerKey, editingButton.id, updated);
    setEditingButton(null);
  }

  function layerLabel(key: string): string {
    if (profile.layerLabels?.[key]) return profile.layerLabels[key];
    if (key === "default") return "Default";
    if (key === "shift") return "Shift";
    const m = /^shift-(\d+)$/.exec(key);
    if (m) return `Shift ${m[1]}`;
    return key;
  }

  const editingButtonData = editingButton
    ? (profile.layers[editingButton.layerKey]?.[editingButton.id] ?? {
        zone: "unzoned" as Zone,
        label: "",
        bindings: {},
      })
    : null;

  return (
    <div
      className={`device-section ${className ?? ""}${isEditing ? " editing" : ""}`}
    >
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
        <button
          className={`edit-toggle${isEditing ? " active" : ""}`}
          onClick={toggleEditing}
        >
          ✎ {isEditing ? "Editing" : "Edit"}
        </button>
      </div>

      {isEditing && (
        <div className="edit-hint">Click any button to edit it</div>
      )}

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
                isEditing={isEditing}
                onEditButton={handleEditButton}
              />
            ) : (
              <div key={`sp-${i}`} className="spacer" />
            ),
          )}
      </div>

      {profile.device === "cyborg" ? (
        <CyborgThumb
          layer={layer}
          activeZone={activeZone}
          isEditing={isEditing}
          onEditButton={handleEditButton}
        />
      ) : (
        <CyroThumb
          layer={layer}
          activeZone={activeZone}
          isEditing={isEditing}
          onEditButton={handleEditButton}
        />
      )}

      {editingButton && editingButtonData && (
        <EditPopup
          buttonId={editingButton.id}
          layerKey={editingButton.layerKey}
          button={editingButtonData}
          rect={editingButton.rect}
          onSave={handlePopupSave}
          onClose={() => setEditingButton(null)}
        />
      )}
    </div>
  );
}
