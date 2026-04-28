import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditPopup from "@keybinds/components/EditPopup";
import type { Button } from "@keybinds/data/types";

const rect = new DOMRect(100, 200, 52, 44);

const button: Button = {
  zone: "edit",
  label: "Copy",
  bindings: { single: "Ctrl+C", long: "Ctrl+Shift+C" },
};

describe("EditPopup", () => {
  it("renders pre-filled label and binding inputs", () => {
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Copy")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ctrl+C")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ctrl+Shift+C")).toBeInTheDocument();
  });

  it("shows button id in header", () => {
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Button #3")).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when ✕ is clicked", async () => {
    const onClose = vi.fn();
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onSave with updated button when Save is clicked", async () => {
    const onSave = vi.fn();
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    const labelInput = screen.getByDisplayValue("Copy");
    await userEvent.clear(labelInput);
    await userEvent.type(labelInput, "Duplicate");
    await userEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Duplicate", zone: "edit" }),
    );
  });

  it("selecting a zone pill updates the selected zone", async () => {
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("nav"));
    const navPill = screen.getByText("nav").closest("button");
    expect(navPill?.className).toContain("selected");
    const editPill = screen.getByText("edit").closest("button");
    expect(editPill?.className).not.toContain("selected");
  });

  it("omits empty bindings from the saved object", async () => {
    const onSave = vi.fn();
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={{ zone: "edit", label: "Copy", bindings: { single: "Ctrl+C" } }}
        rect={rect}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ bindings: { single: "Ctrl+C" } }),
    );
    const saved = onSave.mock.calls[0][0] as Button;
    expect(saved.bindings.long).toBeUndefined();
    expect(saved.bindings.double).toBeUndefined();
  });

  it("calls onClose when clicking outside the popup", async () => {
    const onClose = vi.fn();
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });
});
