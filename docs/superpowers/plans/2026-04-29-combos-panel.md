# Combos Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display merged chord/combination bindings from cyborg + cyro profiles in a panel below the device grids, with zone-style button highlighting on selection.

**Architecture:** New `CombosPanel` component lives in `src/renderer/keybinds/src/components/`. Selection state and merged combos are managed in `App.tsx`. Highlighting is propagated via a `highlightedButtons: Set<string> | null` prop through `DeviceSection` → `Btn` / `CyborgThumb` / `CyroThumb`, mirroring the existing zone-dimming pattern exactly.

**Tech Stack:** React 18, TypeScript, Vitest + React Testing Library, inline CSS (index.css)

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/renderer/keybinds/src/components/Btn.tsx` |
| Modify | `src/renderer/keybinds/src/components/CyborgThumb.tsx` |
| Modify | `src/renderer/keybinds/src/components/CyroThumb.tsx` |
| Modify | `src/renderer/keybinds/src/components/DeviceSection.tsx` |
| Create | `src/renderer/keybinds/src/components/CombosPanel.tsx` |
| Modify | `src/renderer/keybinds/src/App.tsx` |
| Modify | `src/renderer/keybinds/src/index.css` |
| Modify | `tests/renderer/keybinds/Btn.test.tsx` |
| Modify | `tests/renderer/keybinds/CyborgThumb.test.tsx` |
| Modify | `tests/renderer/keybinds/CyroThumb.test.tsx` |
| Modify | `tests/renderer/keybinds/DeviceSection.test.tsx` |
| Create | `tests/renderer/keybinds/CombosPanel.test.tsx` |
| Modify | `tests/renderer/keybinds/App.test.tsx` |

---

## Task 1: Add `highlightedButtons` prop to `Btn`

**Files:**
- Modify: `src/renderer/keybinds/src/components/Btn.tsx`
- Modify: `tests/renderer/keybinds/Btn.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append these two tests to the `describe("Btn")` block in `tests/renderer/keybinds/Btn.test.tsx`:

```tsx
it("dims when highlightedButtons is set and id is not in the set", () => {
  const { container } = render(
    <Btn
      id="3"
      button={{ zone: "edit", label: "Copy", bindings: {} }}
      activeZone={null}
      highlightedButtons={new Set(["99"])}
    />,
  );
  const btn = container.querySelector(".btn") as HTMLElement;
  expect(btn.style.opacity).toBe("0.1");
});

it("does not dim when highlightedButtons is set and id is in the set", () => {
  const { container } = render(
    <Btn
      id="3"
      button={{ zone: "edit", label: "Copy", bindings: {} }}
      activeZone={null}
      highlightedButtons={new Set(["3"])}
    />,
  );
  const btn = container.querySelector(".btn") as HTMLElement;
  expect(btn.style.opacity).toBe("");
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run tests/renderer/keybinds/Btn.test.tsx
```

Expected: 2 failures — `highlightedButtons` prop does not exist yet.

- [ ] **Step 3: Update `Btn.tsx`**

Replace the entire `interface Props` block and `const dimmed` line with the following. The rest of the file stays identical.

Replace:
```tsx
interface Props {
  id: string;
  button?: Button;
  activeZone: Zone | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}
```
With:
```tsx
interface Props {
  id: string;
  button?: Button;
  activeZone: Zone | null;
  highlightedButtons?: Set<string> | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}
```

Replace the destructuring line:
```tsx
export default function Btn({
  id,
  button,
  activeZone,
  isEditing,
  onEditButton,
}: Props): JSX.Element {
```
With:
```tsx
export default function Btn({
  id,
  button,
  activeZone,
  highlightedButtons,
  isEditing,
  onEditButton,
}: Props): JSX.Element {
```

