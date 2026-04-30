# Combo Mask Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Emit `Profile.combos` as multi-entry reWASD masks and mappings when generating a `.rewasd` file, so chord bindings survive the export.

**Architecture:** A single new loop added to `generateRewasd` after the existing per-profile button-mapping loop (line 524). For each combo, it creates one mask with `set.length > 1` and emits mappings for each populated activator type — following the exact same pattern as the regular button loop.

**Tech Stack:** TypeScript, Vitest

---

## File Map

| File | Action |
|------|--------|
| `src/renderer/keybinds/src/exporters/generateRewasd.ts` | Add combo loop (~35 lines) after line 524 |
| `tests/renderer/keybinds/generateRewasd.test.ts` | Append new `describe` block + one round-trip test |

---

### Task 1: Write failing tests

**Files:**
- Modify: `tests/renderer/keybinds/generateRewasd.test.ts` (append after line 661)

- [ ] **Step 1: Append the combo describe block to the test file**

Add this entire block at the very end of `tests/renderer/keybinds/generateRewasd.test.ts`, after the closing `});` of the `round-trip` describe block:

```typescript
describe("generateRewasd — combos", () => {
  const withCombo: Profile = {
    id: "combo-cyborg",
    label: "ComboApp",
    platform: "windows",
    type: "rewasd",
    device: "cyborg",
    layers: { default: {} },
    combos: [
      {
        buttons: ["1", "2"],
        zone: "unzoned",
        label: "ChordAB",
        bindings: { single: "A" },
        layer: "default",
      },
    ],
  };

  it("emits a multi-entry mask for a 2-button combo", () => {
    const file = generateRewasd([withCombo]);
    const comboMask = file.masks?.find((m) => m.set && m.set.length === 2);
    expect(comboMask).toBeDefined();
    expect(comboMask?.set?.[0]).toEqual({ deviceId: 1, buttonId: 1 });
    expect(comboMask?.set?.[1]).toEqual({ deviceId: 1, buttonId: 5 });
  });

  it("emits a mapping referencing the combo mask id", () => {
    const file = generateRewasd([withCombo]);
    const comboMask = file.masks?.find((m) => m.set && m.set.length === 2);
    const mapping = file.mappings.find((m) => m.description === "ChordAB");
    expect(mapping).toBeDefined();
    expect((mapping as any).condition.mask.id).toBe(comboMask?.id);
    expect(mapping?.macros?.[0].keyboard?.description).toBe("DIK_A");
  });

  it("shifted combo carries shiftId on the condition", () => {
    const withShiftedCombo: Profile = {
      id: "combo-shift",
      label: "ComboShiftApp",
      platform: "windows",
      type: "rewasd",
      device: "cyborg",
      layerLabels: { shift: "Fn" },
      layers: { default: {}, shift: {} },
      combos: [
        {
          buttons: ["1", "2"],
          zone: "unzoned",
          label: "ShiftedChord",
          bindings: { single: "B" },
          layer: "shift",
        },
      ],
    };
    const file = generateRewasd([withShiftedCombo]);
    const shiftId = file.shifts?.[0].id!;
    const mapping = file.mappings.find((m) => m.description === "ShiftedChord");
    expect((mapping as any).condition.shiftId).toBe(shiftId);
  });

  it("skips a combo where fewer than 2 buttons map to the device table", () => {
    const withBadCombo: Profile = {
      id: "combo-degenerate",
      label: "DegenerateApp",
      platform: "windows",
      type: "rewasd",
      device: "cyborg",
      layers: { default: {} },
      combos: [
        {
          buttons: ["1", "99"],
          zone: "unzoned",
          label: "BadCombo",
          bindings: { single: "A" },
          layer: "default",
        },
      ],
    };
    const file = generateRewasd([withBadCombo]);
    expect(file.masks).toBeUndefined();
    expect(file.mappings.find((m) => m.description === "BadCombo")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Append the round-trip test for combos**

Inside the existing `describe("round-trip: generateRewasd → parseRewasd", ...)` block, add this `it` block before the final closing `});` of that describe (currently around line 661):

```typescript
  it("combo chord binding survives round-trip", () => {
    const profile: Profile = {
      id: "rt-combo",
      label: "RTCombo",
      platform: "windows",
      type: "rewasd",
      device: "cyborg",
      layers: {
        default: {
          "3": { zone: "unzoned", label: "Anchor", bindings: { single: "Z" } },
        },
      },
      combos: [
        {
          buttons: ["1", "2"],
          zone: "unzoned",
          label: "ChordAB",
          bindings: { single: "A" },
          layer: "default",
        },
      ],
    };
    const reparsed = parseRewasd(generateRewasd([profile]));
    const cyborg = reparsed.find((p) => p.device === "cyborg")!;
    expect(cyborg.combos).toHaveLength(1);
    expect(cyborg.combos?.[0].buttons).toContain("1");
    expect(cyborg.combos?.[0].buttons).toContain("2");
    expect(cyborg.combos?.[0].bindings.single).toBe("A");
  });
