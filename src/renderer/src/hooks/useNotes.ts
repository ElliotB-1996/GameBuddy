import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { AppData, Section, Note, Settings, ChecklistItem } from "../types";

export interface UseNotesReturn {
  sections: Section[];
  settings: Settings;
  addSection: (name: string) => void;
  renameSection: (sectionId: string, name: string) => void;
  deleteSection: (sectionId: string) => void;
  addTextNote: (sectionId: string, content: string) => void;
  addChecklistNote: (sectionId: string) => void;
  updateNote: (
    sectionId: string,
    noteId: string,
    content: Note["content"],
  ) => void;
  deleteNote: (sectionId: string, noteId: string) => void;
  updateSettings: (settings: Settings) => void;
  getAppData: () => AppData;
}

export function useNotes(initialData: AppData): UseNotesReturn {
  const [sections, setSections] = useState<Section[]>(initialData.sections);
  const [settings, setSettings] = useState<Settings>(initialData.settings);

  const now = () => new Date().toISOString();

  const addSection = useCallback((name: string) => {
    setSections((prev) => [...prev, { id: uuidv4(), name, notes: [] }]);
  }, []);

  const renameSection = useCallback((sectionId: string, name: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, name } : s)),
    );
  }, []);

  const deleteSection = useCallback((sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }, []);

  const addTextNote = useCallback((sectionId: string, content: string) => {
    const note: Note = {
      id: uuidv4(),
      type: "text",
      content,
      createdAt: now(),
      updatedAt: now(),
    };
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, notes: [note, ...s.notes] } : s,
      ),
    );
  }, []);

  const addChecklistNote = useCallback((sectionId: string) => {
    const item: ChecklistItem = { id: uuidv4(), text: "", checked: false };
    const note: Note = {
      id: uuidv4(),
      type: "checklist",
      content: [item],
      createdAt: now(),
      updatedAt: now(),
    };
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, notes: [note, ...s.notes] } : s,
      ),
    );
  }, []);

  const updateNote = useCallback(
    (sectionId: string, noteId: string, content: Note["content"]) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            notes: s.notes.map((n) =>
              n.id === noteId
                ? ({ ...n, content, updatedAt: now() } as Note)
                : n,
            ),
          };
        }),
      );
    },
    [],
  );

  const deleteNote = useCallback((sectionId: string, noteId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, notes: s.notes.filter((n) => n.id !== noteId) };
      }),
    );
  }, []);

  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
  }, []);

  const getAppData = useCallback(
    (): AppData => ({ settings, sections }),
    [settings, sections],
  );

  return {
    sections,
    settings,
    addSection,
    renameSection,
    deleteSection,
    addTextNote,
    addChecklistNote,
    updateNote,
    deleteNote,
    updateSettings,
    getAppData,
  };
}
