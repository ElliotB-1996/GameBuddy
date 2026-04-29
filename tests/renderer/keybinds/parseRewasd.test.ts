import { describe, it, expect } from 'vitest'
import { parseRewasd } from '@keybinds/importers/parseRewasd'
import { ParseError } from '@keybinds/importers/errors'

const FIXTURE = {
  config: { appName: 'Visual Studio Code' },
  mappings: [
    { description: 'Cyborg #1 - Toggle Terminal Ctrl+`' },
    { description: 'Cyborg #5 - Find Ctrl+F' },
    { description: 'Cyborg #9 - Format Document Shift+Alt+F' },
    { description: 'Cyborg #14 - Go to Definition F12' },
    { description: 'Cyro #1 - Some Action Ctrl+S' },
    { description: 'unrelated entry that should be skipped' },
  ],
}

const RADIAL_FIXTURE = {
  config: { appName: 'App' },
  radialMenuCircles: [{ id: 1, sectors: [10, 11, 12, 13] }],
  radialMenuSectors: [
    { id: 10, parentCircleId: 1 },
    { id: 11, parentCircleId: 1 },
    { id: 12, parentCircleId: 1 },
    { id: 13, parentCircleId: 1 },
  ],
  shifts: [{ id: 3, type: 'radialMenu' }],
  masks: [
    { id: 1, set: [{ deviceId: 1, buttonId: 1 }] },
    { id: 20, radialMenuSet: [{ circleId: 1, sectorId: 10 }] },
    { id: 21, radialMenuSet: [{ circleId: 1, sectorId: 11 }] },
    { id: 22, radialMenuSet: [{ circleId: 1, sectorId: 12 }] },
    { id: 23, radialMenuSet: [{ circleId: 1, sectorId: 13 }] },
  ],
  mappings: [
    { description: 'Cyborg #1 - Do Something Ctrl+X' },
    {
      description: 'Cyborg #7 - My Menu Trigger',
      condition: { mask: { id: 1 } },
      jumpToLayer: { layer: 3 },
    },
    { description: 'Alpha', condition: { shiftId: 3, mask: { id: 20 } } },
    { description: 'Beta',  condition: { shiftId: 3, mask: { id: 21 } } },
    { description: 'Gamma', condition: { shiftId: 3, mask: { id: 22 } } },
    { description: 'Delta', condition: { shiftId: 3, mask: { id: 23 } } },
  ],
}

describe('parseRewasd', () => {
  it('produces one Profile per device found', () => {
    expect(parseRewasd(FIXTURE)).toHaveLength(2)
  })
  it('uses config.appName as label on each profile', () => {
    const result = parseRewasd(FIXTURE)
    expect(result.every(p => p.label === 'Visual Studio Code')).toBe(true)
  })
  it('extracts key combo as bindings.single', () => {
    const cyborg = parseRewasd(FIXTURE).find(p => p.device === 'cyborg')!
    expect(cyborg.layers.default['1'].bindings.single).toBe('Ctrl+`')
  })
  it('extracts chord modifier as bindings.single', () => {
    const cyborg = parseRewasd(FIXTURE).find(p => p.device === 'cyborg')!
    expect(cyborg.layers.default['9'].bindings.single).toBe('Shift+Alt+F')
  })
  it('extracts function key as bindings.single', () => {
    const cyborg = parseRewasd(FIXTURE).find(p => p.device === 'cyborg')!
    expect(cyborg.layers.default['14'].bindings.single).toBe('F12')
  })
  it('extracts label without the trailing key combo', () => {
    const cyborg = parseRewasd(FIXTURE).find(p => p.device === 'cyborg')!
    expect(cyborg.layers.default['1'].label).toBe('Toggle Terminal')
  })
  it('skips mappings that do not match the expected description format', () => {
    const cyborg = parseRewasd(FIXTURE).find(p => p.device === 'cyborg')!
    expect(Object.keys(cyborg.layers.default)).toHaveLength(4)
  })
  it('sets zone to unzoned on all buttons', () => {
    const cyborg = parseRewasd(FIXTURE).find(p => p.device === 'cyborg')!
    expect(Object.values(cyborg.layers.default).every(b => b.zone === 'unzoned')).toBe(true)
  })
  it('sets platform to windows', () => {
    expect(parseRewasd(FIXTURE).every(p => p.platform === 'windows')).toBe(true)
  })
  it('sets type to rewasd', () => {
    expect(parseRewasd(FIXTURE).every(p => p.type === 'rewasd')).toBe(true)
  })
  it('sets imported to true', () => {
    expect(parseRewasd(FIXTURE).every(p => p.imported === true)).toBe(true)
  })
  it('throws ParseError when mappings is missing', () => {
    expect(() => parseRewasd({ config: { appName: 'X' } })).toThrow(ParseError)
  })
  it('throws ParseError on non-object input', () => {
    expect(() => parseRewasd('not an object')).toThrow(ParseError)
  })
})

