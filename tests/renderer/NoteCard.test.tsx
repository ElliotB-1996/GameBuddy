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

  it("delete button calls onDelete, not onToggleCollapsed", async () => {
    const del = vi.fn();
    const toggle = vi.fn();
    render(
      <NoteCard
        note={{ ...textNote, collapsed: true }}
        isEditMode={true}
        onUpdate={noop}
        onDelete={del}
        onToggleCollapsed={toggle}
      />,
    );
    await userEvent.click(screen.getByTitle("Delete note"));
    expect(del).toHaveBeenCalledOnce();
    expect(toggle).not.toHaveBeenCalled();
  });
});
