# Combos Panel — Design Spec

**Date:** 2026-04-29  
**Feature:** Display chord/combination bindings below the device grids with zone-style interactive highlighting.

---

## Problem

`Profile.combos` is populated by the reWASD parser for imported profiles but has no UI. Users cannot see which chord combinations are defined in a profile.

---

## Architecture

### New component: `CombosPanel`

`src/renderer/keybinds/src/components/CombosPanel.tsx`

Props:
```ts
interface Props {
  combos: { combo: Combo; device: Device }[];
  selectedIndex: number | null;
  onSelect: (idx: number | null) => void;
}
```

Renders a `.panel` div (reuses existing panel styles) with a `.panel-title` of "Combos". Each combo renders as a clickable row showing:
- Button chips: `[#1] + [#2] + [#3]`
- Label
- Zone badge (uses existing zone colour classes)
- Layer badge (only shown when layer is not `"default"`)
- Bindings: each non-empty binding key/value on the same row, e.g. `Single: A  Long: B`

Clicking a selected row deselects it (passes `null`). Empty state: "No combos defined for this profile."

---

## Data flow

### `App.tsx` changes

1. **Merged combos**: Derive `mergedCombos: { combo: Combo; device: Device }[]` from the active cyborg and cyro profiles. Cyborg combos come first, then cyro. Recomputed whenever the active tab or imported profiles change (via `useMemo`).

2. **Selection state**: `const [selectedComboIdx, setSelectedComboIdx] = useState<number | null>(null)`. Reset to `null` whenever the active tab changes.

3. **Mutual exclusion with zone filter**:
   - `toggleZone` clears `selectedComboIdx` before setting the zone.
   - A new `handleComboSelect` clears `activeZone` before setting `selectedComboIdx`.

4. **Highlighted buttons**: When `selectedComboIdx` is not null, read the selected combo's `device` and `buttons`. Pass `highlightedButtons` only to the `DeviceSection` whose `profile.device` matches; pass `null` to the other.

5. **Placement**: `<CombosPanel>` is added as a direct child of `.main`, after the `device-panel` div. Present in both the built-in and imported profile branches.

---

## Component changes

### `DeviceSection`

New optional prop: `highlightedButtons?: Set<string> | null`

Passes it through to `Btn` (via existing render loop) and to `CyborgThumb` / `CyroThumb`.

### `Btn`

New optional prop: `highlightedButtons?: Set<string> | null`

Dimming logic becomes:
```ts
const dimmed =
  (activeZone !== null && activeZone !== zone) ||
  (highlightedButtons != null && !highlightedButtons.has(id))
    ? { opacity: 0.1 }
    : undefined;
```

### `CyborgThumb` / `CyroThumb`

Same new prop `highlightedButtons?: Set<string> | null`, forwarded to each thumb button's dim check using the same logic as `Btn` (keyed on the button's Azeron ID string).

---

## Styling

New classes in `index.css`:

| Class | Purpose |
|-------|---------|
| `.combo-row` | Flex row, clickable, hover + selected states matching `.rrow` style |
| `.combo-row.selected` | Active highlight (purple background, bright text) |
| `.combo-chip` | Button number badge — monospace, small, purple-tinted |
| `.combo-plus` | `+` separator between chips — muted colour |
| `.combo-label` | Combo name |
| `.combo-zone` | Zone badge reusing existing `.li-{zone}` colour tokens |
| `.combo-layer` | Layer badge (only rendered when layer ≠ `"default"`) |
| `.combo-bindings` | Inline binding list, same font/colour as `.tip-binding` |

---

## Constraints

- Combos are per-device. Highlighting only affects the device the selected combo belongs to; the other device renders without any `highlightedButtons` filter.
- Zone filter and combo selection are mutually exclusive — activating one clears the other.
- `selectedComboIdx` resets to `null` on tab change to avoid stale selection across profiles.
- No edit capability in this pass — combos are read-only display only.
