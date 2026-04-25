import { describe, it, expect } from "vitest";
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
    render(<DeviceSection profile={cyborgProfile} activeZone={null} />);
    expect(screen.getByText("Azeron Cyborg V2")).toBeInTheDocument();
  });

  it('renders "Azeron Cyro" title for cyro device', () => {
    render(<DeviceSection profile={cyroProfile} activeZone={null} />);
    expect(screen.getByText("Azeron Cyro")).toBeInTheDocument();
  });

  it("does not show layer selector when only default layer exists", () => {
    render(<DeviceSection profile={cyborgProfile} activeZone={null} />);
    expect(screen.queryByText("Default")).toBeNull();
    expect(screen.queryByText("Shift")).toBeNull();
  });

  it("shows layer selector when a shift layer exists", () => {
    render(<DeviceSection profile={profileWithShift} activeZone={null} />);
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Shift")).toBeInTheDocument();
  });

  it("switches to shift layer when Shift button is clicked", async () => {
    render(<DeviceSection profile={profileWithShift} activeZone={null} />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Shift"));
    expect(screen.getByText("Nav Up")).toBeInTheDocument();
    expect(screen.queryByText("Copy")).toBeNull();
  });

  it("renders a button from the default layer", () => {
    render(<DeviceSection profile={cyborgProfile} activeZone={null} />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });
});
