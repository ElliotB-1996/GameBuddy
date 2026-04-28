# Keybinds Edit Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an anchored edit popup to the keybinds dashboard so users can click any button (in edit mode) to modify its label, zone, and press-type bindings, with changes persisted back to the profile.

**Architecture:** Each `DeviceSection` independently tracks edit mode and which button is being edited. `EditPopup` renders as a `ReactDOM.createPortal` to `document.body` using `position: fixed` anchored near the clicked button. Edits to built-in profiles are stored in `userData/profiles.json` under the same `id`; `App.tsx` resolves the correct version by preferring any `importedProfiles` entry with a matching `id` over the bundled profile.

**Tech Stack:** React 18, TypeScript, Vitest, React Testing Library, `@testing-library/user-event`, `ReactDOM.createPortal`

---

## File Map

| File | Action |
|------|--------|
| `src/renderer/keybinds/src/index.css` | Modify — add CSS for `.btn--editing`, `.tbtn--editing`, `.edit-toggle`, `.edit-hint`, `.device-section.editing`, `.edit-popup` and all popup sub-elements |
| `src/renderer/keybinds/src/components/Btn.tsx` | Modify — add `isEditing?` and `onEditButton?` props |
| `src/renderer/keybinds/src/components/CyborgThumb.tsx` | Modify — thread `isEditing?` and `onEditButton?` through to `TBtn` |
| `src/renderer/keybinds/src/components/CyroThumb.tsx` | Modify — add `isEditing?` and `onEditButton?` props, add click handler |
| `src/renderer/keybinds/src/components/EditPopup.tsx` | Create — portal-based popover form |
| `src/renderer/keybinds/src/components/DeviceSection.tsx` | Modify — edit mode state, Edit toggle, Escape listener, renders `EditPopup` |
| `src/renderer/keybinds/src/App.tsx` | Modify — `BUILTIN_IDS`, `resolveProfile`, `handleButtonSave`, updated `importedGroups` |
| `tests/renderer/keybinds/Btn.test.tsx` | Modify — add edit mode tests |
| `tests/renderer/keybinds/CyborgThumb.test.tsx` | Create — edit mode click tests |
| `tests/renderer/keybinds/CyroThumb.test.tsx` | Create — edit mode click tests |
| `tests/renderer/keybinds/EditPopup.test.tsx` | Create — form, save, cancel, zone selection |
| `tests/renderer/keybinds/DeviceSection.test.tsx` | Modify — update existing renders to pass `onSave`, add edit mode tests |
| `tests/renderer/keybinds/App.test.tsx` | Create — resolveProfile override, importedGroups filtering, handleButtonSave |

---

## Task 1: Add CSS

**Files:**
- Modify: `src/renderer/keybinds/src/index.css`

- [ ] **Step 1: Append edit-mode and popup CSS to `index.css`**

Open `src/renderer/keybinds/src/index.css` and append to the end:

```css
/* ── Edit mode ── */
.device-section.editing { border-color: #4c1d95; box-shadow: 0 0 0 1px #4c1d9533; }
.edit-hint { font-size: 10px; color: #6d5fa8; font-style: italic; margin-bottom: 8px; }
.edit-toggle { padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid #2d1b69; background: transparent; color: #4c1d95; display: flex; align-items: center; gap: 4px; margin-left: 8px; }
.edit-toggle.active { background: #2d1b69; color: #a78bfa; border-color: #a78bfa; }
.btn--editing { cursor: pointer; }
.btn--editing:hover { border-color: #a78bfa !important; box-shadow: 0 0 0 1px #a78bfa44; }
.tbtn--editing { cursor: pointer; }
.tbtn--editing:hover { border-color: #a78bfa !important; box-shadow: 0 0 0 1px #a78bfa44; }

/* ── Edit popup ── */
.edit-popup { position: fixed; z-index: 1000; background: #12122a; border: 1px solid #2d2060; border-radius: 8px; padding: 14px; width: 240px; box-shadow: 0 8px 32px #000d; font-family: 'Segoe UI', system-ui, sans-serif; color: #e2e8f0; }
.edit-popup-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.edit-popup-header span { font-size: 11px; color: #a78bfa; text-transform: uppercase; letter-spacing: 1px; }
.edit-popup-close { background: none; border: none; color: #4c1d95; cursor: pointer; font-size: 14px; padding: 0; line-height: 1; }
.edit-popup-close:hover { color: #f87171; }
.edit-popup-label { display: block; font-size: 9px; color: #4c1d95; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.edit-popup-input { width: 100%; background: #0d0d1a; border: 1px solid #2d2060; border-radius: 4px; padding: 5px 8px; font-size: 12px; color: #e2e8f0; outline: none; font-family: inherit; margin-bottom: 9px; box-sizing: border-box; }
.edit-popup-input:focus { border-color: #4c1d95; }
.edit-popup-zones { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; margin-bottom: 9px; }
.edit-popup-zone { padding: 3px 0; border-radius: 3px; font-size: 9px; font-weight: 700; cursor: pointer; border: 1px solid transparent; text-align: center; transition: border-color 0.1s; }
.edit-popup-zone.selected { border-color: #a78bfa !important; border-width: 2px; }
.edit-popup-bindings { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.edit-popup-binding-row { display: flex; align-items: center; gap: 6px; }
.edit-popup-binding-type { font-size: 9px; color: #6d5fa8; text-transform: uppercase; letter-spacing: 1px; width: 36px; text-align: right; flex-shrink: 0; }
.edit-popup-binding-row .edit-popup-input { margin-bottom: 0; flex: 1; width: auto; }
.edit-popup-actions { display: flex; gap: 6px; justify-content: flex-end; }
.edit-popup-cancel { padding: 4px 10px; border-radius: 4px; font-size: 11px; background: transparent; border: 1px solid #2d1b69; color: #6d5fa8; cursor: pointer; }
.edit-popup-cancel:hover { border-color: #4c1d95; color: #a78bfa; }
.edit-popup-save { padding: 4px 10px; border-radius: 4px; font-size: 11px; background: #4c1d95; color: #e2e8f0; border: none; cursor: pointer; }
.edit-popup-save:hover { background: #6d28d9; }
```

