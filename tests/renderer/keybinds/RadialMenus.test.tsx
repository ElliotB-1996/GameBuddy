import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RadialMenus from "@keybinds/components/RadialMenus";
import type { RadialMenu } from "@keybinds/data/types";

const menus: RadialMenu[] = [
  {
    id: "m1",
    label: "Apps",
    trigger: "7",
    color: "#7c3aed",
    actions: [
      { label: "Browser", direction: "↑", binding: "Win+B" },
      { label: "Terminal", direction: "↓", binding: "Win+T" },
    ],
  },
];

const nestedMenus: RadialMenu[] = [
  {
    id: "m2",
    label: "Tools",
    trigger: "8",
    color: "#059669",
    actions: [
      {
        label: "Dev",
        direction: "↑",
        submenu: {
          id: "sub1",
          label: "Dev Tools",
          trigger: "8",
          color: "#2563eb",
          actions: [{ label: "DevTools", direction: "↓" }],
        },
      },
    ],
  },
];

describe("RadialMenus", () => {
  it("renders empty state when no menus provided", () => {
    render(<RadialMenus menus={[]} />);
    expect(screen.getByText("No radial menus defined for this profile.")).toBeInTheDocument();
  });

  it("renders menu label and actions", () => {
    render(<RadialMenus menus={menus} />);
    expect(screen.getByText("Apps")).toBeInTheDocument();
    expect(screen.getByText("Browser")).toBeInTheDocument();
    expect(screen.getByText("Terminal")).toBeInTheDocument();
  });

  it("collapses menu actions when header is clicked", async () => {
    render(<RadialMenus menus={menus} />);
    expect(screen.getByText("Browser")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Apps"));
    expect(screen.queryByText("Browser")).toBeNull();
  });

  it("expands a submenu when its row is clicked", async () => {
    render(<RadialMenus menus={nestedMenus} />);
    expect(screen.queryByText("DevTools")).toBeNull();
    await userEvent.click(screen.getByText("Dev"));
    expect(screen.getByText("DevTools")).toBeInTheDocument();
  });
});
