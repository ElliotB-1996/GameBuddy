import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPanel } from "@renderer/components/SettingsPanel";
import type { Hotkeys } from "@renderer/types";

const hotkeys: Hotkeys = {
  toggleVisibility: "Alt+Shift+N",
  toggleEditMode: "Alt+Shift+E",
  startVoiceNote: "Alt+Shift+V",
};

beforeEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    writable: true,
    value: {
      enumerateDevices: vi.fn().mockResolvedValue([
        {
          kind: "audioinput",
          deviceId: "device-1",
          label: "Built-in Microphone",
        },
        { kind: "audioinput", deviceId: "device-2", label: "USB Headset" },
        { kind: "videoinput", deviceId: "cam-1", label: "Camera" },
      ]),
    },
  });
});

describe("SettingsPanel", () => {
  it("renders all three hotkey fields", () => {
    render(
      <SettingsPanel
        hotkeys={hotkeys}
        audioDeviceId=""
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Show / Hide Overlay")).toBeInTheDocument();
    expect(screen.getByText("Toggle Edit Mode")).toBeInTheDocument();
    expect(screen.getByText("Start Voice Note")).toBeInTheDocument();
  });

  it("renders the microphone dropdown", () => {
    render(
      <SettingsPanel
        hotkeys={hotkeys}
        audioDeviceId=""
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Microphone")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("populates dropdown with enumerated audioinput devices", async () => {
    render(
      <SettingsPanel
        hotkeys={hotkeys}
        audioDeviceId=""
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("Built-in Microphone")).toBeInTheDocument();
      expect(screen.getByText("USB Headset")).toBeInTheDocument();
    });
    expect(screen.queryByText("Camera")).not.toBeInTheDocument();
  });

  it("includes System Default as the first option", async () => {
    render(
      <SettingsPanel
        hotkeys={hotkeys}
        audioDeviceId=""
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("System Default")).toBeInTheDocument();
    });
  });

  it("calls onSave with selected audioDeviceId", async () => {
    const onSave = vi.fn();
    render(
      <SettingsPanel
        hotkeys={hotkeys}
        audioDeviceId=""
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => screen.getByText("Built-in Microphone"));

    await userEvent.selectOptions(screen.getByRole("combobox"), "device-1");
    await userEvent.click(screen.getByText("Save"));

    expect(onSave).toHaveBeenCalledWith(hotkeys, "device-1");
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    render(
      <SettingsPanel
        hotkeys={hotkeys}
        audioDeviceId=""
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});
