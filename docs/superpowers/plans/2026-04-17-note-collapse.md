# Note Collapse / Expand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow notes to be collapsed to a single preview line by clicking the note header, with collapse state persisted to disk.

**Architecture:** Add optional `collapsed?: boolean` to both note types in `types.ts`. Wire a `toggleNoteCollapsed` action through `useNotes` → `NoteList` → `NoteCard`. `NoteCard` renders a clickable header row that shows a preview when collapsed and the full note when expanded. Collapse state is saved via the existing 500ms debounced save — no new IPC needed.

**Tech Stack:** React 19, TypeScript, Vitest, React Testing Library

---

## File Map

| File | Change |
|------|--------|
| `src/renderer/src/types.ts` | Add `collapsed?: boolean` to `TextNote` and `ChecklistNote` |
| `src/renderer/src/hooks/useNotes.ts` | Add `toggleNoteCollapsed(sectionId, noteId)` |
| `src/renderer/src/components/NoteCard.tsx` | Clickable header, collapsed preview, `getNotePreview` helper, new prop |
| `src/renderer/src/components/NoteList.tsx` | Pass `onToggleCollapsed` prop down |
| `src/renderer/src/App.tsx` | Wire `onToggleCollapsed` to `notes.toggleNoteCollapsed` |
| `tests/renderer/NoteCard.test.tsx` | Tests for collapse/expand behaviour and `getNotePreview` |
| `tests/main/notes-store.test.ts` | Verify `collapsed` field round-trips through save/load |
| `tests/renderer/useNotes.test.tsx` | New file — test `toggleNoteCollapsed` |

---

### Task 1: Add `collapsed` to types and write a round-trip test

**Files:**
- Modify: `src/renderer/src/types.ts`
- Modify: `tests/main/notes-store.test.ts`

- [ ] **Step 1: Add `collapsed` to `TextNote` and `ChecklistNote` in `types.ts`**

Replace the two interfaces so they become:

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

- [ ] **Step 2: Run typecheck to confirm no breakage**

```bash
npm run typecheck
```

Expected: exits 0 with no errors.

- [ ] **Step 3: Read `tests/main/notes-store.test.ts` to understand existing test structure, then add a round-trip test for `collapsed`**

Open `tests/main/notes-store.test.ts` and add this test inside the existing `describe` block:

```ts
it("round-trips collapsed field on notes", async () => {
  const data: AppData = {
    settings: { hotkeys: { toggleVisibility: "Alt+H", toggleEditMode: "Alt+E", startVoiceNote: "Alt+V" } },
    appearance: {
      bgColor: "#0f172a", headerColor: "#1e293b", accentColor: "#6366f1",
      textColor: "#e2e8f0", noteColor: "#1e293b", fontSize: 13,
      viewOpacity: 0.85, editOpacity: 1,
    },
    sections: [{
      id: "s1",
      name: "Test",
      notes: [{
        id: "n1",
        type: "text",
        content: "hello",
        collapsed: false,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      }],
    }],
  };
  await saveNotes(tmpPath, data);
  const loaded = await loadNotes(tmpPath);
  expect(loaded.sections[0].notes[0]).toMatchObject({ collapsed: false });
});
```

- [ ] **Step 4: Run the new test**

```bash
npx vitest run tests/main/notes-store.test.ts
```

Expected: all tests pass (the `collapsed` field is just JSON — `notes-store` already preserves unknown fields via spread).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/types.ts tests/main/notes-store.test.ts
git commit -m "feat: add collapsed field to Note types"
```

---

### Task 2: Add `toggleNoteCollapsed` to `useNotes`

**Files:**
- Modify: `src/renderer/src/hooks/useNotes.ts`
- Create: `tests/renderer/useNotes.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/renderer/useNotes.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotes } from "@renderer/hooks/useNotes";
import type { AppData } from "@renderer/types";

