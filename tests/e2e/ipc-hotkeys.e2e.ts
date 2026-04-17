import { test, expect } from "@playwright/test";
import { launchApp, teardown } from "./helpers/launch";

type HotkeyResult = { errors: Partial<Record<string, string>> };

test.describe("hotkeys IPC", () => {
  test("hotkeys:update returns empty errors for valid accelerators", async () => {
    const handle = await launchApp();
    const result = await handle.page.evaluate(async () => {
      return (await window.api.updateHotkeys({
        toggleVisibility: "Alt+Shift+N",
        toggleEditMode: "Alt+Shift+E",
        startVoiceNote: "Alt+Shift+V",
      })) as unknown as HotkeyResult;
    });
    expect(result).toEqual({ errors: {} });
    await teardown(handle);
  });

  test("hotkeys:update returns error for invalid accelerator", async () => {
    const handle = await launchApp();
    const result = await handle.page.evaluate(async () => {
      return (await window.api.updateHotkeys({
        toggleVisibility: "BadModifier+N",
        toggleEditMode: "Alt+Shift+E",
        startVoiceNote: "Alt+Shift+V",
      })) as unknown as HotkeyResult;
    });
    expect(result.errors).toHaveProperty("toggleVisibility");
    expect(typeof result.errors.toggleVisibility).toBe("string");
    await teardown(handle);
  });

  test("hotkeys:update returns errors for all-invalid hotkeys", async () => {
    const handle = await launchApp();
    const result = await handle.page.evaluate(async () => {
      return (await window.api.updateHotkeys({
        toggleVisibility: "X",
        toggleEditMode: "Y",
        startVoiceNote: "Z",
      })) as unknown as HotkeyResult;
    });
    expect(Object.keys(result.errors)).toHaveLength(3);
    await teardown(handle);
  });
});
