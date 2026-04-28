import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Btn from "@keybinds/components/Btn";

describe("Btn", () => {
  it("renders empty state when no button prop", () => {
    render(<Btn id="5" button={undefined} activeZone={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("#5")).toBeInTheDocument();
    expect(document.querySelector(".btn.empty")).toBeTruthy();
  });

  it("renders label and zone class", () => {
    render(
      <Btn
        id="3"
        button={{ zone: "edit", label: "Copy", bindings: { single: "Ctrl+C" } }}
        activeZone={null}
      />,
    );
    expect(screen.getByText("Copy")).toBeInTheDocument();
    expect(document.querySelector(".z-edit")).toBeTruthy();
  });

  it("dims when activeZone is set to a different zone", () => {
    const { container } = render(
      <Btn
        id="3"
        button={{ zone: "edit", label: "Copy", bindings: {} }}
        activeZone="nav"
      />,
    );
    const btn = container.querySelector(".btn") as HTMLElement;
    expect(btn.style.opacity).toBe("0.1");
  });

  it("does not dim when activeZone matches the button zone", () => {
    const { container } = render(
      <Btn
        id="3"
        button={{ zone: "edit", label: "Copy", bindings: {} }}
        activeZone="edit"
      />,
    );
    const btn = container.querySelector(".btn") as HTMLElement;
    expect(btn.style.opacity).toBe("");
  });

  it("shows single, long, and double bindings in tooltip", () => {
    render(
      <Btn
        id="1"
        button={{
          zone: "app",
          label: "Launch",
          bindings: { single: "Win+1", long: "Win+Shift+1", double: "Win+Alt+1" },
        }}
        activeZone={null}
      />,
    );
    expect(screen.getByText("Win+1")).toBeInTheDocument();
    expect(screen.getByText("Win+Shift+1")).toBeInTheDocument();
    expect(screen.getByText("Win+Alt+1")).toBeInTheDocument();
  });

  it("adds btn--editing class when isEditing is true", () => {
    render(
      <Btn
        id="3"
        button={{ zone: "edit", label: "Copy", bindings: {} }}
        activeZone={null}
        isEditing={true}
      />,
    );
    expect(document.querySelector(".btn--editing")).toBeTruthy();
  });

  it("does not add btn--editing class when isEditing is false", () => {
    render(
      <Btn
        id="3"
        button={{ zone: "edit", label: "Copy", bindings: {} }}
        activeZone={null}
        isEditing={false}
      />,
    );
    expect(document.querySelector(".btn--editing")).toBeNull();
  });

  it("fires onEditButton with id and rect when clicked in edit mode", async () => {
    const onEditButton = vi.fn();
    render(
      <Btn
        id="3"
        button={{ zone: "edit", label: "Copy", bindings: { single: "Ctrl+C" } }}
        activeZone={null}
        isEditing={true}
        onEditButton={onEditButton}
      />,
    );
    await userEvent.click(document.querySelector(".btn")!);
    expect(onEditButton).toHaveBeenCalledWith("3", expect.any(Object));
  });

  it("does not fire onEditButton when isEditing is false", async () => {
    const onEditButton = vi.fn();
    render(
      <Btn
        id="3"
        button={{ zone: "edit", label: "Copy", bindings: { single: "Ctrl+C" } }}
        activeZone={null}
        isEditing={false}
        onEditButton={onEditButton}
      />,
    );
    await userEvent.click(document.querySelector(".btn")!);
    expect(onEditButton).not.toHaveBeenCalled();
  });
});
