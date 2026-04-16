import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPanel } from "@renderer/components/SettingsPanel";
import type { Hotkeys, Appearance } from "@renderer/types";

const hotkeys: Hotkeys = {
  toggleVisibility: "Alt+Shift+N",
  toggleEditMode: "Alt+Shift+E",
  startVoiceNote: "Alt+Shift+V",
};

const appearance: Appearance = {
  bgColor: "#0a0c10",
  headerColor: "#0a0c10",
  accentColor: "#4ade80",
  textColor: "#e2e8f0",
  noteColor: "#181c24",
  fontSize: 13,
  viewOpacity: 0.82,
  editOpacity: 1.0,
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

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof SettingsPanel>> = {},
) {
  return render(
    <SettingsPanel
      hotkeys={hotkeys}
      audioDeviceId=""
      appearance={appearance}
      onSave={vi.fn()}
      onAppearanceChange={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />,
  );
}

describe("SettingsPanel — Hotkeys tab (default)", () => {
  it("renders all three hotkey fields", () => {
    renderPanel();
    expect(screen.getByText("Show / Hide Overlay")).toBeInTheDocument();
    expect(screen.getByText("Toggle Edit Mode")).toBeInTheDocument();
    expect(screen.getByText("Start Voice Note")).toBeInTheDocument();
  });

  it("calls onSave with current hotkeys and audioDeviceId when Save clicked", async () => {
    const onSave = vi.fn();
    renderPanel({ onSave });
    await userEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith(hotkeys, "");
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    renderPanel({ onClose });
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("SettingsPanel — Audio tab", () => {
  it("renders microphone dropdown when Audio tab is active", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Audio" }));
    expect(screen.getByText("Microphone")).toBeInTheDocument();
  });

  it("populates dropdown with enumerated audioinput devices only", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Audio" }));
    await waitFor(() => {
      expect(screen.getByText("Built-in Microphone")).toBeInTheDocument();
      expect(screen.getByText("USB Headset")).toBeInTheDocument();
    });
    expect(screen.queryByText("Camera")).not.toBeInTheDocument();
  });

  it("includes System Default as the first option", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Audio" }));
    await waitFor(() => {
      expect(screen.getByText("System Default")).toBeInTheDocument();
    });
  });

  it("calls onSave with selected audioDeviceId", async () => {
    const onSave = vi.fn();
    renderPanel({ onSave });
    await userEvent.click(screen.getByRole("button", { name: "Audio" }));
    await waitFor(() => screen.getByText("Built-in Microphone"));
    await userEvent.selectOptions(screen.getByRole("combobox"), "device-1");
    await userEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith(hotkeys, "device-1");
  });
});

describe("SettingsPanel — Appearance tab", () => {
  it("renders colour controls when Appearance tab is active", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Appearance" }));
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Note Card")).toBeInTheDocument();
    expect(screen.getByText("Font size")).toBeInTheDocument();
    expect(screen.getByText(/Opacity \(view mode\)/)).toBeInTheDocument();
    expect(screen.getByText(/Opacity \(edit mode\)/)).toBeInTheDocument();
  });

  it("calls onAppearanceChange when a colour input changes", async () => {
    const onAppearanceChange = vi.fn();
    renderPanel({ onAppearanceChange });
    await userEvent.click(screen.getByRole("button", { name: "Appearance" }));
    const bgInput = screen.getByTitle("Background") as HTMLInputElement;
    fireEvent.change(bgInput, { target: { value: "#ff0000" } });
    expect(onAppearanceChange).toHaveBeenCalled();
  });

  it("does not render Save/Cancel on the Appearance tab", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Appearance" }));
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });
});
