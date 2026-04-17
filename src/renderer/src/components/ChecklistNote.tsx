import { v4 as uuidv4 } from "uuid";
import type { ChecklistItem } from "../types";
import { JSX, useRef, useEffect, useCallback } from "react";

interface Props {
  items: ChecklistItem[];
  isEditMode: boolean;
  onChange: (items: ChecklistItem[]) => void;
}

export function ChecklistNote({
  items,
  isEditMode,
  onChange,
}: Props): JSX.Element {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const pendingFocusId = useRef<string | null>(null);

  useEffect(() => {
    if (pendingFocusId.current) {
      const el = inputRefs.current.get(pendingFocusId.current);
      if (el) {
        el.focus();
      }
      pendingFocusId.current = null;
    }
  }, [items]);

  const setInputRef = useCallback(
    (id: string) => (el: HTMLInputElement | null) => {
      if (el) {
        inputRefs.current.set(id, el);
      } else {
        inputRefs.current.delete(id);
      }
    },
    [],
  );

  const toggle = (id: string): void =>
    onChange(
      items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    );
  const updateText = (id: string, text: string): void =>
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)));
  const addItem = (): void =>
    onChange([...items, { id: uuidv4(), text: "", checked: false }]);
  const insertItemAfter = (id: string): void => {
    const index = items.findIndex((i) => i.id === id);
    const newItem: ChecklistItem = {
      id: uuidv4(),
      text: "",
      checked: false,
    };
    const updated = [...items];
    updated.splice(index + 1, 0, newItem);
    pendingFocusId.current = newItem.id;
    onChange(updated);
  };
  const removeItem = (id: string): void =>
    onChange(items.filter((i) => i.id !== id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => toggle(item.id)}
            style={{ accentColor: "#4ade80", cursor: "pointer" }}
          />
          {isEditMode ? (
            <>
              <input
                ref={setInputRef(item.id)}
                value={item.text}
                onChange={(e) => updateText(item.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    insertItemAfter(item.id);
                  }
                }}
                placeholder="Item..."
                style={{
                  background: "transparent",
                  border: "none",
                  color: item.checked ? "#64748b" : "#e2e8f0",
                  fontSize: 13,
                  flex: 1,
                  outline: "none",
                  textDecoration: item.checked ? "line-through" : "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={() => removeItem(item.id)}
                style={{
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
            </>
          ) : (
            <span
              style={{
                color: item.checked ? "#64748b" : "#e2e8f0",
                fontSize: 13,
                textDecoration: item.checked ? "line-through" : "none",
              }}
            >
              {item.text || <span style={{ color: "#475569" }}>—</span>}
            </span>
          )}
        </div>
      ))}
      {isEditMode && (
        <button
          onClick={addItem}
          style={{
            alignSelf: "flex-start",
            background: "none",
            border: "none",
            color: "#4ade80",
            cursor: "pointer",
            fontSize: 12,
            padding: "2px 0",
          }}
        >
          + Add item
        </button>
      )}
    </div>
  );
}
