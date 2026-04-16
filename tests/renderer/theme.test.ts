import { describe, it, expect, beforeEach } from "vitest";
import { applyTheme } from "@renderer/utils/theme";
import type { Appearance } from "@renderer/types";

const appearance: Appearance = {
  bgColor: "#ff0000",
  headerColor: "#00ff00",
  accentColor: "#0000ff",
  textColor: "#ffffff",
  noteColor: "#123456",
  fontSize: 15,
  viewOpacity: 0.7,
  editOpacity: 0.9,
};

beforeEach(() => {
  document.documentElement.style.cssText = "";
});

describe("applyTheme", () => {
  it("sets --overlay-bg to bgColor", () => {
    applyTheme(appearance);
    expect(
      document.documentElement.style.getPropertyValue("--overlay-bg"),
    ).toBe("#ff0000");
  });

  it("sets --overlay-header to headerColor", () => {
    applyTheme(appearance);
    expect(
      document.documentElement.style.getPropertyValue("--overlay-header"),
    ).toBe("#00ff00");
  });

  it("sets --overlay-accent to accentColor", () => {
    applyTheme(appearance);
    expect(
      document.documentElement.style.getPropertyValue("--overlay-accent"),
    ).toBe("#0000ff");
  });

  it("sets --overlay-text to textColor", () => {
    applyTheme(appearance);
    expect(
      document.documentElement.style.getPropertyValue("--overlay-text"),
    ).toBe("#ffffff");
  });

  it("sets --overlay-note to noteColor", () => {
    applyTheme(appearance);
    expect(
      document.documentElement.style.getPropertyValue("--overlay-note"),
    ).toBe("#123456");
  });

  it("sets --overlay-font-size with px suffix", () => {
    applyTheme(appearance);
    expect(
      document.documentElement.style.getPropertyValue("--overlay-font-size"),
    ).toBe("15px");
  });
});
