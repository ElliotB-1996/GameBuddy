import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CombosPanel from "@keybinds/components/CombosPanel";
import type { Combo, Device } from "@keybinds/data/types";

const combos: { combo: Combo; device: Device }[] = [
  {
    device: "cyborg",
    combo: {
      buttons: ["1", "2"],
      zone: "edit",
      label: "Copy All",
      bindings: { single: "Ctrl+A" },
      layer: "default",
    },
  },
  {
    device: "cyro",
    combo: {
      buttons: ["3"],
      zone: "nav",
      label: "Page Up",
      bindings: { long: "PgUp" },
      layer: "shift",
    },
  },
];

describe("CombosPanel", () => {
  it("renders empty state when no combos", () => {
    render(
      <CombosPanel combos={[]} selectedIndex={null} onSelect={vi.fn()} />,
    );
    expect(
      screen.getByText("No combos defined for this profile."),
    ).toBeInTheDocument();
  });

  it("renders the panel title", () => {
    render(
      <CombosPanel combos={combos} selectedIndex={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("Combos")).toBeInTheDocument();
  });

  it("renders combo labels", () => {
    render(
      <CombosPanel combos={combos} selectedIndex={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("Copy All")).toBeInTheDocument();
    expect(screen.getByText("Page Up")).toBeInTheDocument();
  });

  it("renders button chips for each button in a combo", () => {
    render(
      <CombosPanel combos={combos} selectedIndex={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  it("calls onSelect with index when a row is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <CombosPanel combos={combos} selectedIndex={null} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByText("Copy All"));
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it("calls onSelect with null when the selected row is clicked again", async () => {
    const onSelect = vi.fn();
    render(
      <CombosPanel combos={combos} selectedIndex={0} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByText("Copy All"));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("adds selected class to the active row", () => {
    const { container } = render(
      <CombosPanel combos={combos} selectedIndex={0} onSelect={vi.fn()} />,
    );
    const rows = container.querySelectorAll(".combo-row");
    expect(rows[0].classList.contains("selected")).toBe(true);
    expect(rows[1].classList.contains("selected")).toBe(false);
  });

  it("renders binding key and value", () => {
    render(
      <CombosPanel combos={combos} selectedIndex={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("Ctrl+A")).toBeInTheDocument();
    expect(screen.getByText("PgUp")).toBeInTheDocument();
  });

  it("renders layer badge only when layer is not default", () => {
    render(
      <CombosPanel combos={combos} selectedIndex={null} onSelect={vi.fn()} />,
    );
    const layerBadges = document.querySelectorAll(".combo-layer");
    expect(layerBadges).toHaveLength(1);
    expect(layerBadges[0].textContent).toBe("shift");
  });
});
