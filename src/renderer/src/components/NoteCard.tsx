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
      <button
        onClick={onToggleCollapsed}
        aria-label="toggle note collapsed"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
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
        {isEditMode && (
          <span
            role="button"
            title="Delete note"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              color: "#64748b",
              cursor: "pointer",
              fontSize: 12,
              marginLeft: 8,
              flexShrink: 0,
            }}
          >
            ✕
          </span>
        )}
      </button>

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
