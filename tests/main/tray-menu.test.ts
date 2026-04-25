import { describe, it, expect, vi } from "vitest";
import { buildTrayMenuItems } from "../../src/main/tray-menu";

function build(
  notesVisible = true,
  keybindsVisible = false,
  mode: "view" | "edit" = "view",
) {
  return buildTrayMenuItems(
    notesVisible,
    mode,
    keybindsVisible,
    vi.fn(),
    vi.fn(),
    vi.fn(),
    vi.fn(),
  );
}

describe("buildTrayMenuItems — notes overlay", () => {
  it('shows "Hide Overlay" when notes window is visible', () => {
    expect(build(true).find(i => i.label?.includes("Overlay"))?.label).toBe("Hide Overlay");
  });

  it('shows "Show Overlay" when notes window is hidden', () => {
    expect(build(false).find(i => i.label?.includes("Overlay"))?.label).toBe("Show Overlay");
  });

  it('shows "Switch to Edit Mode" in view mode', () => {
    expect(build(true, false, "view").find(i => i.label?.includes("Mode"))?.label).toBe("Switch to Edit Mode");
  });

  it('shows "Switch to View Mode" in edit mode', () => {
    expect(build(true, false, "edit").find(i => i.label?.includes("Mode"))?.label).toBe("Switch to View Mode");
  });
});

describe("buildTrayMenuItems — keybinds window", () => {
  it('shows "Hide Keybinds" when keybinds window is visible', () => {
    expect(build(true, true).find(i => i.label?.includes("Keybinds"))?.label).toBe("Hide Keybinds");
  });

  it('shows "Show Keybinds" when keybinds window is hidden', () => {
    expect(build(true, false).find(i => i.label?.includes("Keybinds"))?.label).toBe("Show Keybinds");
  });

  it("calls onToggleKeybinds when keybinds item is clicked", () => {
    const onToggleKeybinds = vi.fn();
    const items = buildTrayMenuItems(true, "view", false, vi.fn(), vi.fn(), onToggleKeybinds, vi.fn());
    const item = items.find(i => i.label?.includes("Keybinds"))!;
    (item.click as () => void)();
    expect(onToggleKeybinds).toHaveBeenCalledOnce();
  });
});

describe("buildTrayMenuItems — callbacks", () => {
  it("calls onToggleVisibility when overlay item is clicked", () => {
    const onToggleVisibility = vi.fn();
    const items = buildTrayMenuItems(true, "view", false, onToggleVisibility, vi.fn(), vi.fn(), vi.fn());
    const item = items.find(i => i.label?.includes("Overlay"))!;
    (item.click as () => void)();
    expect(onToggleVisibility).toHaveBeenCalledOnce();
  });

  it("calls onToggleMode when mode item is clicked", () => {
    const onToggleMode = vi.fn();
    const items = buildTrayMenuItems(true, "view", false, vi.fn(), onToggleMode, vi.fn(), vi.fn());
    const item = items.find(i => i.label?.includes("Mode"))!;
    (item.click as () => void)();
    expect(onToggleMode).toHaveBeenCalledOnce();
  });

  it("calls onQuit when Quit item is clicked", () => {
    const onQuit = vi.fn();
    const items = buildTrayMenuItems(true, "view", false, vi.fn(), vi.fn(), vi.fn(), onQuit);
    (items.find(i => i.label === "Quit")!.click as () => void)();
    expect(onQuit).toHaveBeenCalledOnce();
  });

  it("includes separators between sections", () => {
    const items = build();
    expect(items.filter(i => i.type === "separator")).toHaveLength(2);
  });
});
