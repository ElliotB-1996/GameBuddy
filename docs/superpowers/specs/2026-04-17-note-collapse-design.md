# Note Collapse / Expand — Design Spec

**Date:** 2026-04-17

## Summary

Add the ability to collapse any note down to a single preview line and expand it again. Collapse state persists to disk. All notes default to collapsed.

## Behaviour

- Clicking the header row of a `NoteCard` toggles collapsed/expanded.
- Works in both view mode and edit mode.
- All notes start collapsed (including existing notes loaded from disk that have no `collapsed` field).
- Collapse state is saved immediately via the existing debounced save path — no new IPC required.

## Data Layer

### `types.ts`

Add `collapsed?: boolean` to both `TextNote` and `ChecklistNote`:

```ts
export interface TextNote {
  id: string;
  type: "text";
  content: string;
  collapsed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistNote {
  id: string;
  type: "checklist";
  content: ChecklistItem[];
  collapsed?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

`collapsed` is optional so existing saved notes without the field deserialise cleanly. Absence is treated as `true` (collapsed) at render time.

### `useNotes.ts`

Add `toggleNoteCollapsed(sectionId: string, noteId: string)` to `UseNotesReturn`. Implementation flips `note.collapsed` in `setSections`. Does **not** update `updatedAt` — this is a display preference, not a content change.

## UI Layer

### `NoteCard.tsx`

New prop: `onToggleCollapsed: () => void`.

Structure:

```
<div> (card container)
  <div onClick={onToggleCollapsed}> (header row, full width, cursor:pointer)
    {collapsed ? <preview line> : <note type label or first line>}
    {isEditMode && <delete button>}  ← always visible
  </div>
  {!collapsed && (
    <>
      <TextNote | ChecklistNote />
      <timestamp />
    </>
  )}
</div>
```

**Preview text** (pure helper function `getNotePreview(note: Note): string`):
- `TextNote`: first line of `content` (split on `\n`), fallback `"Empty note"`
- `ChecklistNote`: first item's `text`, fallback `"Empty checklist"`

Both truncated via CSS `text-overflow: ellipsis` on a single line.

**Collapsed state default:** `const isCollapsed = note.collapsed ?? true`

### `NoteList.tsx`

Pass `onToggleCollapsed={() => onToggleCollapsed(note.id)}` down to each `NoteCard`. Receives `onToggleCollapsed: (noteId: string) => void` as a new prop.

### `App.tsx` (or wherever `NoteList` is rendered)

Wire `onToggleCollapsed` through to `useNotes.toggleNoteCollapsed(sectionId, noteId)`.

## What Does Not Change

- Save/load path — `notes-store.ts` already handles unknown fields gracefully via spread merge.
- IPC handlers — no new handlers needed.
- `updatedAt` — not touched by collapse toggle.

## Testing

- `useNotes`: test that `toggleNoteCollapsed` flips `collapsed` and does not change `updatedAt`.
- `NoteCard`: test collapsed renders preview line; test expanded renders full content; test header click calls `onToggleCollapsed`.
- `getNotePreview`: unit test with text note, checklist note, empty variants.
