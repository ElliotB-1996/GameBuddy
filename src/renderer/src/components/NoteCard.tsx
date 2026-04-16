import { TextNote } from "./TextNote";
import { ChecklistNote } from "./ChecklistNote";
import type { Note } from "../types";
import { JSX } from "react";

interface Props {
  note: Note;
  isEditMode: boolean;
  onUpdate: (content: Note["content"]) => void;
  onDelete: () => void;
}

export function NoteCard({
  note,
  isEditMode,
  onUpdate,
  onDelete,
}: Props): JSX.Element {
  return (
    <div
      style={{
        background: "var(--overlay-note)",
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "8px 10px",
        position: "relative",
      }}
    >
      {isEditMode && (
        <button
          onClick={onDelete}
          title="Delete note"
          style={{
            position: "absolute",
            top: 4,
            right: 6,
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 12,
            padding: 0,
          }}
        >
          ✕
        </button>
      )}
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
  );
}
