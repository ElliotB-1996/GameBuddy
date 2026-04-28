# Keybinds Edit Popup — Design Spec

**Date:** 2026-04-28
**Status:** Approved

---

## Overview

Add an edit popup to the keybinds dashboard that lets users modify any button's label, zone, and single/long/double-press bindings, then save the changes back to the profile. Edits to built-in profiles are stored as user overrides in `userData/profiles.json`.

---

## UI Behaviour

### Edit mode toggle

- Each `DeviceSection` has an **Edit** button in its device header, to the right of the layer selector.
- Clicking it toggles `isEditing` on that section. The section border gets a subtle purple glow when active; a hint label "Click any button to edit it" appears below the header.
- Pressing **Escape** anywhere while edit mode is active exits edit mode and closes any open popover.
- Turning edit mode off also clears any open popover.

### Button affordance in edit mode

- All button cells (`Btn`, `TBtn` in thumb areas) gain `cursor: pointer` and a brightened border on hover.
- Clicking a button stores its id, current layer key, and `getBoundingClientRect()` in `DeviceSection` state, opening the popover.

### Popover (anchored, Option C)

- Renders via `ReactDOM.createPortal` to `document.body` (`position: fixed`) anchored below the clicked button, or above if the button is near the bottom of the viewport.
- Clicking outside the popover closes it but keeps edit mode active so the user can immediately click another button.
- **Fields:**
  - **Label** — plain text input, pre-filled with current value
  - **Zone** — 3-column grid of color-coded pill buttons (all 9 zones); selected zone shown with bright border
  - **Single / Long / Double** — three text inputs; empty ones show `placeholder="none"`
- **Save / Cancel** buttons at the bottom right.

---

## Component Breakdown

| Component | Change |
|-----------|--------|
| `EditPopup.tsx` | **New.** Controlled form component. Props: `buttonId`, `layerKey`, `button`, `rect`, `onSave(updated: Button)`, `onClose`. Renders as a portal. |
| `DeviceSection.tsx` | **Modified.** Gains `isEditing` + `editingButton: { id, layerKey, rect } \| null` state. Renders Edit toggle. Passes `isEditing` + `onEditButton(id, rect)` to `Btn`, `CyborgThumb`, `CyroThumb`. Receives `onSave(profileId, layerKey, buttonId, updated)` from `App.tsx`. Attaches `keydown` listener for Escape. |
| `Btn.tsx` | **Modified.** Accepts optional `isEditing: boolean` and `onClick?: (id: string, rect: DOMRect) => void`. When `isEditing` is true, applies pointer cursor, hover highlight, fires `onClick` on click. |
| `CyborgThumb.tsx` / `CyroThumb.tsx` | **Modified.** Accept `isEditing` and `onEditButton(id, rect)` props; pass through to each `TBtn` rendered inside. |
| `App.tsx` | **Modified.** Adds `resolveProfile(id)` helper and updated `importedGroups` memo. Passes `onSave` handler to `DeviceSection`. |

---

## Data Flow — Save

1. User clicks **Save** in `EditPopup`.
2. `EditPopup` calls `onSave(updatedButton)`.
3. `DeviceSection` calls `App.onSave(profileId, layerKey, buttonId, updatedButton)`.
4. `App.tsx` resolves the full current profile (via `resolveProfile(profileId)`), deep-clones it, patches `profile.layers[layerKey][buttonId]`, calls `saveProfile(updatedProfile)` via IPC.
5. `App.tsx` updates `importedProfiles` state: replaces the entry with matching `id` if present, otherwise appends.
6. Re-render picks up the change immediately via `resolveProfile`.

---

## Built-in Profile Override Strategy

Built-in profiles are bundled at build time via `import.meta.glob` and cannot be written back to at runtime. User edits are stored in `userData/profiles.json` under the same `id`.

**`resolveProfile(id: string): Profile`**
```
importedProfiles.find(p => p.id === id) ?? profiles.find(p => p.id === id)
```
Prefers the user override from `importedProfiles` over the bundled version.

**`importedGroups` memo** — filters out profiles whose `id` matches any bundled profile `id`, so user overrides do not appear as extra tabs in the header.

**Resetting a built-in** (out of scope for this feature, but architecturally: call `deleteProfile(id)` and remove from `importedProfiles` state).

---

## Popover Positioning

- On button click, capture `element.getBoundingClientRect()`.
- Default: render popover below the button (`top = rect.bottom + 6`, `left = rect.left`).
- If `rect.bottom + popoverHeight > window.innerHeight`, flip to above (`top = rect.top - popoverHeight - 6`).
- If `rect.left + popoverWidth > window.innerWidth`, right-align (`left = rect.right - popoverWidth`).
- Clamp to viewport with a small margin.

---

## Files Changed

```
src/renderer/keybinds/src/
  components/
    EditPopup.tsx          ← new
    Btn.tsx                ← modified
    DeviceSection.tsx      ← modified
    CyborgThumb.tsx        ← modified
    CyroThumb.tsx          ← modified
  App.tsx                  ← modified
```

---

## Out of Scope

- Reset built-in profile to defaults
- Editing radial menu actions
- Adding new buttons (the grid layout is fixed by the physical device)
- Multi-button bulk editing