describe('parseRewasd pairId', () => {
  it('all profiles from the same file share the same pairId', () => {
    const result = parseRewasd(FIXTURE)
    const ids = result.map(p => p.pairId)
    expect(ids[0]).toBeDefined()
    expect(ids.every(id => id === ids[0])).toBe(true)
  })

  it('pairId is included in each profile id', () => {
    const result = parseRewasd(FIXTURE)
    expect(result.every(p => p.id.startsWith(p.pairId!))).toBe(true)
  })
})

const MASK_FIXTURE = {
  config: { appName: 'World of Warcraft' },
  devices: {
    hardware: [
      { id: 1, name: 'gamepad' },
      { id: 2, name: 'gamepad' },
    ],
  },
  shifts: [{ id: 1, type: 'default' }],
  masks: [
    { id: 1, set: [{ deviceId: 1, buttonId: 1 }] },   // reWASD 1 → Azeron #1
    { id: 2, set: [{ deviceId: 1, buttonId: 5 }] },   // reWASD 5 → Azeron #2
    { id: 3, set: [{ deviceId: 2, buttonId: 20 }] },  // reWASD 20 → Cyro Azeron #1
  ],
  mappings: [
    {
      condition: { mask: { id: 1, activator: { type: 'single' } } },
      macros: [{ keyboard: { buttonId: 2, description: 'DIK_1' } }],
    },
    {
      description: 'Mounts',
      condition: { mask: { id: 2, activator: { type: 'single' } } },
      macros: [{ keyboard: { buttonId: 3, description: 'DIK_2' } }],
    },
    {
      condition: { mask: { id: 1, activator: { type: 'long' } } },
      macros: [{ keyboard: { buttonId: 11, description: 'DIK_0' } }],
    },
    {
      condition: { shiftId: 1, mask: { id: 1, activator: { type: 'single' } } },
      macros: [{ keyboard: { buttonId: 44, description: 'DIK_Z' } }],
    },
    {
      condition: { mask: { id: 3, activator: { type: 'single' } } },
      macros: [{ keyboard: { buttonId: 4, description: 'DIK_3' } }],
    },
  ],
}

