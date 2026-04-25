import type { Layer, Zone } from '../data/types'
import { CYBORG_JOYSTICK, CYBORG_THUMB } from '../data/layout'

interface Props {
  layer: Layer
  activeZone: Zone | null
}

export default function CyborgThumb({ layer, activeZone }: Props) {
  const j = CYBORG_JOYSTICK

  function TBtn({ id, dir }: { id: string; dir: string }) {
    const btn = layer[id]
    if (!btn) return <div className="tbtn z-thumb"><span className="dir">{dir}</span><span className="label">—</span><span className="num">#{id}</span></div>
    const dimmed = activeZone !== null && activeZone !== btn.zone ? { opacity: 0.1 } : undefined
    return (
      <div className={`tbtn z-${btn.zone}`} style={dimmed}>
        <span className="dir">{dir}</span>
        <span className="label">{btn.label}</span>
        <span className="num">#{id}</span>
      </div>
    )
  }

  return (
    <div className="thumb-area">
      <div className="joystick">
        <div className="joystick-nub" />
        <span className="jl j-up">Push #{j.up}</span>
        <span className="jl j-down">Pull #{j.down}</span>
        <span className="jl j-left">Prev #{j.left}</span>
        <span className="jl j-right">Next #{j.right}</span>
      </div>
      <div className="thumb-btns" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {CYBORG_THUMB.flat().map(({ id, dir }) => (
          <TBtn key={id} id={id} dir={dir} />
        ))}
      </div>
    </div>
  )
}
