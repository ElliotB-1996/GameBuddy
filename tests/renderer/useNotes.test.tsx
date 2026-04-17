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
