import { DefaultColorStyle, Rectangle2d, ShapeUtil, T, resizeBox, useEditor, useIsEditing } from 'tldraw'

// ── Theme type ────────────────────────────────────────────────────
export interface CardTheme { accent: string; bg: string; badgeBg: string; titleColor: string }

// ── 32 themes — 4 cols × 8 rows in the picker ────────────────────
export const THEMES: Record<string, CardTheme> = {
  // Row 1 — Blues
  navy:       { accent: '#1e88e5', bg: '#010d1a', badgeBg: 'rgba(30,136,229,.20)',   titleColor: '#64b5f6' },
  ocean:      { accent: '#2979ff', bg: '#00071a', badgeBg: 'rgba(41,121,255,.18)',   titleColor: '#82b1ff' },
  sky:        { accent: '#29b6f6', bg: '#001828', badgeBg: 'rgba(41,182,246,.15)',   titleColor: '#81d4fa' },
  ice:        { accent: '#80deea', bg: '#001520', badgeBg: 'rgba(128,222,234,.10)',  titleColor: '#e0f7fa' },
  // Row 2 — Greens
  forest:     { accent: '#43a047', bg: '#011205', badgeBg: 'rgba(67,160,71,.18)',    titleColor: '#81c784' },
  emerald:    { accent: '#00e676', bg: '#001a0a', badgeBg: 'rgba(0,230,118,.15)',    titleColor: '#69f0ae' },
  mint:       { accent: '#1de9b6', bg: '#001a12', badgeBg: 'rgba(29,233,182,.15)',   titleColor: '#64ffda' },
  lime:       { accent: '#b2ff59', bg: '#0e1800', badgeBg: 'rgba(178,255,89,.12)',   titleColor: '#ccff90' },
  // Row 3 — Teals & Cyans
  teal:       { accent: '#00bcd4', bg: '#001820', badgeBg: 'rgba(0,188,212,.15)',    titleColor: '#4dd0e1' },
  cyan:       { accent: '#00e5ff', bg: '#001520', badgeBg: 'rgba(0,229,255,.15)',    titleColor: '#84ffff' },
  seafoam:    { accent: '#26a69a', bg: '#011614', badgeBg: 'rgba(38,166,154,.15)',   titleColor: '#80cbc4' },
  jade:       { accent: '#00897b', bg: '#011412', badgeBg: 'rgba(0,137,123,.18)',    titleColor: '#4db6ac' },
  // Row 4 — Reds
  maroon:     { accent: '#e53935', bg: '#120001', badgeBg: 'rgba(229,57,53,.18)',    titleColor: '#ef9a9a' },
  crimson:    { accent: '#ff1744', bg: '#1a0005', badgeBg: 'rgba(255,23,68,.18)',    titleColor: '#ff8a80' },
  scarlet:    { accent: '#ff5252', bg: '#180303', badgeBg: 'rgba(255,82,82,.15)',    titleColor: '#ffab91' },
  coral:      { accent: '#ff6d00', bg: '#1a0800', badgeBg: 'rgba(255,109,0,.18)',    titleColor: '#ffab40' },
  // Row 5 — Warm
  amber:      { accent: '#ffa726', bg: '#1a0e00', badgeBg: 'rgba(255,167,38,.15)',   titleColor: '#ffcc80' },
  gold:       { accent: '#ffd600', bg: '#1a1200', badgeBg: 'rgba(255,214,0,.15)',    titleColor: '#ffe57f' },
  honey:      { accent: '#ff8f00', bg: '#160a00', badgeBg: 'rgba(255,143,0,.15)',    titleColor: '#ffca28' },
  cream:      { accent: '#fff9c4', bg: '#16140a', badgeBg: 'rgba(255,249,196,.08)',  titleColor: '#fff59d' },
  // Row 6 — Purples
  indigo:     { accent: '#5c6bc0', bg: '#05051a', badgeBg: 'rgba(92,107,192,.18)',   titleColor: '#9fa8da' },
  violet:     { accent: '#7c4dff', bg: '#0c0520', badgeBg: 'rgba(124,77,255,.18)',   titleColor: '#b388ff' },
  orchid:     { accent: '#ab47bc', bg: '#100518', badgeBg: 'rgba(171,71,188,.15)',   titleColor: '#ce93d8' },
  lavender:   { accent: '#e040fb', bg: '#180520', badgeBg: 'rgba(224,64,251,.15)',   titleColor: '#ea80fc' },
  // Row 7 — Pinks
  magenta:    { accent: '#f50057', bg: '#1a0010', badgeBg: 'rgba(245,0,87,.18)',     titleColor: '#ff80ab' },
  hotpink:    { accent: '#ff4081', bg: '#180010', badgeBg: 'rgba(255,64,129,.15)',   titleColor: '#ff80ab' },
  rose:       { accent: '#f48fb1', bg: '#180a12', badgeBg: 'rgba(244,143,177,.12)',  titleColor: '#fce4ec' },
  blush:      { accent: '#ffcdd2', bg: '#160810', badgeBg: 'rgba(255,205,210,.08)',  titleColor: '#ffebee' },
  // Row 8 — Neutrals
  charcoal:   { accent: '#546e7a', bg: '#0a0d10', badgeBg: 'rgba(84,110,122,.15)',   titleColor: '#90a4ae' },
  steel:      { accent: '#78909c', bg: '#080e18', badgeBg: 'rgba(120,144,156,.15)',  titleColor: '#b0bec5' },
  slate:      { accent: '#90a4ae', bg: '#0c1018', badgeBg: 'rgba(144,164,174,.12)',  titleColor: '#cfd8dc' },
  moonstone:  { accent: '#eeeeee', bg: '#141420', badgeBg: 'rgba(238,238,238,.10)',  titleColor: '#f5f5f5' },
}

