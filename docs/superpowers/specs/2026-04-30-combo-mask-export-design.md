# Combo Mask Export Design

**Date:** 2026-04-30  
**Scope:** `generateRewasd.ts` — add combo export  
**Status:** Approved

## Problem

`Profile.combos` is populated by the reWASD parser for multi-button chord masks, and is displayed in `CombosPanel`. However, `generateRewasd` never reads `combos`, so any combos present on a profile are silently dropped on export.

## Goal

When generating a reWASD file from one or more profiles, combos are emitted as multi-entry masks and their bindings are emitted as mappings — identical in structure to what the parser would produce on re-import.

## Constraints

- Cross-device combos (buttons spanning Cyborg and Cyro simultaneously) are out of scope. All buttons in a combo are assumed to belong to the profile's device.
- No changes to `types.ts`, `rewasdSchema.ts`, or `parseRewasd.ts`.
- No new helper functions — follow the existing inline accumulation pattern.

## Design

### Location

A new loop is added to `generateRewasd` immediately after the existing per-profile button-mapping loop (currently ends around line 524).

### Algorithm

```
for each profile p with p.combos:
  deviceId = p.device === "cyborg" ? 1 : 2
  btnInv   = p.device === "cyborg" ? CYBORG_BTN_INV : CYRO_BTN_INV

  for each combo in p.combos:
    mappedButtons = combo.buttons
      .map(b => btnInv[b])
      .filter(id => id !== undefined)

    if mappedButtons.length < 2: skip (degenerate — not a real chord)

    maskId = nextMaskId++
    masks.push({ id: maskId, set: mappedButtons.map(id => ({ deviceId, buttonId: id })) })

    shiftId = combo.layer !== "default"
      ? layerKeyToShiftId.get(combo.layer)
      : undefined

    for each activatorType in BINDING_ACTIVATORS:
      binding = combo.bindings[activatorType]
      if !binding: continue

      condition = { shiftId?, mask: { id: maskId, activator: activatorToRewasd(activatorType) } }

      if binding starts with "→ ":
        targetLayer = resolveLayerTarget(binding)
        if targetLayer !== undefined:
          mappings.push({ description: combo.label, condition, jumpToLayer: { layer: targetLayer } })
      else:
        macros = bindingToMacros(binding)
        if macros.length > 0:
          mappings.push({ description: combo.label, condition, macros })
```

This is the same branching logic used for regular buttons, just driven by `Combo` fields instead of `Button` fields.

### No pre-allocation needed

Regular buttons pre-allocate masks before the mapping loop so `getOrCreateButtonMask` can return the same id for the same physical button across layers. Combos are unique chords — each `Combo` object in the array is a distinct multi-button mask — so pre-allocation is unnecessary; masks are created on demand in the loop.

## Tests

New test file (or additions to an existing exporter test):

1. **Basic chord export** — profile with a 2-button combo (`buttons: ["1","2"]`, `layer: "default"`, `bindings: { single: "A" }`). Assert `masks` contains one entry with `set.length === 2` and correct `deviceId`/`buttonId` values. Assert `mappings` has a corresponding entry with the correct `maskId`.

2. **Shifted combo** — combo with `layer: "shift"`. Assert the emitted mapping `condition` includes `shiftId`.

3. **Degenerate combo** — combo with only 1 mappable button (the other button number has no entry in `btnInv`). Assert it is skipped (no mask or mapping emitted for it).

## Files Changed

| File | Change |
|------|--------|
| `src/renderer/keybinds/src/exporters/generateRewasd.ts` | Add combo loop (~30 lines) |
| `tests/renderer/exporters/generateRewasd.test.ts` | New/extended tests for combo export |