```

---

### Task 2: Run tests — verify they fail

**Files:** (none changed)

- [ ] **Step 1: Run the exporter test file**

```
npx vitest run tests/renderer/keybinds/generateRewasd.test.ts
```

Expected: The 5 new tests fail. All pre-existing tests still pass. Typical failure message will be something like `AssertionError: expected undefined to be defined` for the mask/mapping assertions.

---

### Task 3: Implement the combo loop

**Files:**
- Modify: `src/renderer/keybinds/src/exporters/generateRewasd.ts`

- [ ] **Step 1: Insert the combo loop**

In `generateRewasd.ts`, locate the closing `}` of the per-profile button-mapping loop at line 524 (it is the closing brace of `for (const p of profiles) { ... }` that ends with the innermost activator loop). Insert the following block immediately after that closing brace, before the radial-menu section that begins with `const radialMenuCircles`:

```typescript
  for (const p of profiles) {
    if (!p.combos || p.combos.length === 0) continue;
    const deviceId = p.device === "cyborg" ? 1 : 2;
    const btnInv = p.device === "cyborg" ? CYBORG_BTN_INV : CYRO_BTN_INV;

    for (const combo of p.combos) {
      const mappedIds = combo.buttons
        .map((b) => btnInv[b])
        .filter((id): id is number => id !== undefined);
      if (mappedIds.length < 2) continue;

      const maskId = nextMaskId++;
      masks.push({
        id: maskId,
        set: mappedIds.map((buttonId) => ({ deviceId, buttonId })),
      });

      const shiftId =
        combo.layer !== "default"
          ? layerKeyToShiftId.get(combo.layer)
          : undefined;

      for (const activatorType of BINDING_ACTIVATORS) {
        const binding = combo.bindings[activatorType];
        if (!binding) continue;

        const condition: RewasdConditionMask = {
          ...(shiftId !== undefined ? { shiftId } : {}),
          mask: { id: maskId, activator: activatorToRewasd(activatorType) },
        };

        if (binding.startsWith("→ ")) {
          const targetLayer = resolveLayerTarget(binding);
          if (targetLayer !== undefined) {
            mappings.push({
              description: combo.label,
              condition,
              jumpToLayer: { layer: targetLayer },
            });
          }
        } else {
          const macros = bindingToMacros(binding);
          if (macros.length > 0) {
            mappings.push({
              description: combo.label,
              condition,
              macros,
            });
          }
        }
      }
    }
  }
```

---

### Task 4: Run tests — verify they pass

**Files:** (none changed)

- [ ] **Step 1: Run the exporter test file**

```
npx vitest run tests/renderer/keybinds/generateRewasd.test.ts
```

Expected: All tests pass, including the 5 new combo tests.

---

### Task 5: Lint and typecheck

**Files:** (none changed)

- [ ] **Step 1: Run lint**

```
npm run lint
```

Expected: No warnings or errors.

- [ ] **Step 2: Run renderer typecheck**

```
npm run typecheck:web
```

Expected: No type errors.

---

### Task 6: Commit

- [ ] **Step 1: Stage and commit**

```
git add src/renderer/keybinds/src/exporters/generateRewasd.ts tests/renderer/keybinds/generateRewasd.test.ts
git commit -m "feat: export combo masks in generateRewasd"
```