Replace:
```tsx
  const dimmed =
    activeZone !== null && activeZone !== zone ? { opacity: 0.1 } : undefined;
```
With:
```tsx
  const dimmed =
    (activeZone !== null && activeZone !== zone) ||
    (highlightedButtons != null && !highlightedButtons.has(id))
      ? { opacity: 0.1 }
      : undefined;
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run tests/renderer/keybinds/Btn.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Commit**

```
git add src/renderer/keybinds/src/components/Btn.tsx tests/renderer/keybinds/Btn.test.tsx
git commit -m "feat: add highlightedButtons prop to Btn for combo highlighting"
```

---

## Task 2: Add `highlightedButtons` prop to `CyborgThumb`

**Files:**
- Modify: `src/renderer/keybinds/src/components/CyborgThumb.tsx`
- Modify: `tests/renderer/keybinds/CyborgThumb.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append these two tests to `tests/renderer/keybinds/CyborgThumb.test.tsx`:

```tsx
it("dims thumb button when highlightedButtons is set and id not in set", () => {
  render(
    <CyborgThumb
      layer={layer}
      activeZone={null}
      highlightedButtons={new Set(["99"])}
    />,
  );
  const btn = screen.getByText("Jump").closest(".tbtn") as HTMLElement;
  expect(btn.style.opacity).toBe("0.1");
});

it("does not dim thumb button when id is in highlightedButtons", () => {
  render(
    <CyborgThumb
      layer={layer}
      activeZone={null}
      highlightedButtons={new Set(["22"])}
    />,
  );
  const btn = screen.getByText("Jump").closest(".tbtn") as HTMLElement;
  expect(btn.style.opacity).toBe("");
});
```

- [ ] **Step 2: Run to confirm failures**

```
npx vitest run tests/renderer/keybinds/CyborgThumb.test.tsx
```

Expected: 2 failures.

- [ ] **Step 3: Update `CyborgThumb.tsx`**

Add `highlightedButtons?: Set<string> | null` to both `Props` and `TBtnProps`, destructure in both functions, and update the `dimmed` calculation in `TBtn`.

Replace:
```tsx
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
```
With:
```tsx
interface Props {
  layer: Layer;
  activeZone: Zone | null;
  highlightedButtons?: Set<string> | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}

interface TBtnProps {
  id: string;
  dir: string;
  layer: Layer;
  activeZone: Zone | null;
  highlightedButtons?: Set<string> | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}
```

Replace the `TBtn` function signature:
```tsx
function TBtn({
  id,
  dir,
  layer,
  activeZone,
  isEditing,
  onEditButton,
}: TBtnProps): JSX.Element {
```
With:
```tsx
function TBtn({
  id,
  dir,
  layer,
  activeZone,
  highlightedButtons,
  isEditing,
  onEditButton,
}: TBtnProps): JSX.Element {
```

Replace the `dimmed` calculation inside `TBtn`:
```tsx
  const dimmed =
    activeZone !== null && activeZone !== btn.zone
      ? { opacity: 0.1 }
      : undefined;
```
With:
```tsx
  const dimmed =
    (activeZone !== null && activeZone !== btn.zone) ||
    (highlightedButtons != null && !highlightedButtons.has(id))
      ? { opacity: 0.1 }
      : undefined;
```

Replace the `CyborgThumb` function signature:
```tsx
export default function CyborgThumb({
  layer,
  activeZone,
  isEditing,
  onEditButton,
}: Props): JSX.Element {
```
With:
```tsx
export default function CyborgThumb({
  layer,
  activeZone,
  highlightedButtons,
  isEditing,
  onEditButton,
}: Props): JSX.Element {
```

Pass `highlightedButtons` through each `TBtn` call. Replace:
```tsx
              <TBtn
                key={cell.id}
                id={cell.id}
                dir={cell.dir}
                layer={layer}
                activeZone={activeZone}
                isEditing={isEditing}
                onEditButton={onEditButton}
              />
```
With:
```tsx
              <TBtn
                key={cell.id}
                id={cell.id}
                dir={cell.dir}
                layer={layer}
                activeZone={activeZone}
                highlightedButtons={highlightedButtons}
                isEditing={isEditing}
                onEditButton={onEditButton}
              />
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run tests/renderer/keybinds/CyborgThumb.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Commit**

```
git add src/renderer/keybinds/src/components/CyborgThumb.tsx tests/renderer/keybinds/CyborgThumb.test.tsx
git commit -m "feat: add highlightedButtons prop to CyborgThumb"
```

---

## Task 3: Add `highlightedButtons` prop to `CyroThumb`

**Files:**
- Modify: `src/renderer/keybinds/src/components/CyroThumb.tsx`
- Modify: `tests/renderer/keybinds/CyroThumb.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append these two tests to `tests/renderer/keybinds/CyroThumb.test.tsx`:

