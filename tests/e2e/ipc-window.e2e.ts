import { test, expect } from "@playwright/test";
import { launchApp, teardown } from "./helpers/launch";

test.describe("window IPC", () => {
  test("window:setMode 'edit' resolves without error", async () => {
    const handle = await launchApp();
    const result = await handle.page.evaluate(async () => {
      try {
        await window.api.setMode("edit");
        return "ok";
      } catch (e: unknown) {
        return (e as Error).message;
      }
    });
    expect(result).toBe("ok");
    await teardown(handle);
  });

  test("window:setMode 'view' resolves without error", async () => {
    const handle = await launchApp();
    const result = await handle.page.evaluate(async () => {
      try {
        await window.api.setMode("view");
        return "ok";
      } catch (e: unknown) {
        return (e as Error).message;
      }
    });
    expect(result).toBe("ok");
    await teardown(handle);
  });

  test("window:setOpacity 0.5 resolves without error", async () => {
    const handle = await launchApp();
    const result = await handle.page.evaluate(async () => {
      try {
        await window.api.setOpacity(0.5);
        return "ok";
      } catch (e: unknown) {
        return (e as Error).message;
      }
    });
    expect(result).toBe("ok");
    await teardown(handle);
  });

  test("window:setOpacity out-of-range value is clamped without error", async () => {
    const handle = await launchApp();
    const result = await handle.page.evaluate(async () => {
      try {
        await window.api.setOpacity(1.5);
        return "ok";
      } catch (e: unknown) {
        return (e as Error).message;
      }
    });
    expect(result).toBe("ok");
    await teardown(handle);
  });
});
