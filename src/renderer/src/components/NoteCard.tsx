import { TextNote } from "./TextNote";
import { ChecklistNote } from "./ChecklistNote";
import type { Note } from "../types";
import { JSX } from "react";

function getNotePreview(note: Note): string {
  if (note.type === "text") {
    return note.content.split("\n")[0] || "Empty note";
  }
  return note.content[0]?.text || "Empty checklist";
}

interface Props {
  note: Note;
  isEditMode: boolean;
  onUpdate: (content: Note["content"]) => void;
  onDelete: () => void;
  onToggleCollapsed: () => void;
}

export function NoteCard({
  note,
  isEditMode,
  onUpdate,
  onDelete,
  onToggleCollapsed,
}: Props): JSX.Element {
  const isCollapsed = note.collapsed ?? true;

  return (
    <div
      style={{
        background: "var(--overlay-note)",
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <button
          onClick={onToggleCollapsed}
          aria-label="toggle note collapsed"
          aria-expanded={!isCollapsed}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "7px 10px",
            textAlign: "left",
          }}
        >
          <span
            style={{
              color: "#e2e8f0",
              fontSize: 13,
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {getNotePreview(note)}
          </span>
        </button>

        {isEditMode && (
          <button
            onClick={onDelete}
            title="Delete note"
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: 12,
              padding: "7px 10px",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div style={{ padding: "0 10px 8px" }}>
          {note.type === "text" ? (
            <TextNote
              content={note.content}
              isEditMode={isEditMode}
              onChange={onUpdate}
            />
          ) : (
            <ChecklistNote
              items={note.content}
              isEditMode={isEditMode}
              onChange={onUpdate}
            />
          )}
          <div
            style={{
              color: "#475569",
              fontSize: 10,
              marginTop: 4,
              textAlign: "right",
            }}
          >
            {new Date(note.updatedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
