# reWASD Generator Design

**Date:** 2026-04-28
**Feature:** Export keybind profiles from the dashboard as `.rewasd` files usable in actual reWASD software.

## Overview

Add a `generateRewasd` function and an Export button to the keybinds dashboard. The workflow: edit profiles in the dashboard (or have Claude generate profile JSON), click Export, load the `.rewasd` file into reWASD, tweak, and re-import back via the existing parser.

---

## Architecture

### New file: `src/renderer/keybinds/src/exporters/generateRewasd.ts`

Pure function — no side effects, no UI, independently testable.

```typescript
export function generateRewasd(profiles: Profile[]): RewasdFile
```

Accepts 1–2 profiles (cyborg and/or cyro from the same pair). Returns a `RewasdFile` (from the existing `rewasdSchema.ts`) that can be `JSON.stringify`'d directly to `.rewasd`.

### Changed file: `src/renderer/keybinds/src/App.tsx`

- "Export" button added to the header tab bar, to the left of "Import"
- Active on all tabs (built-in and imported)
- Triggers a blob download as `{label}.rewasd` in the renderer — no IPC needed

---

## Core Translation

### Reverse button maps

Built at module load by inverting `CYBORG_BTN` / `CYRO_BTN` from the parser:

```
CYBORG_BTN_INV: { "1"→1, "2"→5, "3"→13, … }  (Azeron btn# → reWASD buttonId)
CYRO_BTN_INV:  { "1"→20, "2"→19, … }
```

Buttons not present in the map are silently skipped (no reWASD equivalent).

### DIK scan codes

New `DIK_SCAN: Record<string, number>` table — maps each DIK name to its DirectInput scan code (e.g. `DIK_A→30`, `DIK_LCONTROL→29`, `DIK_LEFT→203`). This is the missing half of the existing `DIK_NAMES` table in the parser.

### `bindingToMacros(binding: string): RewasdMacroItem[]`

Reverses `macrosToBinding` from the parser:

| Binding string | Emitted macro |
|---|---|
| `"A"` | `{keyboard: {buttonId: 30, description: "DIK_A"}}` |
| `"Ctrl+Z"` | keyboard DIK_LCONTROL + DIK_Z |
| `"LClick"` / `"RClick"` / `"MClick"` | `{mouse: {buttonId: 1/2/3}}` |
| `"Mouse Left"` | `{mouse: {direction: "left"}}` |
| `"Wheel Up"` | `{mouse: {wheel: "up"}}` |
| `"→ …"` | skipped — caller emits `jumpToLayer` instead |
| Unknown | empty macros (reWASD command names cannot round-trip) |

### `activatorToRewasd(type: ActivatorType): RewasdActivator`

Reverses `resolveActivatorType` from the parser:

| Our type | reWASD activator |
|---|---|
| `single` | `{type:"single", mode:"hold_until_release"}` |
| `double` | `{type:"double", mode:"hold_until_release"}` |
| `triple` | `{type:"triple", mode:"hold_until_release"}` |
| `long` | `{type:"long", mode:"hold_until_release"}` |
| `down` | `{type:"start", mode:"onetime", params:{expert:true}}` |
| `up` | `{type:"release", mode:"onetime", params:{expert:true}}` |
| `turbo` | `{type:"single", mode:"turbo"}` |
| `toggle` | `{type:"single", mode:"toggle"}` |

### Description field

Each mapping gets `description: button.label` — a plain label string, not the `"Cyborg #N - …"` prefix format. This keeps labels visible in reWASD and ensures the parser uses the mask-based path (not description-based) on re-import. Using the prefix format would cause the parser to skip macros and lose non-combo bindings.

---

## File Structure Generation

### `devices.hardware`

Always emits 4 entries with fixed IDs matching the demo file ordering:

```
id:1  name:"gamepad"              (cyborg — omitted if no cyborg profile)
id:2  name:"gamepad"              (cyro   — omitted if no cyro profile)
id:21 name:"keyboard" type:"standard"
id:33 name:"mouse"
```

Parser assigns cyborg=first gamepad, cyro=second by `sort(id)` — fixed IDs 1 and 2 preserve this.

### Shift allocation