```tsx
it("dims thumb button when highlightedButtons is set and id not in set", () => {
  render(
    <CyroThumb
      layer={layer}
      activeZone={null}
      highlightedButtons={new Set(["99"])}
    />,
  );
  const btn = screen.getByText("Jump").closest(".tbtn") as HTMLElement;
  expect(btn.style.opacity).toBe("0.1");
});

it("does not dim thumb button when id is in highlightedButtons", () => {
  render(
    <CyroThumb
      layer={layer}
      activeZone={null}
      highlightedButtons={new Set(["22"])}
    />,
  );
  const btn = screen.getByText("Jump").closest(".tbtn") as HTMLElement;
  expect(btn.style.opacity).toBe("");
});
```

- [ ] **Step 2: Run to confirm failures**

```
npx vitest run tests/renderer/keybinds/CyroThumb.test.tsx
```

Expected: 2 failures.

- [ ] **Step 3: Update `CyroThumb.tsx`**

Add `highlightedButtons?: Set<string> | null` to `Props` and destructure it. Update the inline `dimmed` calculation.

Replace:
```tsx
interface Props {
  layer: Layer;
  activeZone: Zone | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}
```
With:
```tsx
interface Props {
  layer: Layer;
  activeZone: Zone | null;
  highlightedButtons?: Set<string> | null;
  isEditing?: boolean;
  onEditButton?: (id: string, rect: DOMRect) => void;
}
```

Replace the function signature:
```tsx
export default function CyroThumb({
  layer,
  activeZone,
  isEditing,
  onEditButton,
}: Props): JSX.Element {
```
With:
```tsx
export default function CyroThumb({
  layer,
  activeZone,
  highlightedButtons,
  isEditing,
  onEditButton,
}: Props): JSX.Element {
```

Replace the inline `dimmed` calculation inside the `.map()` callback:
```tsx
          const dimmed =
            activeZone !== null && activeZone !== btn.zone
              ? { opacity: 0.1 }
              : undefined;
```
With:
```tsx
          const dimmed =
            (activeZone !== null && activeZone !== btn.zone) ||
            (highlightedButtons != null && !highlightedButtons.has(id))
              ? { opacity: 0.1 }
              : undefined;
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run tests/renderer/keybinds/CyroThumb.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Commit**

```
git add src/renderer/keybinds/src/components/CyroThumb.tsx tests/renderer/keybinds/CyroThumb.test.tsx
git commit -m "feat: add highlightedButtons prop to CyroThumb"
```

---

## Task 4: Pass `highlightedButtons` through `DeviceSection`

**Files:**
- Modify: `src/renderer/keybinds/src/components/DeviceSection.tsx`
- Modify: `tests/renderer/keybinds/DeviceSection.test.tsx`

- [ ] **Step 1: Write failing tests**

Append these two tests to the `describe("DeviceSection")` block in `tests/renderer/keybinds/DeviceSection.test.tsx`:

```tsx
it("dims a grid button when its id is not in highlightedButtons", () => {
  const { container } = render(
    <DeviceSection
      profile={cyborgProfile}
      activeZone={null}
      highlightedButtons={new Set(["99"])}
      onSave={vi.fn()}
    />,
  );
  const btn = screen.getByText("Copy").closest(".btn") as HTMLElement;
  expect(btn.style.opacity).toBe("0.1");
});