describe('parseRewasd mask-based (WoW-style)', () => {
  it('produces one Profile per device from hardware + mask data', () => {
    expect(parseRewasd(MASK_FIXTURE)).toHaveLength(2)
  })

  it('assigns first hardware gamepad as cyborg, second as cyro', () => {
    const result = parseRewasd(MASK_FIXTURE)
    expect(result.find(p => p.device === 'cyborg')).toBeDefined()
    expect(result.find(p => p.device === 'cyro')).toBeDefined()
  })

  it('derives binding from macro keyboard description', () => {
    const cyborg = parseRewasd(MASK_FIXTURE).find(p => p.device === 'cyborg')!
    expect(cyborg.layers.default['1'].bindings.single).toBe('1')
  })

  it('uses mapping description as label when present', () => {
    const cyborg = parseRewasd(MASK_FIXTURE).find(p => p.device === 'cyborg')!
    expect(cyborg.layers.default['2'].label).toBe('Mounts')
  })

  it('maps long activator to bindings.long', () => {
    const cyborg = parseRewasd(MASK_FIXTURE).find(p => p.device === 'cyborg')!
    expect(cyborg.layers.default['1'].bindings.long).toBe('0')
  })

  it('populates layers.shift from non-radialMenu shiftId mappings', () => {
    const cyborg = parseRewasd(MASK_FIXTURE).find(p => p.device === 'cyborg')!
    expect(cyborg.layers.shift?.['1'].bindings.single).toBe('Z')
  })

  it('parses cyro buttons from second hardware device', () => {
    const cyro = parseRewasd(MASK_FIXTURE).find(p => p.device === 'cyro')!
    expect(cyro.layers.default['1'].bindings.single).toBe('3')
  })

  it('maps mouse buttonId 1 to LClick', () => {
    const fixture = {
      ...MASK_FIXTURE,
      mappings: [{
        condition: { mask: { id: 1, activator: { type: 'single' } } },
        macros: [{ mouse: { buttonId: 1 } }],
      }],
    }
    const cyborg = parseRewasd(fixture).find(p => p.device === 'cyborg')!
    expect(cyborg.layers.default['1'].bindings.single).toBe('LClick')
  })

  it('maps mouse buttonId 2 to RClick', () => {
    const fixture = {
      ...MASK_FIXTURE,
      mappings: [{
        condition: { mask: { id: 1, activator: { type: 'single' } } },
        macros: [{ mouse: { buttonId: 2 } }],
      }],
    }
    const cyborg = parseRewasd(fixture).find(p => p.device === 'cyborg')!
    expect(cyborg.layers.default['1'].bindings.single).toBe('RClick')
  })

  it('converts DIK modifier + key into Ctrl+x style binding', () => {
    const fixture = {
      ...MASK_FIXTURE,
      mappings: [{
        condition: { mask: { id: 1, activator: { type: 'single' } } },
        macros: [
          { keyboard: { buttonId: 29, description: 'DIK_LCONTROL' } },
          { keyboard: { buttonId: 33, description: 'DIK_F' } },
        ],
      }],
    }
    const cyborg = parseRewasd(fixture).find(p => p.device === 'cyborg')!
    expect(cyborg.layers.default['1'].bindings.single).toBe('Ctrl+F')
  })
})

describe('CYRO_BTN coverage — previously unmapped buttons', () => {
  const fixture = {
    config: { appName: 'Test' },
    devices: { hardware: [{ id: 1, name: 'gamepad' }, { id: 2, name: 'gamepad' }] },
    masks: [
      { id: 1, set: [{ deviceId: 2, buttonId: 14 }] },
      { id: 2, set: [{ deviceId: 2, buttonId: 6 }] },
      { id: 3, set: [{ deviceId: 2, buttonId: 5 }] },
      { id: 4, set: [{ deviceId: 2, buttonId: 2 }] },
      { id: 5, set: [{ deviceId: 2, buttonId: 1 }] },
    ],
    mappings: [
      { condition: { mask: { id: 1 } }, macros: [{ keyboard: { buttonId: 0, description: 'DIK_A' } }] },
      { condition: { mask: { id: 2 } }, macros: [{ keyboard: { buttonId: 0, description: 'DIK_B' } }] },
      { condition: { mask: { id: 3 } }, macros: [{ keyboard: { buttonId: 0, description: 'DIK_C' } }] },
      { condition: { mask: { id: 4 } }, macros: [{ keyboard: { buttonId: 0, description: 'DIK_D' } }] },
      { condition: { mask: { id: 5 } }, macros: [{ keyboard: { buttonId: 0, description: 'DIK_E' } }] },
    ],
  }

  it('maps reWASD buttonId 14 → Azeron "7"', () => {
    const cyro = parseRewasd(fixture).find(p => p.device === 'cyro')!
    expect(cyro.layers.default['7']).toBeDefined()
  })
  it('maps reWASD buttonId 6 → Azeron "11"', () => {
    const cyro = parseRewasd(fixture).find(p => p.device === 'cyro')!
    expect(cyro.layers.default['11']).toBeDefined()
  })
  it('maps reWASD buttonId 5 → Azeron "12"', () => {
    const cyro = parseRewasd(fixture).find(p => p.device === 'cyro')!
    expect(cyro.layers.default['12']).toBeDefined()
  })
  it('maps reWASD buttonId 2 → Azeron "16"', () => {
    const cyro = parseRewasd(fixture).find(p => p.device === 'cyro')!
    expect(cyro.layers.default['16']).toBeDefined()
  })
  it('maps reWASD buttonId 1 → Azeron "17"', () => {
    const cyro = parseRewasd(fixture).find(p => p.device === 'cyro')!
    expect(cyro.layers.default['17']).toBeDefined()
  })
})

