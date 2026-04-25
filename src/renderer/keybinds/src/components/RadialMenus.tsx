import { useState } from 'react'
import type { RadialMenu, RadialAction } from '../data/types'

function ActionLeaf({ action }: { action: RadialAction }) {
  const [open, setOpen] = useState(false)

  if (action.submenu) {
    return (
      <li>
        <div className="rrow" onClick={() => setOpen(o => !o)}>
          <span className={`arrow ${open ? 'open' : ''}`}>▶</span>
          <span className="rdot" style={{ background: action.submenu.color }} />
          {action.label}
          <span className="rkey">{action.direction}</span>
        </div>
        {open && (
          <ul className="rchildren rtree">
            {action.submenu.actions.map(a => (
              <ActionLeaf key={a.direction} action={a} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <li>
      <div className="rleaf">
        <span className="rdot" />
        {action.label}
        <span className="rkey">{action.direction}</span>
      </div>
    </li>
  )
}

function MenuTree({ menu }: { menu: RadialMenu }) {
  const [open, setOpen] = useState(true)

  return (
    <li>
      <div className={`rrow ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className={`arrow ${open ? 'open' : ''}`}>▶</span>
        <span className="rdot" style={{ background: menu.color }} />
        {menu.label}
        <span className="rkey">Hold #{menu.trigger}</span>
      </div>
      {open && (
        <ul className="rchildren rtree">
          {menu.actions.map(a => (
            <ActionLeaf key={a.direction} action={a} />
          ))}
        </ul>
      )}
    </li>
  )
}

interface Props {
  menus: RadialMenu[]
}

export default function RadialMenus({ menus }: Props) {
  return (
    <div className="panel">
      <div className="panel-title">Radial Menus</div>
      {menus.length === 0
        ? <p style={{ fontSize: 11, color: '#6b7280' }}>No radial menus defined for this profile.</p>
        : (
          <ul className="rtree">
            {menus.map(m => <MenuTree key={m.id} menu={m} />)}
          </ul>
        )
      }
    </div>
  )
}