One pass over all profiles collecting unique layer keys:

- `"default"` → no shift entry
- Each named key (`"shift"`, `"shift-2"`, …) → `{id: N, type:"default", description?: layerLabels[key]}`
- Each radial menu → `{id: M, type:"radialMenu"}` (see Radial Menus section)

### Mask allocation

One mask per unique `(deviceId, azeronBtnId)` pair, assigned sequential IDs. A mask is reused across all layers and activator types for that button — the activator lives on the mapping's condition, not the mask. Radial `radialMenuSet` masks are appended after all button masks.

### Mapping generation

For each `(profile, layerKey, buttonId, activatorType)` with a non-empty binding:

```typescript
{
  description: button.label,
  condition: {
    ...(layerKey !== "default" && { shiftId }),
    mask: { id: maskId, activator: activatorToRewasd(activatorType) }
  },
  // one of:
  jumpToLayer: { layer: targetShiftId }  // binding starts with "→"
  macros: bindingToMacros(binding)       // otherwise
}
```

Layer-switch target resolution:
- `"→ Default"` → `layer: 0`
- `"→ SomeName"` → look up by `layerLabels` value or layer key display name → corresponding shift id

---

## Radial Menus

Taken from the cyborg profile's `radialMenus` if present, otherwise the cyro profile's. The owning profile's device determines which `deviceId` is used for the trigger mask — cyborg=1, cyro=2.

### Shift

One `{id: M, type:"radialMenu"}` shift per top-level `RadialMenu`.

### Trigger mapping

For each `RadialMenu`, one mapping on the trigger button that jumps to the radial shift:

```typescript
{
  description: menu.label,
  condition: { mask: { id: triggerMaskId, activator: {type:"single", mode:"hold_until_release"} } },
  jumpToLayer: { layer: radialShiftId }
}
```

The trigger button reuses the existing button mask for that `(deviceId, menu.trigger)` pair.

### Circles and sectors

Each `RadialMenu` → one `RewasdCircle`. Each `RadialAction` → one `RewasdSector`. Submenus recurse — `RadialAction.submenu` produces a child circle with `parentSectorId` set and `sector.childCircleId` pointing back. Sector colors come from the menu's hex color parsed to `[r, g, b]`. Sector descriptions come from `action.label`.

### Radial action masks

One `radialMenuSet` mask per sector, pointing to `{circleId, sectorId}`. Appended after button masks.

### Radial action mappings

For each action with a binding:

```typescript
{
  description: action.label,
  condition: { shiftId: radialShiftId, mask: { id: sectorMaskId, activator: {type:"single", mode:"hold_until_release"} } },
  macros: bindingToMacros(action.binding)
}
```

Actions without a binding emit no mapping. `"→ Default"` binding emits `jumpToLayer: {layer: 0}`.

---

## UI

Export button in the header tab bar, to the left of "Import":

```
[Mac Default] … [rewasd tab ✕]  [+ Import]  [↓ Export]
```

On click:
1. Resolve the current tab's profiles (cyborg + cyro if both present)
2. Call `generateRewasd(profiles)`
3. `JSON.stringify` with 2-space indent
4. Create a blob URL and trigger download via a hidden `<a download="{label}.rewasd">` — same pattern as the existing hidden file input

Filename: `{profile.label}.rewasd` (label from first profile in the pair).

---

## Testing

### Round-trip test (primary)

```typescript
const file = generateRewasd([cyborgProfile, cyroProfile])
const reparsed = parseRewasd(file)
// compare layers, button IDs, labels, bindings
```

### Per-binding type tests

One test each: keyboard single key, modifier combo, mouse button, mouse direction, wheel, layer switch to named layer, layer switch to default.

### Activator tests

All 8 activator types survive the round-trip.

### Shift layer test

Profile with a named shift layer — verify layer appears with correct `shiftId` and bindings.

### Radial menu tests

- Flat radial menu — circles/sectors/masks emitted and re-parse correctly
- Nested submenu — child circle with `parentSectorId` and `childCircleId` set correctly

### Edge cases

- Cyborg-only profile — device id 2 omitted, no crash
- Button not in reverse map — silently skipped
- Unknown binding string — emits empty macros, no crash
