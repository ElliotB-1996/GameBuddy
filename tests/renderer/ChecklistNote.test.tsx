import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChecklistNote } from "@renderer/components/ChecklistNote";
import type { ChecklistItem } from "@renderer/types";

const makeItems = (count: number): ChecklistItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    text: `Item ${i}`,
    checked: false,
  }));

describe("ChecklistNote", () => {
  it("renders all checklist items in view mode", () => {
    const items = makeItems(3);
    render(
      <ChecklistNote items={items} isEditMode={false} onChange={() => {}} />,
    );
    expect(screen.getByText("Item 0")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders input fields in edit mode", () => {
    const items = makeItems(2);
    render(
      <ChecklistNote items={items} isEditMode={true} onChange={() => {}} />,
    );
    const inputs = screen.getAllByPlaceholderText("Item...");
    expect(inputs).toHaveLength(2);
  });

  it("inserts a new item after the current one when Enter is pressed", async () => {
    const user = userEvent.setup();
    const items = makeItems(3);
    const onChange = vi.fn();

    render(
      <ChecklistNote items={items} isEditMode={true} onChange={onChange} />,
    );

    const inputs = screen.getAllByPlaceholderText("Item...");
    await user.click(inputs[1]);
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledTimes(1);
    const newItems: ChecklistItem[] = onChange.mock.calls[0][0];
    expect(newItems).toHaveLength(4);
    // New item is inserted after index 1
    expect(newItems[0].id).toBe("item-0");
    expect(newItems[1].id).toBe("item-1");
    // Index 2 is the newly created item
    expect(newItems[2].text).toBe("");
    expect(newItems[2].checked).toBe(false);
    expect(newItems[3].id).toBe("item-2");
  });

  it("inserts after the last item when Enter is pressed on it", async () => {
    const user = userEvent.setup();
    const items = makeItems(2);
    const onChange = vi.fn();

    render(
      <ChecklistNote items={items} isEditMode={true} onChange={onChange} />,
    );

    const inputs = screen.getAllByPlaceholderText("Item...");
    await user.click(inputs[1]);
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledTimes(1);
    const newItems: ChecklistItem[] = onChange.mock.calls[0][0];
    expect(newItems).toHaveLength(3);
    expect(newItems[2].text).toBe("");
  });

  it("does not insert on Enter in view mode (no inputs rendered)", () => {
    const items = makeItems(2);
    const onChange = vi.fn();

    render(
      <ChecklistNote items={items} isEditMode={false} onChange={onChange} />,
    );

    // In view mode there are no text inputs, only checkboxes
    const inputs = screen.queryAllByPlaceholderText("Item...");
    expect(inputs).toHaveLength(0);
  });
});