- [ ] **Step 2: Commit**

```
git add src/renderer/keybinds/src/index.css
git commit -m "style: add edit mode and popup CSS for keybinds dashboard"
```

---

## Task 2: Add edit props to Btn

**Files:**
- Modify: `src/renderer/keybinds/src/components/Btn.tsx`
- Modify: `tests/renderer/keybinds/Btn.test.tsx`

- [ ] **Step 1: Write failing tests**

Add to `tests/renderer/keybinds/Btn.test.tsx` (inside the existing `describe("Btn", ...)` block, after the last test):

```tsx
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
```

Add these imports at the top of the file (merge with the existing import line):
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Btn from "@keybinds/components/Btn";
```

Add inside `describe("Btn", () => { ... })`:

```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/renderer/keybinds/Btn.test.tsx
```

Expected: compilation errors or test failures because `isEditing` and `onEditButton` props don't exist yet.

- [ ] **Step 3: Update `Btn.tsx`**

Replace the entire contents of `src/renderer/keybinds/src/components/Btn.tsx`:

```tsx
import type { Button, Zone } from "../data/types";

interface Props {
  id: string;
  button?: Button;
  activeZone: Zone | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}

export default function Btn({
  id,
  button,
  activeZone,
  isEditing,
  onEditButton,
}: Props): JSX.Element {
  if (!button) {
    return (
      <div className="btn empty">
        <span className="label">—</span>
        <span className="num">#{id}</span>
      </div>
    );
  }

  const { zone, label, bindings } = button;
  const dimmed =
    activeZone !== null && activeZone !== zone ? { opacity: 0.1 } : undefined;

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isEditing && onEditButton) {
      onEditButton(id, e.currentTarget.getBoundingClientRect());
    }
  }

  return (
    <div
      className={`btn z-${zone}${isEditing ? " btn--editing" : ""}`}
      style={dimmed}
      data-zone={zone}
      onClick={handleClick}
    >
      <span className="label">{label}</span>
      <span className="num">#{id}</span>
      <div className="btn-tip">
        {bindings.single && (
          <div className="tip-row">
            <span className="tip-type">Single</span>
            <span className="tip-binding">{bindings.single}</span>
          </div>
        )}
        {bindings.long && (
          <div className="tip-row">
            <span className="tip-type">Long</span>
            <span className="tip-binding">{bindings.long}</span>
          </div>
        )}
        {bindings.double && (
          <div className="tip-row">
            <span className="tip-type">Double</span>
            <span className="tip-binding">{bindings.double}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/renderer/keybinds/Btn.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```
git add src/renderer/keybinds/src/components/Btn.tsx tests/renderer/keybinds/Btn.test.tsx
git commit -m "feat: add isEditing and onEditButton props to Btn"
```

---

## Task 3: Add edit props to CyborgThumb and CyroThumb

**Files:**
- Modify: `src/renderer/keybinds/src/components/CyborgThumb.tsx`
- Modify: `src/renderer/keybinds/src/components/CyroThumb.tsx`
- Create: `tests/renderer/keybinds/CyborgThumb.test.tsx`
- Create: `tests/renderer/keybinds/CyroThumb.test.tsx`

- [ ] **Step 1: Write failing CyborgThumb test**

Create `tests/renderer/keybinds/CyborgThumb.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CyborgThumb from "@keybinds/components/CyborgThumb";
import type { Layer } from "@keybinds/data/types";

const layer: Layer = {
  "22": { zone: "thumb", label: "Jump", bindings: { single: "Space" } },
};

describe("CyborgThumb", () => {
  it("renders a thumb button label", () => {
    render(<CyborgThumb layer={layer} activeZone={null} />);
    expect(screen.getByText("Jump")).toBeInTheDocument();
  });

  it("fires onEditButton when a thumb button is clicked in edit mode", async () => {
    const onEditButton = vi.fn();
    render(
      <CyborgThumb
        layer={layer}
        activeZone={null}
        isEditing={true}
        onEditButton={onEditButton}
      />,
    );
    await userEvent.click(screen.getByText("Jump").closest(".tbtn")!);
    expect(onEditButton).toHaveBeenCalledWith("22", expect.any(Object));
  });

  it("does not fire onEditButton when isEditing is false", async () => {
    const onEditButton = vi.fn();
    render(
      <CyborgThumb
        layer={layer}
        activeZone={null}
        isEditing={false}
        onEditButton={onEditButton}
      />,
    );
    await userEvent.click(screen.getByText("Jump").closest(".tbtn")!);
    expect(onEditButton).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Write failing CyroThumb test**

Create `tests/renderer/keybinds/CyroThumb.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CyroThumb from "@keybinds/components/CyroThumb";
import type { Layer } from "@keybinds/data/types";

const layer: Layer = {
  "22": { zone: "thumb", label: "Jump", bindings: { single: "Space" } },
};

describe("CyroThumb", () => {
  it("renders a thumb button label", () => {
    render(<CyroThumb layer={layer} activeZone={null} />);
    expect(screen.getByText("Jump")).toBeInTheDocument();
  });

  it("fires onEditButton when a thumb button is clicked in edit mode", async () => {
    const onEditButton = vi.fn();
    render(
      <CyroThumb
        layer={layer}
        activeZone={null}
        isEditing={true}
        onEditButton={onEditButton}
      />,
    );
    await userEvent.click(screen.getByText("Jump").closest(".tbtn")!);
    expect(onEditButton).toHaveBeenCalledWith("22", expect.any(Object));
  });

  it("does not fire onEditButton when isEditing is false", async () => {
    const onEditButton = vi.fn();
    render(
      <CyroThumb
        layer={layer}
        activeZone={null}
        isEditing={false}
        onEditButton={onEditButton}
      />,
    );
    await userEvent.click(screen.getByText("Jump").closest(".tbtn")!);
    expect(onEditButton).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```
npx vitest run tests/renderer/keybinds/CyborgThumb.test.tsx tests/renderer/keybinds/CyroThumb.test.tsx
```

Expected: compilation errors because `isEditing`/`onEditButton` props don't exist yet.

- [ ] **Step 4: Update `CyborgThumb.tsx`**

Replace the entire contents of `src/renderer/keybinds/src/components/CyborgThumb.tsx`:

```tsx
import type { Layer, Zone } from "../data/types";
import { CYBORG_THUMB } from "../data/layout";
import type { ThumbCell } from "../data/layout";

interface Props {
  layer: Layer;
  activeZone: Zone | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}

interface TBtnProps {
  id: string;
  dir: string;
  layer: Layer;
  activeZone: Zone | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}

function TBtn({
  id,
  dir,
  layer,
  activeZone,
  isEditing,
  onEditButton,
}: TBtnProps): JSX.Element {
  const btn = layer[id];

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isEditing && onEditButton) {
      onEditButton(id, e.currentTarget.getBoundingClientRect());
    }
  }

  if (!btn)
    return (
      <div className="tbtn z-thumb" onClick={handleClick}>
        <span className="dir">{dir}</span>
        <span className="label">—</span>
        <span className="num">#{id}</span>
      </div>
    );
  const dimmed =
    activeZone !== null && activeZone !== btn.zone
      ? { opacity: 0.1 }
      : undefined;
  return (
    <div
      className={`tbtn z-${btn.zone}${isEditing ? " tbtn--editing" : ""}`}
      style={dimmed}
      onClick={handleClick}
    >
      <span className="dir">{dir}</span>
      <span className="label">{btn.label}</span>
      <span className="num">#{id}</span>
      <div className="btn-tip">
        {btn.bindings.single && (
          <div className="tip-row">
            <span className="tip-type">Single</span>
            <span className="tip-binding">{btn.bindings.single}</span>
          </div>
        )}
        {btn.bindings.long && (
          <div className="tip-row">
            <span className="tip-type">Long</span>
            <span className="tip-binding">{btn.bindings.long}</span>
          </div>
        )}
        {btn.bindings.double && (
          <div className="tip-row">
            <span className="tip-type">Double</span>
            <span className="tip-binding">{btn.bindings.double}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CyborgThumb({
  layer,
  activeZone,
  isEditing,
  onEditButton,
}: Props): JSX.Element {
  return (
    <div className="thumb-area">
      <div
        className="thumb-btns"
        style={{ gridTemplateColumns: "repeat(5, auto)" }}
      >
        {CYBORG_THUMB.flatMap((row, ri) => [
          ...(ri > 0 ? [<div key={`sep-${ri}`} className="thumb-sep" />] : []),
          ...row.map((cell: ThumbCell, ci) =>
            cell ? (
              <TBtn
                key={cell.id}
                id={cell.id}
                dir={cell.dir}
                layer={layer}
                activeZone={activeZone}
                isEditing={isEditing}
                onEditButton={onEditButton}
              />
            ) : (
              <div key={`sp-${ri}-${ci}`} />
            ),
          ),
        ])}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update `CyroThumb.tsx`**

Replace the entire contents of `src/renderer/keybinds/src/components/CyroThumb.tsx`:

```tsx
import type { Layer, Zone } from "../data/types";
import { CYRO_THUMB } from "../data/layout";

interface Props {
  layer: Layer;
  activeZone: Zone | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}

export default function CyroThumb({
  layer,
  activeZone,
  isEditing,
  onEditButton,
}: Props): JSX.Element {
  return (
    <div className="cyro-thumb thumb-area">
      <div
        className="thumb-btns"
        style={{ gridTemplateColumns: `repeat(${CYRO_THUMB.length}, auto)` }}
      >
        {CYRO_THUMB.map(({ id, dir }) => {
          const btn = layer[id];

          function handleClick(e: React.MouseEvent<HTMLDivElement>) {
            if (isEditing && onEditButton) {
              onEditButton(id, e.currentTarget.getBoundingClientRect());
            }
          }

          if (!btn)
            return (
              <div key={id} className="tbtn z-thumb" onClick={handleClick}>
                <span className="dir">{dir}</span>
                <span className="label">—</span>
                <span className="num">#{id}</span>
              </div>
            );
          const dimmed =
            activeZone !== null && activeZone !== btn.zone
              ? { opacity: 0.1 }
              : undefined;
          return (
            <div
              key={id}
              className={`tbtn z-${btn.zone}${isEditing ? " tbtn--editing" : ""}`}
              style={dimmed}
              onClick={handleClick}
            >
              <span className="dir">{dir}</span>
              <span className="label">{btn.label}</span>
              <span className="num">#{id}</span>
              <div className="btn-tip">
                {btn.bindings.single && (
                  <div className="tip-row">
                    <span className="tip-type">Single</span>
                    <span className="tip-binding">{btn.bindings.single}</span>
                  </div>
                )}
                {btn.bindings.long && (
                  <div className="tip-row">
                    <span className="tip-type">Long</span>
                    <span className="tip-binding">{btn.bindings.long}</span>
                  </div>
                )}
                {btn.bindings.double && (
                  <div className="tip-row">
                    <span className="tip-type">Double</span>
                    <span className="tip-binding">{btn.bindings.double}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

```
npx vitest run tests/renderer/keybinds/CyborgThumb.test.tsx tests/renderer/keybinds/CyroThumb.test.tsx
```

Expected: all 6 tests pass.

- [ ] **Step 7: Commit**

```
git add src/renderer/keybinds/src/components/CyborgThumb.tsx src/renderer/keybinds/src/components/CyroThumb.tsx tests/renderer/keybinds/CyborgThumb.test.tsx tests/renderer/keybinds/CyroThumb.test.tsx
git commit -m "feat: add isEditing and onEditButton props to CyborgThumb and CyroThumb"
```

---

## Task 4: Create EditPopup component

**Files:**
- Create: `src/renderer/keybinds/src/components/EditPopup.tsx`
- Create: `tests/renderer/keybinds/EditPopup.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/renderer/keybinds/EditPopup.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditPopup from "@keybinds/components/EditPopup";
import type { Button } from "@keybinds/data/types";

const rect = new DOMRect(100, 200, 52, 44);

const button: Button = {
  zone: "edit",
  label: "Copy",
  bindings: { single: "Ctrl+C", long: "Ctrl+Shift+C" },
};

describe("EditPopup", () => {
  it("renders pre-filled label and binding inputs", () => {
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Copy")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ctrl+C")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ctrl+Shift+C")).toBeInTheDocument();
  });

  it("shows button id in header", () => {
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Button #3")).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when ✕ is clicked", async () => {
    const onClose = vi.fn();
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onSave with updated button when Save is clicked", async () => {
    const onSave = vi.fn();
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    const labelInput = screen.getByDisplayValue("Copy");
    await userEvent.clear(labelInput);
    await userEvent.type(labelInput, "Duplicate");
    await userEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Duplicate", zone: "edit" }),
    );
  });

  it("selecting a zone pill updates the selected zone", async () => {
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={button}
        rect={rect}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("nav"));
    const navPill = screen.getByText("nav").closest("button");
    expect(navPill?.className).toContain("selected");
    const editPill = screen.getByText("edit").closest("button");
    expect(editPill?.className).not.toContain("selected");
  });

  it("omits empty bindings from the saved object", async () => {
    const onSave = vi.fn();
    render(
      <EditPopup
        buttonId="3"
        layerKey="default"
        button={{ zone: "edit", label: "Copy", bindings: { single: "Ctrl+C" } }}
        rect={rect}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ bindings: { single: "Ctrl+C" } }),
    );
    const saved = onSave.mock.calls[0][0] as Button;
    expect(saved.bindings.long).toBeUndefined();
    expect(saved.bindings.double).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/renderer/keybinds/EditPopup.test.tsx
```

Expected: module not found error for `EditPopup`.

- [ ] **Step 3: Create `EditPopup.tsx`**

Create `src/renderer/keybinds/src/components/EditPopup.tsx`:

```tsx
import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import type { Button, Zone } from "../data/types";

const ZONES: Zone[] = [
  "app", "terminal", "edit",
  "nav", "git", "mouse",
  "system", "thumb", "unzoned",
];

const POPUP_WIDTH = 240;
const POPUP_HEIGHT = 330;

interface Props {
  buttonId: string;
  layerKey: string;
  button: Button;
  rect: DOMRect;
  onSave: (updated: Button) => void;
  onClose: () => void;
}

export default function EditPopup({
  buttonId,
  button,
  rect,
  onSave,
  onClose,
}: Props): JSX.Element {
  const [label, setLabel] = useState(button.label);
  const [zone, setZone] = useState<Zone>(button.zone);
  const [single, setSingle] = useState(button.bindings.single ?? "");
  const [long, setLong] = useState(button.bindings.long ?? "");
  const [double, setDouble] = useState(button.bindings.double ?? "");
  const popupRef = useRef<HTMLDivElement>(null);

  const margin = 8;
  let top = rect.bottom + 6;
  let left = rect.left;
  if (top + POPUP_HEIGHT > window.innerHeight - margin) top = rect.top - POPUP_HEIGHT - 6;
  if (left + POPUP_WIDTH > window.innerWidth - margin) left = rect.right - POPUP_WIDTH;
  top = Math.max(margin, top);
  left = Math.max(margin, left);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose]);

  function handleSave() {
    const bindings: Button["bindings"] = {};
    if (single) bindings.single = single;
    if (long) bindings.long = long;
    if (double) bindings.double = double;
    onSave({ label, zone, bindings });
  }

  return ReactDOM.createPortal(
    <div ref={popupRef} className="edit-popup" style={{ top, left }}>
      <div className="edit-popup-header">
        <span>Button #{buttonId}</span>
        <button className="edit-popup-close" onClick={onClose}>✕</button>
      </div>

      <label className="edit-popup-label">Label</label>
      <input
        className="edit-popup-input"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />

      <label className="edit-popup-label">Zone</label>
      <div className="edit-popup-zones">
        {ZONES.map((z) => (
          <button
            key={z}
            className={`edit-popup-zone z-${z}${zone === z ? " selected" : ""}`}
            onClick={() => setZone(z)}
          >
            {z}
          </button>
        ))}
      </div>

      <label className="edit-popup-label">Bindings</label>
      <div className="edit-popup-bindings">
        <div className="edit-popup-binding-row">
          <span className="edit-popup-binding-type">Single</span>
          <input
            className="edit-popup-input"
            value={single}
            onChange={(e) => setSingle(e.target.value)}
            placeholder="none"
          />
        </div>
        <div className="edit-popup-binding-row">
          <span className="edit-popup-binding-type">Long</span>
          <input
            className="edit-popup-input"
            value={long}
            onChange={(e) => setLong(e.target.value)}
            placeholder="none"
          />
        </div>
        <div className="edit-popup-binding-row">
          <span className="edit-popup-binding-type">Double</span>
          <input
            className="edit-popup-input"
            value={double}
            onChange={(e) => setDouble(e.target.value)}
            placeholder="none"
          />
        </div>
      </div>

      <div className="edit-popup-actions">
        <button className="edit-popup-cancel" onClick={onClose}>Cancel</button>
        <button className="edit-popup-save" onClick={handleSave}>Save</button>
      </div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/renderer/keybinds/EditPopup.test.tsx
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```
git add src/renderer/keybinds/src/components/EditPopup.tsx tests/renderer/keybinds/EditPopup.test.tsx
git commit -m "feat: create EditPopup portal component"
```

---

## Task 5: Add edit mode to DeviceSection

**Files:**
- Modify: `src/renderer/keybinds/src/components/DeviceSection.tsx`
- Modify: `tests/renderer/keybinds/DeviceSection.test.tsx`

- [ ] **Step 1: Update existing DeviceSection tests to pass `onSave`**

`DeviceSection` will require an `onSave` prop. Update every `render(...)` call in `tests/renderer/keybinds/DeviceSection.test.tsx` to include `onSave={vi.fn()}`.

Replace the imports at the top of the file:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeviceSection from "@keybinds/components/DeviceSection";
import type { Profile } from "@keybinds/data/types";
```

Update every `render(<DeviceSection ...` call to add `onSave={vi.fn()}`. The five existing renders become:

```tsx
render(<DeviceSection profile={cyborgProfile} activeZone={null} onSave={vi.fn()} />);
// (repeat for each render in the file)
```

Then add these new tests at the end of the `describe("DeviceSection", ...)` block:

```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/renderer/keybinds/DeviceSection.test.tsx
```

Expected: TypeScript errors because `onSave` prop doesn't exist on `DeviceSection` yet.

- [ ] **Step 3: Update `DeviceSection.tsx`**

Replace the entire contents of `src/renderer/keybinds/src/components/DeviceSection.tsx`:

```tsx
import { useState, useEffect } from "react";
import type { Profile, Zone, Button } from "../data/types";
import { CYBORG_GRID, CYRO_GRID } from "../data/layout";
import Btn from "./Btn";
import CyborgThumb from "./CyborgThumb";
import CyroThumb from "./CyroThumb";
import EditPopup from "./EditPopup";

interface Props {
  profile: Profile;
  activeZone: Zone | null;
  className?: string;
  onSave: (
    profileId: string,
    layerKey: string,
    buttonId: string,
    updated: Button,
  ) => void;
}

export default function DeviceSection({
  profile,
  activeZone,
  className,
  onSave,
}: Props): JSX.Element {
  const [activeLayer, setActiveLayer] = useState<string>("default");
  const [isEditing, setIsEditing] = useState(false);
  const [editingButton, setEditingButton] = useState<{
    id: string;
    layerKey: string;
    rect: DOMRect;
  } | null>(null);

  const layerKeys = [
    "default",
    ...Object.keys(profile.layers).filter((k) => k !== "default"),
  ];
  const layer = profile.layers[activeLayer] ?? profile.layers.default;
  const grid = profile.device === "cyborg" ? CYBORG_GRID : CYRO_GRID;
  const gridClass = profile.device === "cyborg" ? "cyborg-grid" : "cyro-grid";

  useEffect(() => {
    if (!isEditing) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsEditing(false);
        setEditingButton(null);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isEditing]);

  function toggleEditing() {
    setIsEditing((prev) => !prev);
    setEditingButton(null);
  }

  function handleEditButton(id: string, rect: DOMRect) {
    setEditingButton({ id, layerKey: activeLayer, rect });
  }

  function handlePopupSave(updated: Button) {
    if (!editingButton) return;
    onSave(profile.id, editingButton.layerKey, editingButton.id, updated);
    setEditingButton(null);
  }

  function layerLabel(key: string): string {
    if (profile.layerLabels?.[key]) return profile.layerLabels[key];
    if (key === "default") return "Default";
    if (key === "shift") return "Shift";
    const m = /^shift-(\d+)$/.exec(key);
    if (m) return `Shift ${m[1]}`;
    return key;
  }

  const editingButtonData = editingButton
    ? (profile.layers[editingButton.layerKey]?.[editingButton.id] ?? {
        zone: "unzoned" as Zone,
        label: "",
        bindings: {},
      })
    : null;

  return (
    <div
      className={`device-section ${className ?? ""}${isEditing ? " editing" : ""}`}
    >
      <div className="device-header">
        <div className="device-title">
          {profile.device === "cyborg" ? "Azeron Cyborg V2" : "Azeron Cyro"}
        </div>
        {layerKeys.length > 1 && (
          <div className="layer-selector">
            <span>Layer</span>
            {layerKeys.map((key) => (
              <button
                key={key}
                className={`layer-btn ${activeLayer === key ? "active" : ""}`}
                onClick={() => setActiveLayer(key)}
              >
                {layerLabel(key)}
              </button>
            ))}
          </div>
        )}
        <button
          className={`edit-toggle${isEditing ? " active" : ""}`}
          onClick={toggleEditing}
        >
          ✎ {isEditing ? "Editing" : "Edit"}
        </button>
      </div>

      {isEditing && (
        <div className="edit-hint">Click any button to edit it</div>
      )}

      <div className={gridClass}>
        {grid
          .flat()
          .map((id, i) =>
            id ? (
              <Btn
                key={id}
                id={id}
                button={layer[id]}
                activeZone={activeZone}
                isEditing={isEditing}
                onEditButton={handleEditButton}
              />
            ) : (
              <div key={`sp-${i}`} className="spacer" />
            ),
          )}
      </div>

      {profile.device === "cyborg" ? (
        <CyborgThumb
          layer={layer}
          activeZone={activeZone}
          isEditing={isEditing}
          onEditButton={handleEditButton}
        />
      ) : (
        <CyroThumb
          layer={layer}
          activeZone={activeZone}
          isEditing={isEditing}
          onEditButton={handleEditButton}
        />
      )}

      {editingButton && editingButtonData && (
        <EditPopup
          buttonId={editingButton.id}
          layerKey={editingButton.layerKey}
          button={editingButtonData}
          rect={editingButton.rect}
          onSave={handlePopupSave}
          onClose={() => setEditingButton(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/renderer/keybinds/DeviceSection.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```
git add src/renderer/keybinds/src/components/DeviceSection.tsx tests/renderer/keybinds/DeviceSection.test.tsx
git commit -m "feat: add edit mode toggle and EditPopup integration to DeviceSection"
```

---

## Task 6: Wire up save flow in App

**Files:**
- Modify: `src/renderer/keybinds/src/App.tsx`
- Create: `tests/renderer/keybinds/App.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/renderer/keybinds/App.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@keybinds/App";
import type { Profile } from "@keybinds/data/types";

const importedProfile: Profile = {
  id: "cyborg-vscode-windows",
  label: "VS Code Override",
  platform: "windows",
  type: "rewasd",
  device: "cyborg",
  layers: {
    default: {
      "1": { zone: "app", label: "Custom", bindings: { single: "Win+1" } },
    },
  },
  imported: true,
};

beforeEach(() => {
  let loadCb: ((profiles: Profile[]) => void) | undefined;
  (window as any).keybindsApi = {
    onProfilesLoad: vi.fn((cb: (p: Profile[]) => void) => { loadCb = cb; }),
    saveProfile: vi.fn().mockResolvedValue(undefined),
    deleteProfile: vi.fn().mockResolvedValue(undefined),
    onActiveApp: vi.fn(),
    removeActiveAppListener: vi.fn(),
  };
  // Trigger profiles load with no imported profiles by default
  setTimeout(() => loadCb?.([]), 0);
});

describe("App — resolveProfile override", () => {
  it("displays built-in profile button label on Windows Default tab", async () => {
    render(<App />);
    await act(async () => {});
    // Windows Default tab is active by default (index 1)
    // Built-in cyborg-windows-default should render
    expect(screen.getByText("Windows Default")).toBeInTheDocument();
  });

  it("uses imported override instead of built-in when ids match", async () => {
    let loadCb: ((profiles: Profile[]) => void) | undefined;
    (window as any).keybindsApi.onProfilesLoad = vi.fn(
      (cb: (p: Profile[]) => void) => { loadCb = cb; },
    );
    render(<App />);
    await act(async () => { loadCb?.([importedProfile]); });
    // Switch to VS Code tab (index 2)
    await userEvent.click(screen.getAllByText("VS Code")[0]);
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("does not show built-in override as an extra imported tab", async () => {
    let loadCb: ((profiles: Profile[]) => void) | undefined;
    (window as any).keybindsApi.onProfilesLoad = vi.fn(
      (cb: (p: Profile[]) => void) => { loadCb = cb; },
    );
    render(<App />);
    await act(async () => { loadCb?.([importedProfile]); });
    // Should not have an extra "VS Code Override" tab
    expect(screen.queryByText("VS Code Override")).toBeNull();
  });
});

describe("App — handleButtonSave", () => {
  it("calls saveProfile with the patched profile", async () => {
    let loadCb: ((profiles: Profile[]) => void) | undefined;
    (window as any).keybindsApi.onProfilesLoad = vi.fn(
      (cb: (p: Profile[]) => void) => { loadCb = cb; },
    );
    render(<App />);
    await act(async () => { loadCb?.([]); });

    // Switch to VS Code tab and enter edit mode on cyborg section
    await userEvent.click(screen.getAllByText("VS Code")[0]);
    // Click "✎ Edit" on the first DeviceSection (cyborg)
    const editBtns = screen.getAllByText("✎ Edit");
    await userEvent.click(editBtns[0]);

    // Click button #1 — find a .btn--editing element
    const editableBtns = document.querySelectorAll(".btn--editing");
    if (editableBtns.length > 0) {
      await userEvent.click(editableBtns[0]);
      await userEvent.click(screen.getByText("Save"));
      expect((window as any).keybindsApi.saveProfile).toHaveBeenCalled();
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/renderer/keybinds/App.test.tsx
```

Expected: failures because App does not yet use `resolveProfile` or pass `onSave`.

- [ ] **Step 3: Update `App.tsx`**

Replace the entire contents of `src/renderer/keybinds/src/App.tsx`:

```tsx
import { useState, useEffect, useRef, useMemo } from "react";
import "./index.css";
import { profiles } from "./data/profiles";
import type { Zone, Profile, Button } from "./data/types";
import Legend from "./components/Legend";
import DeviceSection from "./components/DeviceSection";
import RadialMenus from "./components/RadialMenus";
import { loadImportedProfiles, saveProfile, deleteProfile } from "./db";
import { parseRewasd } from "./importers/parseRewasd";
import { ParseError } from "./importers/errors";

const PROFILE_PAIRS = [
  {
    label: "Mac Default",
    platform: "mac",
    cyborgId: "cyborg-mac-onboard",
    cyroId: "cyro-mac-onboard",
    appNames: [] as string[],
  },
  {
    label: "Windows Default",
    platform: "windows",
    cyborgId: "cyborg-windows-default",
    cyroId: "cyro-windows-default",
    appNames: [] as string[],
  },
  {
    label: "VS Code",
    platform: "windows",
    cyborgId: "cyborg-vscode-windows",
    cyroId: "cyro-vscode-windows",
    appNames: ["Code.exe"],
  },
  {
    label: "Browser",
    platform: "windows",
    cyborgId: "cyborg-browser-windows",
    cyroId: "cyro-browser-windows",
    appNames: [
      "chrome.exe",
      "msedge.exe",
      "firefox.exe",
      "brave.exe",
      "opera.exe",
    ],
  },
  {
    label: "Terminal",
    platform: "windows",
    cyborgId: "cyborg-terminal-windows",
    cyroId: "cyro-terminal-windows",
    appNames: ["WindowsTerminal.exe", "cmd.exe", "powershell.exe", "pwsh.exe"],
  },
  {
    label: "Discord",
    platform: "windows",
    cyborgId: "cyborg-discord-windows",
    cyroId: "cyro-discord-windows",
    appNames: ["Discord.exe"],
  },
  {
    label: "Obsidian",
    platform: "windows",
    cyborgId: "cyborg-obsidian-windows",
    cyroId: "cyro-obsidian-windows",
    appNames: ["Obsidian.exe"],
  },
  {
    label: "Spotify",
    platform: "windows",
    cyborgId: "cyborg-spotify-windows",
    cyroId: "cyro-spotify-windows",
    appNames: ["Spotify.exe"],
  },
];

const BUILTIN_IDS = new Set(profiles.map((p) => p.id));

export default function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState(0);
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [importedProfiles, setImportedProfiles] = useState<Profile[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImportedProfiles().then(setImportedProfiles);
  }, []);

  useEffect(() => {
    const windowsDefaultIdx = PROFILE_PAIRS.findIndex(
      (p) => p.label === "Windows Default",
    );
    window.keybindsApi.onActiveApp((processName) => {
      const idx = PROFILE_PAIRS.findIndex((p) =>
        p.appNames.some((n) => n.toLowerCase() === processName.toLowerCase()),
      );
      setActiveTab(idx >= 0 ? idx : windowsDefaultIdx);
    });
    return () => window.keybindsApi.removeActiveAppListener();
  }, []);

  function resolveProfile(id: string): Profile | undefined {
    return importedProfiles.find((p) => p.id === id) ?? profiles.find((p) => p.id === id);
  }

  const importedGroups = useMemo(() => {
    const seen = new Map<string, Profile[]>();
    for (const p of importedProfiles) {
      if (BUILTIN_IDS.has(p.id)) continue;
      const key = p.pairId ?? p.id;
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push(p);
    }
    return Array.from(seen.values());
  }, [importedProfiles]);

  function toggleZone(zone: Zone): void {
    setActiveZone((prev) => (prev === zone ? null : zone));
  }

  async function handleDeleteGroup(key: string): Promise<void> {
    const toDelete = importedProfiles.filter((p) => (p.pairId ?? p.id) === key);
    for (const p of toDelete) await deleteProfile(p.id);
    setImportedProfiles((prev) =>
      prev.filter((p) => (p.pairId ?? p.id) !== key),
    );
    setActiveTab(0);
  }

  async function handleImport(file: File): Promise<void> {
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      const parsed = parseRewasd(json);
      for (const profile of parsed) {
        await saveProfile(profile);
      }
      const next = [...importedProfiles, ...parsed];
      setImportedProfiles(next);
      const nextGroupCount = new Set(next.map((p) => p.pairId ?? p.id)).size;
      setActiveTab(PROFILE_PAIRS.length + nextGroupCount - 1);
      setImportError(null);
    } catch (e) {
      setImportError(
        e instanceof ParseError
          ? e.message
          : "Could not read file — is it a valid reWASD export?",
      );
    }
  }

  async function handleButtonSave(
    profileId: string,
    layerKey: string,
    buttonId: string,
    updated: Button,
  ): Promise<void> {
    const current = resolveProfile(profileId);
    if (!current) return;
    const next: Profile = {
      ...current,
      layers: {
        ...current.layers,
        [layerKey]: {
          ...current.layers[layerKey],
          [buttonId]: updated,
        },
      },
    };
    await saveProfile(next);
    setImportedProfiles((prev) => {
      const idx = prev.findIndex((p) => p.id === profileId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = next;
        return copy;
      }
      return [...prev, next];
    });
  }

  const isImportedTab = activeTab >= PROFILE_PAIRS.length;
  const importedGroup = isImportedTab
    ? importedGroups[activeTab - PROFILE_PAIRS.length]
    : undefined;
  const importedCyborg = importedGroup?.find((p) => p.device === "cyborg");
  const importedCyro = importedGroup?.find((p) => p.device === "cyro");
  const pair = !isImportedTab ? PROFILE_PAIRS[activeTab] : null;
  const cyborg = pair ? resolveProfile(pair.cyborgId) : undefined;
  const cyro = pair ? resolveProfile(pair.cyroId) : undefined;

  return (
    <>
      <header className="header">
        <h1>Azeron Dashboard</h1>
        <div className="profile-tabs">
          {PROFILE_PAIRS.map((p, i) => (
            <button
              key={i}
              className={`tab ${activeTab === i ? "active" : "inactive"}`}
              onClick={() => setActiveTab(i)}
            >
              {p.label}
              <span className="platform">{p.platform}</span>
            </button>
          ))}
          {importedGroups.map((group, i) => {
            const tabIndex = PROFILE_PAIRS.length + i;
            const key = group[0].pairId ?? group[0].id;
            return (
              <button
                key={key}
                className={`tab ${activeTab === tabIndex ? "active" : "inactive"} tab-imported`}
                onClick={() => setActiveTab(tabIndex)}
              >
                {group[0].label}
                <span className="platform">rewasd</span>
                <span
                  className="tab-delete"
                  role="button"
                  aria-label="Remove profile"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGroup(key);
                  }}
                >
                  ✕
                </span>
              </button>
            );
          })}
          <input
            ref={fileInputRef}
            type="file"
            accept=".rewasd"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
          <button
            className="tab tab-import"
            onClick={() => fileInputRef.current?.click()}
          >
            + Import
          </button>
        </div>
      </header>

      {importError && (
        <div className="import-error" onClick={() => setImportError(null)}>
          {importError}
        </div>
      )}

      <div className="main">
        <Legend activeZone={activeZone} onToggle={toggleZone} />

        <div className="device-panel">
          {importedGroup ? (
            <>
              {importedCyborg && (
                <DeviceSection
                  profile={importedCyborg}
                  activeZone={activeZone}
                  onSave={handleButtonSave}
                />
              )}
              <div className="right-col">
                {importedCyro && (
                  <DeviceSection
                    profile={importedCyro}
                    activeZone={activeZone}
                    className="column"
                    onSave={handleButtonSave}
                  />
                )}
                <RadialMenus
                  menus={(importedCyborg ?? importedCyro)?.radialMenus ?? []}
                />
              </div>
            </>
          ) : (
            <>
              {cyborg && (
                <DeviceSection
                  profile={cyborg}
                  activeZone={activeZone}
                  onSave={handleButtonSave}
                />
              )}
              <div className="right-col">
                {cyro && (
                  <DeviceSection
                    profile={cyro}
                    activeZone={activeZone}
                    className="column"
                    onSave={handleButtonSave}
                  />
                )}
                <RadialMenus menus={cyborg?.radialMenus ?? []} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/renderer/keybinds/App.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Run the full test suite**

```
npm test
```

Expected: all tests pass with no regressions.

- [ ] **Step 6: Run lint**

```
npm run lint
```

Expected: no warnings or errors.

- [ ] **Step 7: Run typecheck**

```
npm run typecheck
```

Expected: no type errors.

- [ ] **Step 8: Commit**

```
git add src/renderer/keybinds/src/App.tsx tests/renderer/keybinds/App.test.tsx
git commit -m "feat: wire up save flow in App — resolveProfile, importedGroups filter, handleButtonSave"
```