const MULTI_SHIFT_FIXTURE = {
  config: { appName: 'Minecraft' },
  devices: { hardware: [{ id: 1, name: 'gamepad' }, { id: 2, name: 'gamepad' }] },
  shifts: [
    { id: 1, type: 'default' },
    { id: 2, type: 'default', description: 'Letters A-F' },
    { id: 3, type: 'default', description: 'Letters G-L' },
  ],
  masks: [
    { id: 1, set: [{ deviceId: 1, buttonId: 1 }] },
    { id: 2, set: [{ deviceId: 1, buttonId: 5 }] },
  ],
  mappings: [
    { condition: { mask: { id: 1, activator: { type: 'single' } } }, macros: [{ keyboard: { buttonId: 2, description: 'DIK_1' } }] },
    { condition: { shiftId: 1, mask: { id: 1, activator: { type: 'single' } } }, macros: [{ keyboard: { buttonId: 30, description: 'DIK_A' } }] },
    { condition: { shiftId: 2, mask: { id: 2, activator: { type: 'single' } } }, macros: [{ keyboard: { buttonId: 48, description: 'DIK_B' } }] },
    { condition: { shiftId: 3, mask: { id: 1, activator: { type: 'single' } } }, macros: [{ keyboard: { buttonId: 34, description: 'DIK_G' } }] },
  ],
}

describe('parseRewasd multi-shift layers', () => {
  it('creates a separate layer for each distinct shiftId', () => {
    const cyborg = parseRewasd(MULTI_SHIFT_FIXTURE).find(p => p.device === 'cyborg')!
    expect(Object.keys(cyborg.layers)).toEqual(['default', 'shift', 'shift-2', 'shift-3'])
  })

  it('populates each shift layer independently', () => {
    const cyborg = parseRewasd(MULTI_SHIFT_FIXTURE).find(p => p.device === 'cyborg')!
    expect(cyborg.layers['shift']?.['1'].bindings.single).toBe('A')
    expect(cyborg.layers['shift-3']?.['1'].bindings.single).toBe('G')
  })

  it('stores shift descriptions in layerLabels keyed by layer key', () => {
    const cyborg = parseRewasd(MULTI_SHIFT_FIXTURE).find(p => p.device === 'cyborg')!
    expect(cyborg.layerLabels?.['shift-2']).toBe('Letters A-F')
    expect(cyborg.layerLabels?.['shift-3']).toBe('Letters G-L')
  })

  it('omits layerLabels when no shift has a description', () => {
    const fixture = { ...MULTI_SHIFT_FIXTURE, shifts: [{ id: 1, type: 'default' }] }
    const cyborg = parseRewasd(fixture).find(p => p.device === 'cyborg')!
    expect(cyborg.layerLabels).toBeUndefined()
  })

  it('maps layer-switch triggers as buttons with "→ LayerName" binding', () => {
    const fixture = {
      config: { appName: 'Test' },
      devices: { hardware: [{ id: 1, name: 'gamepad' }] },
      shifts: [
        { id: 1, type: 'default' },
        { id: 2, type: 'default', description: 'Letters A-F' },
      ],
      masks: [{ id: 1, set: [{ deviceId: 1, buttonId: 1 }] }],
      mappings: [
        // default layer: hold button 1 to jump to shift 2
        { condition: { mask: { id: 1, activator: { type: 'single' } } }, jumpToLayer: { layer: 2 } },
      ],
    }
    const cyborg = parseRewasd(fixture).find(p => p.device === 'cyborg')!
    expect(cyborg.layers.default['1'].bindings.single).toBe('→ Letters A-F')
  })

  it('maps jumpToLayer 0 as "→ Default"', () => {
    const fixture = {
      config: { appName: 'Test' },
      devices: { hardware: [{ id: 1, name: 'gamepad' }] },
      shifts: [{ id: 1, type: 'default' }],
      masks: [{ id: 1, set: [{ deviceId: 1, buttonId: 1 }] }],
      mappings: [
        { condition: { shiftId: 1, mask: { id: 1, activator: { type: 'single' } } }, jumpToLayer: { layer: 0 } },
      ],
    }
    const cyborg = parseRewasd(fixture).find(p => p.device === 'cyborg')!
    expect(cyborg.layers['shift']?.['1'].bindings.single).toBe('→ Default')
  })

  it('skips radial-menu jumpToLayer triggers in button grid', () => {
    const fixture = {
      ...RADIAL_FIXTURE,
      masks: [
        ...RADIAL_FIXTURE.masks,
        { id: 10, set: [{ deviceId: 1, buttonId: 2 }] },
      ],
      mappings: [
        ...RADIAL_FIXTURE.mappings,
        // this jumps to the radial shift (id 3) — should not appear as a button
        { condition: { mask: { id: 10, activator: { type: 'single' } } }, jumpToLayer: { layer: 3 } },
      ],
    }
    const profile = parseRewasd(fixture)[0]
    // button #5 (Azeron mapping for reWASD buttonId 2) should NOT exist in default layer
    expect(profile.layers.default?.['5']).toBeUndefined()
  })
})