const makeData = (collapsed?: boolean): AppData => ({
  settings: {
    hotkeys: {
      toggleVisibility: "Alt+H",
      toggleEditMode: "Alt+E",
      startVoiceNote: "Alt+V",
    },
  },
  appearance: {
    bgColor: "#0f172a",
    headerColor: "#1e293b",
    accentColor: "#6366f1",
    textColor: "#e2e8f0",
    noteColor: "#1e293b",
    fontSize: 13,
    viewOpacity: 0.85,
    editOpacity: 1,
  },
  sections: [
    {
      id: "s1",
      name: "Test",
      notes: [
        {
          id: "n1",
          type: "text",
          content: "hello",
          collapsed,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    },
  ],
});

describe("useNotes — toggleNoteCollapsed", () => {
  it("flips collapsed from undefined (treated as true) to false", () => {
    const { result } = renderHook(() => useNotes(makeData(undefined)));
    const before = result.current.sections[0].notes[0].updatedAt;

    act(() => {
      result.current.toggleNoteCollapsed("s1", "n1");
    });

    const note = result.current.sections[0].notes[0];
    expect(note.collapsed).toBe(false);
    expect(note.updatedAt).toBe(before); // updatedAt must not change
  });

  it("flips collapsed from false to true", () => {
    const { result } = renderHook(() => useNotes(makeData(false)));

    act(() => {
      result.current.toggleNoteCollapsed("s1", "n1");
    });

    expect(result.current.sections[0].notes[0].collapsed).toBe(true);
  });

  it("flips collapsed from true to false", () => {
    const { result } = renderHook(() => useNotes(makeData(true)));

    act(() => {
      result.current.toggleNoteCollapsed("s1", "n1");
    });

    expect(result.current.sections[0].notes[0].collapsed).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npx vitest run tests/renderer/useNotes.test.tsx
```

Expected: FAIL — `toggleNoteCollapsed` is not a function.

- [ ] **Step 3: Add `toggleNoteCollapsed` to `useNotes.ts`**

In `src/renderer/src/hooks/useNotes.ts`:

Add `toggleNoteCollapsed` to the `UseNotesReturn` interface:

```ts
export interface UseNotesReturn {
  // ... existing fields ...
  toggleNoteCollapsed: (sectionId: string, noteId: string) => void;
}
```

Add the implementation inside `useNotes`, alongside the other `useCallback` actions:

```ts
const toggleNoteCollapsed = useCallback(
  (sectionId: string, noteId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          notes: s.notes.map((n) =>
            n.id === noteId
              ? ({ ...n, collapsed: !(n.collapsed ?? true) } as Note)
              : n,
          ),
        };
      }),
    );
  },
  [],
);
```

Add `toggleNoteCollapsed` to the return object at the bottom of `useNotes`.

- [ ] **Step 4: Run the tests**

```bash
npx vitest run tests/renderer/useNotes.test.tsx
```

Expected: all 3 tests pass.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/hooks/useNotes.ts tests/renderer/useNotes.test.tsx
git commit -m "feat: add toggleNoteCollapsed action to useNotes"
```

---

### Task 3: Update `NoteCard` with collapse UI

**Files:**
- Modify: `src/renderer/src/components/NoteCard.tsx`
- Modify: `tests/renderer/NoteCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

Replace the contents of `tests/renderer/NoteCard.test.tsx` with:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NoteCard } from "@renderer/components/NoteCard";
import type { Note } from "@renderer/types";

const textNote: Note = {
  id: "n1",
  type: "text",
  content: "First line\nSecond line",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const checklistNote: Note = {
  id: "n2",
  type: "checklist",
  content: [
    { id: "i1", text: "Item 1", checked: false },
    { id: "i2", text: "Item 2", checked: true },
  ],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const emptyTextNote: Note = {
  id: "n3",
  type: "text",
  content: "",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const emptyChecklistNote: Note = {
  id: "n4",
  type: "checklist",
  content: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const noop = () => {};

describe("getNotePreview", () => {
  it("returns first line of text note", () => {
    render(
      <NoteCard
        note={{ ...textNote, collapsed: true }}
        isEditMode={false}
        onUpdate={noop}
        onDelete={noop}
        onToggleCollapsed={noop}
      />,
    );
    expect(screen.getByText("First line")).toBeInTheDocument();
    expect(screen.queryByText("Second line")).not.toBeInTheDocument();
  });

  it("returns first checklist item text", () => {
    render(
      <NoteCard
        note={{ ...checklistNote, collapsed: true }}
        isEditMode={false}
        onUpdate={noop}
        onDelete={noop}
        onToggleCollapsed={noop}
      />,
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.queryByText("Item 2")).not.toBeInTheDocument();
  });

  it("falls back to 'Empty note' for empty text note", () => {
    render(
      <NoteCard
        note={{ ...emptyTextNote, collapsed: true }}
        isEditMode={false}
        onUpdate={noop}
        onDelete={noop}
        onToggleCollapsed={noop}
      />,
    );
    expect(screen.getByText("Empty note")).toBeInTheDocument();
  });

  it("falls back to 'Empty checklist' for empty checklist note", () => {
    render(
      <NoteCard
        note={{ ...emptyChecklistNote, collapsed: true }}
        isEditMode={false}
        onUpdate={noop}
        onDelete={noop}
        onToggleCollapsed={noop}
      />,
    );
    expect(screen.getByText("Empty checklist")).toBeInTheDocument();
  });
});

describe("NoteCard collapse/expand", () => {
  it("defaults to collapsed when collapsed is undefined", () => {
    render(
      <NoteCard
        note={textNote}
        isEditMode={false}
        onUpdate={noop}
        onDelete={noop}
        onToggleCollapsed={noop}
      />,
    );
    // full content not rendered when collapsed
    expect(screen.queryByText("Second line")).not.toBeInTheDocument();
  });

  it("shows full content when collapsed is false", () => {
    render(
      <NoteCard
        note={{ ...textNote, collapsed: false }}
        isEditMode={false}
        onUpdate={noop}
        onDelete={noop}
        onToggleCollapsed={noop}
      />,
    );
    expect(screen.getByText(/Second line/)).toBeInTheDocument();
  });

  it("calls onToggleCollapsed when header is clicked", async () => {
    const toggle = vi.fn();
    render(
      <NoteCard
        note={{ ...textNote, collapsed: true }}
        isEditMode={false}
        onUpdate={noop}
        onDelete={noop}
        onToggleCollapsed={toggle}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /toggle/i }));
    expect(toggle).toHaveBeenCalledOnce();
  });

  it("shows delete button in edit mode when collapsed", () => {
    const del = vi.fn();
    render(
      <NoteCard
        note={{ ...textNote, collapsed: true }}
        isEditMode={true}
        onUpdate={noop}
        onDelete={del}
        onToggleCollapsed={noop}
      />,
    );
    expect(screen.getByTitle("Delete note")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
npx vitest run tests/renderer/NoteCard.test.tsx
```

Expected: FAIL — `onToggleCollapsed` prop not accepted, collapsed behaviour missing.

- [ ] **Step 3: Rewrite `NoteCard.tsx`**

Replace `src/renderer/src/components/NoteCard.tsx` with:

```tsx
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
          {isCollapsed ? getNotePreview(note) : getNotePreview(note)}
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
```

- [ ] **Step 4: Run NoteCard tests**

```bash
npx vitest run tests/renderer/NoteCard.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Run full suite**

```bash
npm test
```

Expected: only NoteCard tests change — no regressions elsewhere. (The existing `NoteList` tests may fail because `NoteCard` now requires `onToggleCollapsed` — fix those next in Task 4.)

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/NoteCard.tsx tests/renderer/NoteCard.test.tsx
git commit -m "feat: add collapse/expand UI to NoteCard"
```

---

### Task 4: Wire `onToggleCollapsed` through `NoteList` and `App`

**Files:**
- Modify: `src/renderer/src/components/NoteList.tsx`
- Modify: `src/renderer/src/App.tsx`

- [ ] **Step 1: Update `NoteList.tsx`**

Replace `src/renderer/src/components/NoteList.tsx` with:

```tsx
import { NoteCard } from "./NoteCard";
import type { Note } from "../types";
import { JSX } from "react";

interface Props {
  notes: Note[];
  isEditMode: boolean;
  onUpdate: (noteId: string, content: Note["content"]) => void;
  onDelete: (noteId: string) => void;
  onToggleCollapsed: (noteId: string) => void;
}

export function NoteList({
  notes,
  isEditMode,
  onUpdate,
  onDelete,
  onToggleCollapsed,
}: Props): JSX.Element {
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
          onToggleCollapsed={() => onToggleCollapsed(note.id)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Update `App.tsx` to pass `onToggleCollapsed`**

In `src/renderer/src/App.tsx`, find the `<NoteList ... />` render (around line 284) and add the new prop:

```tsx
<NoteList
  notes={activeSection.notes}
  isEditMode={mode === "edit"}
  onUpdate={(noteId, content) =>
    notes.updateNote(activeSection.id, noteId, content)
  }
  onDelete={(noteId) => notes.deleteNote(activeSection.id, noteId)}
  onToggleCollapsed={(noteId) =>
    notes.toggleNoteCollapsed(activeSection.id, noteId)
  }
/>
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: exits 0 with no errors.

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/NoteList.tsx src/renderer/src/App.tsx
git commit -m "feat: wire toggleNoteCollapsed through NoteList and App"
```

---

### Task 5: Run lint, final check, done

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: no errors or warnings.

- [ ] **Step 2: Run full test suite one final time**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Manually verify in dev** (optional but recommended)

```bash
npm run dev
```

- Notes should appear collapsed showing only the first line preview.
- Clicking the header toggles open/closed.
- Closing and reopening the app should preserve collapse state.
- Delete button in edit mode should be visible even when collapsed.