// Ordered for the 4×8 picker grid (left→right, top→bottom)
export const CARD_COLORS = [
  'navy',    'ocean',   'sky',      'ice',
  'forest',  'emerald', 'mint',     'lime',
  'teal',    'cyan',    'seafoam',  'jade',
  'maroon',  'crimson', 'scarlet',  'coral',
  'amber',   'gold',    'honey',    'cream',
  'indigo',  'violet',  'orchid',   'lavender',
  'magenta', 'hotpink', 'rose',     'blush',
  'charcoal','steel',   'slate',    'moonstone',
] as const

// Fallback map for cards that still use TLDraw's DefaultColorStyle values
const COLOR_MAP: Record<string, string> = {
  'blue':         'ocean',
  'light-blue':   'sky',
  'green':        'emerald',
  'light-green':  'mint',
  'red':          'crimson',
  'light-red':    'coral',
  'orange':       'amber',
  'yellow':       'gold',
  'violet':       'violet',
  'light-violet': 'lavender',
  'grey':         'steel',
  'black':        'charcoal',
  'white':        'moonstone',
}

// ── Shape props ──────────────────────────────────────────────────
export interface ICardProps {
  w: number; h: number; badge: string; title: string
  body: string; footer: string; url: string
  color: string; colorKey?: string
}

// ── Shape util ───────────────────────────────────────────────────
export class CardShapeUtil extends ShapeUtil<any> {
  static override type = 'card' as const

  static override props = {
    w: T.positiveNumber,
    h: T.positiveNumber,
    badge: T.string,
    title: T.string,
    body: T.string,
    footer: T.string,
    url: T.string,
    color: DefaultColorStyle,
    colorKey: T.string.optional(), // extended 32-colour key; overrides DefaultColorStyle when set
  }

  canResize() { return true }

  onResize(shape: any, info: any) {
    const result = resizeBox(shape, info)
    const p = (result as any).props
    if (p) {
      p.w = Math.max(220, p.w)
      p.h = Math.max(120, p.h)
    }
    return result
  }

  canEdit() { return true }

  getDefaultProps(): ICardProps {
    return { w: 300, h: 200, badge: 'Card', title: 'New Card', body: '', footer: '', url: '', color: 'blue', colorKey: '' }
  }

  getGeometry(shape: any) {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
  }

  component(shape: any) {
    const isEditing = useIsEditing(shape.id)
    const editor = useEditor()
    const { badge, title, body, footer, url, color, colorKey, w, h } = shape.props
    const themeKey = colorKey || COLOR_MAP[color] || 'ocean'
    const t = THEMES[themeKey] ?? THEMES.ocean

    // Immediately persist a field to the shape store on every change
    const update = (field: string) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      editor.updateShape<any>({ id: shape.id, type: 'card', props: { [field]: e.target.value } })
    }

    // Block TLDraw from intercepting keystrokes while typing (let Escape fall through to exit edit mode)
    const stopKeys = (e: React.KeyboardEvent) => {
      if (e.key !== 'Escape') e.stopPropagation()
    }

    const cardBase: React.CSSProperties = {
      position: 'absolute',
      width: w, height: h,
      background: t.bg,
      border: `2px solid ${t.accent}`,
      borderRadius: 12,
      padding: '13px 15px',
      overflow: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }

    // ── Edit mode ────────────────────────────────────────────────
    if (isEditing) {
      const fieldBase: React.CSSProperties = {
        background: 'transparent',
        border: `1px solid ${t.accent}55`,
        borderRadius: 4,
        outline: 'none',
        resize: 'none',
        width: '100%',
        padding: '4px 8px',
        boxSizing: 'border-box',
      }
      // Edit overlay grows downward beyond the card's fixed height so all fields are visible.
      // TLDraw intercepts scroll events so we can't rely on overflow:auto inside the card.
      const editOverlay: React.CSSProperties = {
        ...cardBase,
        height: 'auto',
        minHeight: h,
        overflow: 'visible',
        gap: 6,
        pointerEvents: 'all',
        zIndex: 9999,
      }
      return (
        <div style={editOverlay}>

          {/* Badge input */}
          <input
            defaultValue={badge}
            onChange={update('badge')}
            onKeyDown={stopKeys}
            placeholder="Badge label"
            style={{
              ...fieldBase,
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontStyle: 'italic',
              fontSize: 9.5,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              background: t.badgeBg,
              color: t.accent,
            }}
          />

          {/* Title textarea */}
          <textarea
            defaultValue={title}
            onChange={update('title')}
            onKeyDown={stopKeys}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            placeholder="Card title"
            rows={2}
            style={{
              ...fieldBase,
              fontFamily: '"Caveat", cursive',
              fontWeight: 700,
              fontSize: 20,
              lineHeight: 1.25,
              color: t.titleColor,
            }}
          />

          {/* Body textarea */}
          <textarea
            defaultValue={body}
            onChange={update('body')}
            onKeyDown={stopKeys}
            placeholder="Body text (optional)"
            rows={5}
            style={{
              ...fieldBase,
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontStyle: 'italic',
              fontSize: 12.5,
              lineHeight: 1.6,
              fontWeight: 300,
              color: '#b0c8e0',
            }}
          />

          {/* Footer textarea */}
          <textarea
            defaultValue={footer}
            onChange={update('footer')}
            onKeyDown={stopKeys}
            placeholder="Footer callout (optional)"
            rows={2}
            style={{
              ...fieldBase,
              fontFamily: '"Caveat", cursive',
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: 14,
              lineHeight: 1.35,
              color: t.accent,
            }}
          />

          {/* URL input */}
          <input
            defaultValue={url}
            onChange={update('url')}
            onKeyDown={stopKeys}
            placeholder="https:// (optional link)"
            style={{
              ...fieldBase,
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: 11,
              color: t.titleColor,
              background: t.badgeBg,
            }}
          />
        </div>
      )
    }

    // ── View mode ────────────────────────────────────────────────
    return (
      <div style={{ ...cardBase, gap: 0, fontFamily: '"Caveat", cursive' }}>

        {/* Badge pill */}
        {badge && (
          <div style={{
            alignSelf: 'flex-start',
            background: t.badgeBg,
            border: `1px solid ${t.accent}55`,
            borderRadius: 4,
            padding: '1px 8px',
            marginBottom: 8,
            fontFamily: '"IBM Plex Sans", sans-serif',
            fontStyle: 'italic',
            fontSize: 9.5,
            fontWeight: 400,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            color: t.accent,
            whiteSpace: 'nowrap' as const,
          }}>
            {badge}
          </div>
        )}

        {/* Title */}
        <div style={{
          fontFamily: '"Caveat", cursive',
          fontWeight: 700,
          fontSize: badge ? 20 : 26,
          lineHeight: 1.25,
          color: t.titleColor,
          marginBottom: body || footer ? 8 : 0,
          whiteSpace: 'pre-wrap' as const,
          flexShrink: 0,
        }}>
          {title}
        </div>

        {/* Body */}
        {body && (
          <div style={{
            fontFamily: '"IBM Plex Sans", sans-serif',
            fontStyle: 'italic',
            fontSize: 12.5,
            lineHeight: 1.6,
            color: '#7a90a8',
            fontWeight: 300,
            whiteSpace: 'pre-wrap' as const,
            flex: 1,
            overflow: 'hidden',
          }}>
            {body}
          </div>
        )}

        {/* Footer callout */}
        {footer && (
          <div style={{
            fontFamily: '"Caveat", cursive',
            fontStyle: 'italic',
            fontSize: 14,
            fontWeight: 600,
            color: t.accent,
            marginTop: 8,
            lineHeight: 1.35,
            whiteSpace: 'pre-wrap' as const,
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}

        {/* URL bar — click opens link in new tab */}
        {url && (
          <div
            onClick={e => { e.stopPropagation(); window.open(url, '_blank', 'noreferrer') }}
            onPointerDown={e => e.stopPropagation()}
            style={{
              marginTop: 'auto',
              paddingTop: 8,
              borderTop: `1px solid ${t.accent}33`,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: 10.5,
              color: t.accent,
              overflow: 'hidden',
              flexShrink: 0,
              cursor: 'pointer',
            }}
          >
            <span style={{ flexShrink: 0 }}>🔗</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', textDecorationColor: `${t.accent}66` }}>
              {url.replace(/^https?:\/\//, '')}
            </span>
          </div>
        )}
      </div>
    )
  }

  indicator(shape: any) {
    return <rect width={shape.props.w} height={shape.props.h} rx={12} ry={12} />
  }
}