it("does not dim a grid button when its id is in highlightedButtons", () => {
  render(
    <DeviceSection
      profile={cyborgProfile}
      activeZone={null}
      highlightedButtons={new Set(["1"])}
      onSave={vi.fn()}
    />,
  );
  const btn = screen.getByText("Copy").closest(".btn") as HTMLElement;
  expect(btn.style.opacity).toBe("");
});
```

- [ ] **Step 2: Run to confirm failures**

```
npx vitest run tests/renderer/keybinds/DeviceSection.test.tsx
```

Expected: 2 failures.

- [ ] **Step 3: Update `DeviceSection.tsx`**

Add `highlightedButtons?: Set<string> | null` to `Props` and pass it to every `Btn`, `CyborgThumb`, and `CyroThumb` call.

Replace:
```tsx
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
```
With:
```tsx
interface Props {
  profile: Profile;
  activeZone: Zone | null;
  highlightedButtons?: Set<string> | null;
  className?: string;
  onSave: (
    profileId: string,
    layerKey: string,
    buttonId: string,
    updated: Button,
  ) => void;
}
```

Replace the function signature:
```tsx
export default function DeviceSection({
  profile,
  activeZone,
  className,
  onSave,
}: Props): JSX.Element {
```
With:
```tsx
export default function DeviceSection({
  profile,
  activeZone,
  highlightedButtons,
  className,
  onSave,
}: Props): JSX.Element {
```

In the grid render loop, replace each `<Btn` call:
```tsx
              <Btn
                key={id}
                id={id}
                button={layer[id]}
                activeZone={activeZone}
                isEditing={isEditing}
                onEditButton={handleEditButton}
              />
```
With:
```tsx
              <Btn
                key={id}
                id={id}
                button={layer[id]}
                activeZone={activeZone}
                highlightedButtons={highlightedButtons}
                isEditing={isEditing}
                onEditButton={handleEditButton}
              />
```

Replace the `CyborgThumb` call:
```tsx
        <CyborgThumb
          layer={layer}
          activeZone={activeZone}
          isEditing={isEditing}
          onEditButton={handleEditButton}
        />
```
With:
```tsx
        <CyborgThumb
          layer={layer}
          activeZone={activeZone}
          highlightedButtons={highlightedButtons}
          isEditing={isEditing}
          onEditButton={handleEditButton}
        />
```

Replace the `CyroThumb` call:
```tsx
        <CyroThumb
          layer={layer}
          activeZone={activeZone}
          isEditing={isEditing}
          onEditButton={handleEditButton}
        />
```
With:
```tsx
        <CyroThumb
          layer={layer}
          activeZone={activeZone}
          highlightedButtons={highlightedButtons}
          isEditing={isEditing}
          onEditButton={handleEditButton}
        />
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run tests/renderer/keybinds/DeviceSection.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Commit**

```
git add src/renderer/keybinds/src/components/DeviceSection.tsx tests/renderer/keybinds/DeviceSection.test.tsx
git commit -m "feat: pass highlightedButtons through DeviceSection to Btn and thumb components"
```

---

## Task 5: Create `CombosPanel` component

**Files:**
- Create: `src/renderer/keybinds/src/components/CombosPanel.tsx`
- Create: `tests/renderer/keybinds/CombosPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/renderer/keybinds/CombosPanel.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CombosPanel from "@keybinds/components/CombosPanel";
import type { Combo, Device } from "@keybinds/data/types";

const combos: { combo: Combo; device: Device }[] = [
  {
    device: "cyborg",
    combo: {
      buttons: ["1", "2"],
      zone: "edit",
      label: "Copy All",
      bindings: { single: "Ctrl+A" },
      layer: "default",
    },
  },
  {
    device: "cyro",
    combo: {
      buttons: ["3"],
      zone: "nav",
      label: "Page Up",
      bindings: { long: "PgUp" },
      layer: "shift",
    },
  },
];

describe("CombosPanel", () => {
  it("renders empty state when no combos", () => {
    render(
      <CombosPanel combos={[]} selectedIndex={null} onSelect={vi.fn()} />,
    );
    expect(
      screen.getByText("No combos defined for this profile."),
    ).toBeInTheDocument();
  });

  it("renders the panel title", () => {
    render(
      <CombosPanel combos={combos} selectedIndex={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("Combos")).toBeInTheDocument();
  });

  it("renders combo labels", () => {
    render(
      <CombosPanel combos={combos} selectedIndex={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("Copy All")).toBeInTheDocument();
    expect(screen.getByText("Page Up")).toBeInTheDocument();
  });

  it("renders button chips for each button in a combo", () => {
    render(
      <CombosPanel combos={combos} selectedIndex={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  it("calls onSelect with index when a row is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <CombosPanel combos={combos} selectedIndex={null} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByText("Copy All"));
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it("calls onSelect with null when the selected row is clicked again", async () => {
    const onSelect = vi.fn();
    render(
      <CombosPanel combos={combos} selectedIndex={0} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByText("Copy All"));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("adds selected class to the active row", () => {
    const { container } = render(
      <CombosPanel combos={combos} selectedIndex={0} onSelect={vi.fn()} />,
    );
    const rows = container.querySelectorAll(".combo-row");
    expect(rows[0].classList.contains("selected")).toBe(true);
    expect(rows[1].classList.contains("selected")).toBe(false);
  });

  it("renders binding key and value", () => {
    render(
      <CombosPanel combos={combos} selectedIndex={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("Ctrl+A")).toBeInTheDocument();
    expect(screen.getByText("PgUp")).toBeInTheDocument();
  });

  it("renders layer badge only when layer is not default", () => {
    render(
      <CombosPanel combos={combos} selectedIndex={null} onSelect={vi.fn()} />,
    );
    const layerBadges = document.querySelectorAll(".combo-layer");
    expect(layerBadges).toHaveLength(1);
    expect(layerBadges[0].textContent).toBe("shift");
  });
});
```

- [ ] **Step 2: Run to confirm failures**

```
npx vitest run tests/renderer/keybinds/CombosPanel.test.tsx
```

Expected: module not found errors.

- [ ] **Step 3: Create `CombosPanel.tsx`**

Create `src/renderer/keybinds/src/components/CombosPanel.tsx`:

```tsx
import type { Combo, Device } from "../data/types";

const BINDING_KEYS: (keyof Combo["bindings"])[] = [
  "single", "double", "triple", "long", "down", "up", "turbo", "toggle",
];

interface Props {
  combos: { combo: Combo; device: Device }[];
  selectedIndex: number | null;
  onSelect: (idx: number | null) => void;
}

export default function CombosPanel({
  combos,
  selectedIndex,
  onSelect,
}: Props): JSX.Element {
  return (
    <div className="panel">
      <div className="panel-title">Combos</div>
      {combos.length === 0 ? (
        <p style={{ fontSize: 11, color: "#6b7280" }}>
          No combos defined for this profile.
        </p>
      ) : (
        <ul className="combo-list">
          {combos.map(({ combo }, idx) => (
            <li
              key={idx}
              className={`combo-row${selectedIndex === idx ? " selected" : ""}`}
              onClick={() => onSelect(selectedIndex === idx ? null : idx)}
            >
              <span className="combo-chips">
                {combo.buttons.map((b, bi) => (
                  <span key={b} className="combo-chip-group">
                    {bi > 0 && <span className="combo-plus">+</span>}
                    <span className="combo-chip">#{b}</span>
                  </span>
                ))}
              </span>
              <span className="combo-label">{combo.label}</span>
              <span className={`combo-zone li-${combo.zone}`}>{combo.zone}</span>
              {combo.layer !== "default" && (
                <span className="combo-layer">{combo.layer}</span>
              )}
              <span className="combo-bindings">
                {BINDING_KEYS.filter((k) => combo.bindings[k]).map((k) => (
                  <span key={k} className="combo-binding-entry">
                    <span className="combo-binding-type">{k}</span>
                    <span className="combo-binding-value">
                      {combo.bindings[k]}
                    </span>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run tests/renderer/keybinds/CombosPanel.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Commit**

```
git add src/renderer/keybinds/src/components/CombosPanel.tsx tests/renderer/keybinds/CombosPanel.test.tsx
git commit -m "feat: add CombosPanel component"
```

---

## Task 6: Add combo styles to `index.css`

**Files:**
- Modify: `src/renderer/keybinds/src/index.css`

- [ ] **Step 1: Append the following block to the end of `index.css`**

```css
/* ── Combos Panel ── */
.combo-list { list-style: none; display: flex; flex-direction: column; gap: 2px; }
.combo-row {
  display: flex; align-items: center; gap: 8px; padding: 6px 8px;
  border-radius: 4px; cursor: pointer; font-size: 13px; color: #94a3b8;
  transition: background 0.15s; flex-wrap: wrap;
}
.combo-row:hover { background: #1e1b4b; color: #e2e8f0; }
.combo-row.selected { background: #2d1b69; color: #e2e8f0; }
.combo-chips { display: flex; align-items: center; gap: 3px; flex-shrink: 0; }
.combo-chip-group { display: flex; align-items: center; gap: 3px; }
.combo-chip {
  font-family: monospace; font-size: 11px; font-weight: 700;
  background: #1e0d4a; color: #a78bfa; border: 1px solid #4c1d95;
  border-radius: 3px; padding: 1px 5px;
}
.combo-plus { font-size: 11px; color: #4c1d95; }
.combo-label { font-weight: 600; flex-shrink: 0; }
.combo-zone {
  font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px;
  border: 1px solid transparent; text-transform: uppercase; letter-spacing: 1px;
  flex-shrink: 0;
}
.combo-layer {
  font-size: 10px; color: #7c3aed; background: #1e1b4b; border: 1px solid #2d1b69;
  border-radius: 3px; padding: 1px 5px; font-family: monospace; flex-shrink: 0;
}
.combo-bindings { display: flex; align-items: center; gap: 10px; margin-left: auto; flex-wrap: wrap; }
.combo-binding-entry { display: flex; align-items: baseline; gap: 4px; }
.combo-binding-type {
  font-size: 9px; color: #6d5fa8; text-transform: uppercase;
  letter-spacing: 1px; flex-shrink: 0;
}
.combo-binding-value { font-size: 13px; color: #e2e8f0; font-weight: 700; }
```

- [ ] **Step 2: Commit**

```
git add src/renderer/keybinds/src/index.css
git commit -m "feat: add combo panel styles to index.css"
```

---

## Task 7: Wire `CombosPanel` into `App.tsx`

**Files:**
- Modify: `src/renderer/keybinds/src/App.tsx`
- Modify: `tests/renderer/keybinds/App.test.tsx`

- [ ] **Step 1: Write the failing App tests**

Append a new describe block to `tests/renderer/keybinds/App.test.tsx`:

```tsx
describe("App — combo selection", () => {
  it("renders combos panel with empty state for profiles without combos", async () => {
    render(<App />);
    await act(async () => {});
    expect(
      screen.getByText("No combos defined for this profile."),
    ).toBeInTheDocument();
  });

  it("clears combo selection when a zone is toggled", async () => {
    const profileWithCombos: Profile = {
      id: "cyborg-windows-default",
      label: "Windows Default",
      platform: "windows",
      type: "rewasd",
      device: "cyborg",
      layers: { default: {} },
      imported: true,
      combos: [
        {
          buttons: ["1", "2"],
          zone: "edit",
          label: "Chord",
          bindings: { single: "Ctrl+Z" },
          layer: "default",
        },
      ],
    };
    let loadCb: ((profiles: Profile[]) => void) | undefined;
    (window as any).keybindsApi.onProfilesLoad = vi.fn(
      (cb: (p: Profile[]) => void) => {
        loadCb = cb;
      },
    );
    render(<App />);
    await act(async () => {
      loadCb?.([profileWithCombos]);
    });

    // Select the combo row
    await userEvent.click(screen.getByText("Chord"));
    expect(document.querySelector(".combo-row.selected")).toBeTruthy();

    // Toggle a zone — combo selection should clear
    await userEvent.click(screen.getByText("Editing"));
    expect(document.querySelector(".combo-row.selected")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm failures**

```
npx vitest run tests/renderer/keybinds/App.test.tsx
```

Expected: "No combos defined" test fails (CombosPanel not in App yet); combo-clears-zone test also fails.

- [ ] **Step 3: Update `App.tsx`**

**3a. Add imports.** Replace:
```tsx
import type { Zone, Profile, Button } from "./data/types";
```
With:
```tsx
import type { Zone, Profile, Button, Combo, Device } from "./data/types";
import CombosPanel from "./components/CombosPanel";
```

**3b. Add `selectedComboIdx` state** after the existing `importError` state declaration:
```tsx
const [selectedComboIdx, setSelectedComboIdx] = useState<number | null>(null);
```

**3c. Reset selection on tab change.** Add this `useEffect` after the existing `useEffect` that calls `loadImportedProfiles`:
```tsx
useEffect(() => {
  setSelectedComboIdx(null);
}, [activeTab]);
```

**3d. Update `toggleZone`** to clear combo selection:
```tsx
function toggleZone(zone: Zone): void {
  setSelectedComboIdx(null);
  setActiveZone((prev) => (prev === zone ? null : zone));
}
```

**3e. Add `handleComboSelect`** after `toggleZone`:
```tsx
function handleComboSelect(idx: number | null): void {
  setActiveZone(null);
  setSelectedComboIdx(idx);
}
```

**3f. Compute `mergedCombos`, `highlightedButtons`, and `highlightDevice`** in the render body, after the existing derived variables (`cyborg`, `cyro`, `importedCyborg`, `importedCyro`). Add:
```tsx
  const activeCyborg = cyborg ?? importedCyborg;
  const activeCyro = cyro ?? importedCyro;
  const mergedCombos: { combo: Combo; device: Device }[] = [
    ...(activeCyborg?.combos ?? []).map((combo) => ({
      combo,
      device: "cyborg" as Device,
    })),
    ...(activeCyro?.combos ?? []).map((combo) => ({
      combo,
      device: "cyro" as Device,
    })),
  ];
  const selectedCombo =
    selectedComboIdx !== null ? mergedCombos[selectedComboIdx] : null;
  const highlightedButtons = selectedCombo
    ? new Set(selectedCombo.combo.buttons)
    : null;
  const highlightDevice = selectedCombo?.device ?? null;
```

**3g. Pass `highlightedButtons` to each `DeviceSection`.** There are four DeviceSection usages. For each one, add the `highlightedButtons` prop, gating it on the matching device.

For `importedCyborg`:
```tsx
              <DeviceSection
                profile={importedCyborg}
                activeZone={activeZone}
                highlightedButtons={highlightDevice === "cyborg" ? highlightedButtons : null}
                onSave={handleButtonSave}
              />
```

For `importedCyro`:
```tsx
                  <DeviceSection
                    profile={importedCyro}
                    activeZone={activeZone}
                    highlightedButtons={highlightDevice === "cyro" ? highlightedButtons : null}
                    className="column"
                    onSave={handleButtonSave}
                  />
```

For `cyborg`:
```tsx
              <DeviceSection
                profile={cyborg}
                activeZone={activeZone}
                highlightedButtons={highlightDevice === "cyborg" ? highlightedButtons : null}
                onSave={handleButtonSave}
              />
```

For `cyro`:
```tsx
                  <DeviceSection
                    profile={cyro}
                    activeZone={activeZone}
                    highlightedButtons={highlightDevice === "cyro" ? highlightedButtons : null}
                    className="column"
                    onSave={handleButtonSave}
                  />
```

**3h. Add `<CombosPanel>` to the JSX.** Inside `<div className="main">`, after the closing `</div>` of `device-panel`, add:
```tsx
        <CombosPanel
          combos={mergedCombos}
          selectedIndex={selectedComboIdx}
          onSelect={handleComboSelect}
        />
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run tests/renderer/keybinds/App.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Commit**

```
git add src/renderer/keybinds/src/App.tsx tests/renderer/keybinds/App.test.tsx
git commit -m "feat: wire CombosPanel into App with zone-style highlighting"
```

---

## Task 8: Full test suite and lint

- [ ] **Step 1: Run the full test suite**

```
npm test
```

Expected: all tests pass with no failures.

- [ ] **Step 2: Run lint**

```
npm run lint
```

Expected: no warnings or errors. Fix any that appear before moving on.

- [ ] **Step 3: Run typecheck**

```
npm run typecheck
```

Expected: clean. Fix any type errors before proceeding.
