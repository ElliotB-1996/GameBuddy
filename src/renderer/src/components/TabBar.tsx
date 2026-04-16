import { JSX, useState } from "react";
import type { Section } from "../types";

interface Props {
  sections: Section[];
  activeSectionId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  isEditMode: boolean;
}

export function TabBar({
  sections,
  activeSectionId,
  onSelect,
  onAdd,
  onRename,
  isEditMode,
}: Props): JSX.Element {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");

  const handleRenameStart = (id: string, currentName: string): void => {
    if (!isEditMode) return;
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const handleRenameCommit = (): void => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleAddCommit = (): void => {
    if (newName.trim()) onAdd(newName.trim());
    setAddingNew(false);
    setNewName("");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        overflowX: "auto",
        padding: "4px 8px",
      }}
    >
      {sections.map((s) => (
        <div key={s.id}>
          {renamingId === s.id ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameCommit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameCommit();
                if (e.key === "Escape") setRenamingId(null);
              }}
              style={{
                width: 80,
                fontSize: 12,
                borderRadius: 4,
                border: "1px solid #4ade80",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                padding: "2px 6px",
              }}
            />
          ) : (
            <button
              onClick={() => onSelect(s.id)}
              onDoubleClick={() => handleRenameStart(s.id, s.name)}
              title={isEditMode ? "Double-click to rename" : undefined}
              style={{
                background:
                  s.id === activeSectionId ? "rgba(255,255,255,0.15)" : "none",
                border: "none",
                borderRadius: 4,
                color: "#e2e8f0",
                cursor: "pointer",
                fontSize: 12,
                padding: "3px 10px",
                whiteSpace: "nowrap",
              }}
            >
              {s.name}
            </button>
          )}
        </div>
      ))}

      {addingNew ? (
        <input
          autoFocus
          value={newName}
          placeholder="Section name"
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleAddCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddCommit();
            if (e.key === "Escape") {
              setAddingNew(false);
              setNewName("");
            }
          }}
          style={{
            width: 100,
            fontSize: 12,
            borderRadius: 4,
            border: "1px solid #4ade80",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            padding: "2px 6px",
          }}
        />
      ) : (
        isEditMode && (
          <button
            onClick={() => setAddingNew(true)}
            title="Add section"
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            +
          </button>
        )
      )}
    </div>
  );
}
