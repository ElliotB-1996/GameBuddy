import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeviceSection from "@keybinds/components/DeviceSection";
import type { Profile } from "@keybinds/data/types";

const cyborgProfile: Profile = {
  id: "test-cyborg",
  label: "Test",
  platform: "windows",
  type: "azeron",
  device: "cyborg",
  layers: {
    default: {
      "1": { zone: "edit", label: "Copy", bindings: { single: "Ctrl+C" } },
    },
  },
};

const cyroProfile: Profile = {
  ...cyborgProfile,
  id: "test-cyro",
  device: "cyro",
};

const profileWithShift: Profile = {
  ...cyborgProfile,
  id: "test-shift",
  layers: {
    default: { "1": { zone: "edit", label: "Copy", bindings: { single: "Ctrl+C" } } },
    shift:   { "1": { zone: "nav",  label: "Nav Up", bindings: { single: "Up" } } },
  },
};

describe("DeviceSection", () => {
  it('renders "Azeron Cyborg V2" title for cyborg device', () => {
    render(<DeviceSection profile={cyborgProfile} activeZone={null} onSave={vi.fn()} />);
    expect(screen.getByText("Azeron Cyborg V2")).toBeInTheDocument();
  });

  it('renders "Azeron Cyro" title for cyro device', () => {
    render(<DeviceSection profile={cyroProfile} activeZone={null} onSave={vi.fn()} />);
    expect(screen.getByText("Azeron Cyro")).toBeInTheDocument();
  });

  it("does not show layer selector when only default layer exists", () => {
    render(<DeviceSection profile={cyborgProfile} activeZone={null} onSave={vi.fn()} />);
    expect(screen.queryByText("Default")).toBeNull();
    expect(screen.queryByText("Shift")).toBeNull();
  });

  it("shows layer selector when a shift layer exists", () => {
    render(<DeviceSection profile={profileWithShift} activeZone={null} onSave={vi.fn()} />);
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Shift")).toBeInTheDocument();
  });

  it("switches to shift layer when Shift button is clicked", async () => {
    render(<DeviceSection profile={profileWithShift} activeZone={null} onSave={vi.fn()} />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Shift"));
    expect(screen.getByText("Nav Up")).toBeInTheDocument();
    expect(screen.queryByText("Copy")).toBeNull();
  });

  it("renders a button from the default layer", () => {
    render(<DeviceSection profile={cyborgProfile} activeZone={null} onSave={vi.fn()} />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("renders an Edit toggle button", () => {
    render(<DeviceSection profile={cyborgProfile} activeZone={null} onSave={vi.fn()} />);
    expect(screen.getByText(/Edit/)).toBeInTheDocument();
  });

  it("shows edit hint when Edit toggle is clicked", async () => {
    render(<DeviceSection profile={cyborgProfile} activeZone={null} onSave={vi.fn()} />);
    expect(screen.queryByText("Click any button to edit it")).toBeNull();
    await userEvent.click(screen.getByText("✎ Edit"));
    expect(screen.getByText("Click any button to edit it")).toBeInTheDocument();
  });

  it("adds editing class to device-section when Edit is toggled on", async () => {
    const { container } = render(
      <DeviceSection profile={cyborgProfile} activeZone={null} onSave={vi.fn()} />,
    );
    await userEvent.click(screen.getByText("✎ Edit"));
    expect(container.querySelector(".device-section.editing")).toBeTruthy();
  });

  it("hides edit hint when Edit is toggled off", async () => {
    render(<DeviceSection profile={cyborgProfile} activeZone={null} onSave={vi.fn()} />);
    await userEvent.click(screen.getByText("✎ Edit"));
    expect(screen.getByText("Click any button to edit it")).toBeInTheDocument();
    await userEvent.click(screen.getByText("✎ Editing"));
    expect(screen.queryByText("Click any button to edit it")).toBeNull();
  });

  it("exits edit mode when Escape is pressed", async () => {
    render(<DeviceSection profile={cyborgProfile} activeZone={null} onSave={vi.fn()} />);
    await userEvent.click(screen.getByText("✎ Edit"));
    expect(screen.getByText("Click any button to edit it")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText("Click any button to edit it")).toBeNull();
  });

  it("opens EditPopup when a grid button is clicked in edit mode", async () => {
    render(<DeviceSection profile={cyborgProfile} activeZone={null} onSave={vi.fn()} />);
    await userEvent.click(screen.getByText("✎ Edit"));
    await userEvent.click(screen.getByText("Copy").closest(".btn")!);
    expect(screen.getByText("Button #1")).toBeInTheDocument();
  });

  it("calls onSave with correct args when popup Save is clicked", async () => {
    const onSave = vi.fn();
    render(<DeviceSection profile={cyborgProfile} activeZone={null} onSave={onSave} />);
    await userEvent.click(screen.getByText("✎ Edit"));
    await userEvent.click(screen.getByText("Copy").closest(".btn")!);
    await userEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith(
      "test-cyborg",
      "default",
      "1",
      expect.objectContaining({ label: "Copy", zone: "edit" }),
    );
  });

  it("dims a grid button when its id is not in highlightedButtons", () => {
    render(
      <DeviceSection
        profile={cyborgProfile}
        activeZone={null}
        highlightedButtons={new Set(["99"])}
        onSave={vi.fn()}
      />,
    );
    const btn = screen.getByText("Copy").closest(".btn") as HTMLElement;
    expect(btn.style.opacity).toBe("0.1");
  });

  it("does not dim a grid button when its id is in highlightedButtons", () => {
    render(
      <DeviceSection
        profile={cyborgProfile}
        activeZone={null}
        highlightedButtons={new Set(["1"])}
        onSave={vi.fn()}
      />,
    );
    const btn = screen.getByText("Copy").closest(".btn") as HTMLElement;
    expect(btn.style.opacity).toBe("");
  });
});
