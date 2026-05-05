import React, { useState, useRef } from 'react'
import { useEditor, useValue } from 'tldraw'
import { CARD_COLORS, THEMES } from '../shapes/CardShape'

const SWATCH = 28
const GAP    = 4
const COLS   = 4
const PAD    = 10

export function CardColorPicker() {
  const editor = useEditor()

  // Panel position — default: left side (TLDraw's style panel occupies the right side)
  const [pos, setPos]           = useState(() => ({ x: 12, y: 120 }))
  const [collapsed, setCollapsed] = useState(false)

  // Hide when the hand/pan tool is active (H key in TLDraw hides the UI chrome)
  const isHandTool = useValue('hand-tool', () => editor.getCurrentToolId() === 'hand', [editor])

  // Track selected card — also keep a ref so swatch handlers read the pre-click value
  const selectedId = useValue('sel-card', () => {
    const ids = editor.getSelectedShapeIds()
    if (ids.length !== 1) return null
    const s = editor.getShape(ids[0])
    return (s as any)?.type === 'card' ? ids[0] : null
  }, [editor])

  // Ref always holds the latest selectedId so swatches can read it even if TLDraw
  // deselects the shape during the same pointer-event chain
  const selectedIdRef = useRef<string | null>(null)
  selectedIdRef.current = selectedId

  const currentKey = useValue('cur-color-key', () => {
    if (!selectedId) return ''
    return (editor.getShape(selectedId) as any)?.props?.colorKey ?? ''
  }, [editor, selectedId])

  // ── Drag ──────────────────────────────────────────────────────
  const onHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('[data-collapse]')) return
    e.preventDefault()
    e.stopPropagation()
    const origX = pos.x, origY = pos.y
    const startX = e.clientX, startY = e.clientY
    const onMove = (ev: PointerEvent) => {
      setPos({ x: origX + ev.clientX - startX, y: origY + ev.clientY - startY })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
  }

  // ── Styles ────────────────────────────────────────────────────
  const panelW = COLS * (SWATCH + GAP) - GAP + PAD * 2

  const panelStyle: React.CSSProperties = {
    position:    'absolute',
    left:        pos.x,
    top:         pos.y,
    width:       panelW,
    background:  '#0d1520',
    border:      '1px solid rgba(255,255,255,.14)',
    borderRadius: 10,
    boxShadow:   '0 12px 40px rgba(0,0,0,.7)',
    pointerEvents: 'all',
    userSelect:  'none',
    zIndex:      300000,
    overflow:    'hidden',
  }

  const headerStyle: React.CSSProperties = {
    display:       'flex',
    alignItems:    'center',
    justifyContent: 'space-between',
    padding:       '7px 10px',
    cursor:        'grab',
    background:    '#111d2e',
    borderBottom:  collapsed ? 'none' : '1px solid rgba(255,255,255,.08)',
  }

  return isHandTool ? null : (
    <div style={panelStyle} onPointerDown={e => {
      e.stopPropagation()
      e.nativeEvent.stopImmediatePropagation()
    }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={headerStyle} onPointerDown={onHeaderPointerDown}>
        <span style={{ fontSize: 11, fontFamily: '"IBM Plex Sans",sans-serif', color: '#90a4ae', letterSpacing: '0.08em' }}>
          🎨 CARD COLOUR
        </span>
        <button
          data-collapse
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#78909c', fontSize: 14, lineHeight: 1, padding: '0 2px',
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '＋' : '－'}
        </button>
      </div>

      {/* ── Swatch grid ────────────────────────────────── */}
      {!collapsed && (
        <div style={{ padding: PAD }}>
          {/* Hint when no card selected */}
          {!selectedId && (
            <div style={{
              fontSize: 10, fontFamily: '"IBM Plex Sans",sans-serif',
              color: '#546e7a', textAlign: 'center', marginBottom: 8,
            }}>
              Select a card to apply
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${SWATCH}px)`,
            gap: GAP,
          }}>
            {CARD_COLORS.map(key => {
              const theme   = THEMES[key]
              const isActive = currentKey === key
              return (
                <div
                  key={key}
                  title={key}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.nativeEvent.stopImmediatePropagation()
                    const id = selectedIdRef.current as any
                    if (!id) return
                    editor.updateShape<any>({ id, type: 'card', props: { colorKey: key } })
                  }}
                  style={{
                    width:    SWATCH,
                    height:   SWATCH,
                    borderRadius: 5,
                    background: theme.bg,
                    border: isActive
                      ? `2px solid ${theme.accent}`
                      : `1px solid ${theme.accent}55`,
                    cursor:   selectedId ? 'pointer' : 'default',
                    opacity:  selectedId ? 1 : 0.45,
                    position: 'relative',
                    overflow: 'hidden',
                    outline:  isActive ? `2px solid ${theme.accent}55` : 'none',
                    outlineOffset: 1,
                    transition: 'opacity .15s, border .1s',
                  }}
                >
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: 7, background: theme.accent,
                  }} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
