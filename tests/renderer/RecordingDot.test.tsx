import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecordingDot } from "@renderer/components/RecordingDot";

describe("RecordingDot", () => {
  it("renders a span with title 'Recording…'", () => {
    render(<RecordingDot />);
    expect(screen.getByTitle("Recording…")).toBeInTheDocument();
  });

  it("applies recording-pulse animation", () => {
    render(<RecordingDot />);
    const el = screen.getByTitle("Recording…");
    expect(el.style.animation).toContain("recording-pulse");
  });
});
