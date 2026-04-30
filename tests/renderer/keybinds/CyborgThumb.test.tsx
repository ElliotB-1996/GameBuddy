import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CyborgThumb from "@keybinds/components/CyborgThumb";
import type { Layer } from "@keybinds/data/types";

const layer: Layer = {
  "22": { zone: "thumb", label: "Jump", bindings: { single: "Space" } },
};

describe("CyborgThumb", () => {
  it("renders a thumb button label", () => {
    render(<CyborgThumb layer={layer} activeZone={null} />);
    expect(screen.getByText("Jump")).toBeInTheDocument();
  });

  it("fires onEditButton when a thumb button is clicked in edit mode", async () => {
    const onEditButton = vi.fn();
    render(
      <CyborgThumb
        layer={layer}
        activeZone={null}
        isEditing={true}
        onEditButton={onEditButton}
      />,
    );
    await userEvent.click(screen.getByText("Jump").closest(".tbtn")!);
    expect(onEditButton).toHaveBeenCalledWith("22", expect.any(Object));
  });

  it("does not fire onEditButton when isEditing is false", async () => {
    const onEditButton = vi.fn();
    render(
      <CyborgThumb
        layer={layer}
        activeZone={null}
        isEditing={false}
        onEditButton={onEditButton}
      />,
    );
    await userEvent.click(screen.getByText("Jump").closest(".tbtn")!);
    expect(onEditButton).not.toHaveBeenCalled();
  });

  it("dims thumb button when highlightedButtons is set and id not in set", () => {
    render(
      <CyborgThumb
        layer={layer}
        activeZone={null}
        highlightedButtons={new Set(["99"])}
      />,
    );
    const btn = screen.getByText("Jump").closest(".tbtn") as HTMLElement;
    expect(btn.style.opacity).toBe("0.1");
  });

  it("does not dim thumb button when id is in highlightedButtons", () => {
    render(
      <CyborgThumb
        layer={layer}
        activeZone={null}
        highlightedButtons={new Set(["22"])}
      />,
    );
    const btn = screen.getByText("Jump").closest(".tbtn") as HTMLElement;
    expect(btn.style.opacity).toBe("");
  });
});