describe('parseRewasd radial menus', () => {
  it('parses radial menus from circle/sector/shift data', () => {
    const menus = parseRewasd(RADIAL_FIXTURE)[0].radialMenus
    expect(menus).toHaveLength(1)
  })

  it('strips Trigger suffix from menu label', () => {
    const menus = parseRewasd(RADIAL_FIXTURE)[0].radialMenus!
    expect(menus[0].label).toBe('My Menu')
  })

  it('sets trigger to the hardware button number', () => {
    const menus = parseRewasd(RADIAL_FIXTURE)[0].radialMenus!
    expect(menus[0].trigger).toBe('7')
  })

  it('assigns directions to actions in order ↑→↓← for 4-sector circles', () => {
    const actions = parseRewasd(RADIAL_FIXTURE)[0].radialMenus![0].actions
    expect(actions).toHaveLength(4)
    expect(actions[0]).toMatchObject({ label: 'Alpha', direction: '↑' })
    expect(actions[1]).toMatchObject({ label: 'Beta',  direction: '→' })
    expect(actions[2]).toMatchObject({ label: 'Gamma', direction: '↓' })
    expect(actions[3]).toMatchObject({ label: 'Delta', direction: '←' })
  })

  it('returns empty radialMenus when no circles are present', () => {
    const menus = parseRewasd(FIXTURE)[0].radialMenus
    expect(menus).toHaveLength(0)
  })
})

describe('parseRewasd hardware condition', () => {
  const HW_FIXTURE = {
    config: { appName: 'App' },
    devices: {
      hardware: [
        { id: 1, name: 'gamepad' },
        { id: 21, name: 'keyboard', type: 'standard' },
        { id: 33, name: 'mouse' },
      ],
    },
    mappings: [
      {
        description: 'Ctrl+Z',
        condition: { hardware: { deviceId: 1, buttonId: 1 } },
        macros: [
          { keyboard: { buttonId: 29, description: 'DIK_LCONTROL' } },
          { keyboard: { buttonId: 44, description: 'DIK_Z' } },
        ],
      },
      {
        description: 'A',
        condition: { hardware: { deviceId: 1, buttonId: 5 } },
        macros: [{ keyboard: { buttonId: 30, description: 'DIK_A' } }],
      },
    ],
  }

  it('maps hardware-condition bindings to the correct button', () => {
    const profile = parseRewasd(HW_FIXTURE).find(p => p.device === 'cyborg')!
    expect(profile.layers.default['1']?.bindings.single).toBe('Ctrl+Z')
    expect(profile.layers.default['2']?.bindings.single).toBe('A')
  })
})
