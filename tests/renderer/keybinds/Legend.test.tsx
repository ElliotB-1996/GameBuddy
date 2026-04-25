import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Legend from "@keybinds/components/Legend";

describe("Legend", () => {
  it("renders all zone labels", () => {
    render(<Legend activeZone={null} onToggle={() => {}} />);
    expect(screen.getByText("App Launch")).toBeInTheDocument();
    expect(screen.getByText("Terminal")).toBeInTheDocument();
    expect(screen.getByText("Git")).toBeInTheDocument();
    expect(screen.getByText("Unzoned")).toBeInTheDocument();
  });

  it("calls onToggle with the correct zone when clicked", async () => {
    const onToggle = vi.fn();
    render(<Legend activeZone={null} onToggle={onToggle} />);
    await userEvent.click(screen.getByText("Git"));
    expect(onToggle).toHaveBeenCalledWith("git");
  });

  it("dims non-active zones when activeZone is set", () => {
    render(<Legend activeZone="edit" onToggle={() => {}} />);
    expect(document.querySelector(".li-git.dimmed")).toBeTruthy();
    expect(document.querySelector(".li-edit.dimmed")).toBeNull();
  });

  it("does not dim anything when activeZone is null", () => {
    render(<Legend activeZone={null} onToggle={() => {}} />);
    expect(document.querySelectorAll(".dimmed")).toHaveLength(0);
  });
});
