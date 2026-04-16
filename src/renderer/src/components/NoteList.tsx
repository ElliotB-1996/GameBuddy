import { NoteCard } from "./NoteCard";
import type { Note } from "../types";

interface Props {
  notes: Note[];
  isEditMode: boolean;
  onUpdate: (noteId: string, content: Note["content"]) => void;
  onDelete: (noteId: string) => void;
}

export function NoteList({ notes, isEditMode, onUpdate, onDelete }: Props) {
  const sorted = [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <div
        style={{
          color: "#475569",
          fontSize: 13,
          padding: "16px 0",
          textAlign: "center",
        }}
      >
        No notes yet.{" "}
        {isEditMode ? "Add one above." : "Switch to edit mode to add notes."}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sorted.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isEditMode={isEditMode}
          onUpdate={(content) => onUpdate(note.id, content)}
          onDelete={() => onDelete(note.id)}
        />
      ))}
    </div>
  );
}
