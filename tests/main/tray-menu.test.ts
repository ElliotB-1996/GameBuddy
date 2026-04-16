import { describe, it, expect, vi } from "vitest";
import { buildTrayMenuItems } from "../../src/main/tray-menu";

describe("buildTrayMenuItems", () => {
  it('shows "Hide Overlay" when window is visible', () => {
    const items = buildTrayMenuItems(true, "view", vi.fn(), vi.fn(), vi.fn());
    expect(items[0].label).toBe("Hide Overlay");
  });

  it('shows "Show Overlay" when window is hidden', () => {
    const items = buildTrayMenuItems(false, "view", vi.fn(), vi.fn(), vi.fn());
    expect(items[0].label).toBe("Show Overlay");
  });

  it('shows "Switch to Edit Mode" in view mode', () => {
    const items = buildTrayMenuItems(true, "view", vi.fn(), vi.fn(), vi.fn());
    expect(items[1].label).toBe("Switch to Edit Mode");
  });

  it('shows "Switch to View Mode" in edit mode', () => {
    const items = buildTrayMenuItems(true, "edit", vi.fn(), vi.fn(), vi.fn());
    expect(items[1].label).toBe("Switch to View Mode");
  });

  it("calls onToggleVisibility when first item is clicked", () => {
    const onToggleVisibility = vi.fn();
    const items = buildTrayMenuItems(
      true,
      "view",
      onToggleVisibility,
      vi.fn(),
      vi.fn(),
    );
    (items[0].click as () => void)();
    expect(onToggleVisibility).toHaveBeenCalledOnce();
  });

  it("calls onToggleMode when second item is clicked", () => {
    const onToggleMode = vi.fn();
    const items = buildTrayMenuItems(
      true,
      "view",
      vi.fn(),
      onToggleMode,
      vi.fn(),
    );
    (items[1].click as () => void)();
    expect(onToggleMode).toHaveBeenCalledOnce();
  });

  it("calls onQuit when Quit item is clicked", () => {
    const onQuit = vi.fn();
    const items = buildTrayMenuItems(true, "view", vi.fn(), vi.fn(), onQuit);
    const quitItem = items.find((i) => i.label === "Quit")!;
    (quitItem.click as () => void)();
    expect(onQuit).toHaveBeenCalledOnce();
  });

  it("includes a separator between mode toggle and Quit", () => {
    const items = buildTrayMenuItems(true, "view", vi.fn(), vi.fn(), vi.fn());
    expect(items[2].type).toBe("separator");
  });
});
