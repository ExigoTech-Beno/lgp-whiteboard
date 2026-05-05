import { createBindingId, createShapeId, Editor, TLAssetId, toRichText } from 'tldraw'

const LOGO_ASSET_ID = 'asset:fabricouncil-logo' as TLAssetId
const LOGO_SHAPE_ID = createShapeId('fabricouncil-logo')
const STANDUP_INSTR_ID = createShapeId('standup-instr')

/** Migration: fix badge labels + cluster Q1/Q2/Q3 with unified violet colour. */
export function migrateQCards(editor: Editor) {
  const standupId     = createShapeId('standup')
  const standupInstrId = createShapeId('standup-instr')
  const q1Id = createShapeId('q1')
  const q2Id = createShapeId('q2')
  const q3Id = createShapeId('q3')
  const a7bId = createShapeId('a-instr-q1')
  const a8Id  = createShapeId('a-q1-q2')
  const a9Id  = createShapeId('a-q2-q3')

  editor.run(() => {
    // Fix badge labels
    const standup = editor.getShape(standupId) as any
    if (standup?.props?.badge?.startsWith('Slide 6')) {
      editor.updateShape({ id: standupId, type: 'card', props: { badge: 'Interactive' } } as any)
    }
    const standupInstr = editor.getShape(standupInstrId) as any
    if (standupInstr?.props?.badge?.startsWith('Slide 6')) {
      editor.updateShape({ id: standupInstrId, type: 'card', props: { badge: 'Instructions' } } as any)
    }

    // Cluster Q cards — vertical stack right of standupInstr, all violet
    if (editor.getShape(q1Id)) editor.updateShape({ id: q1Id, type: 'card', x: 1760, y: 22,  props: { color: 'violet', colorKey: '', w: 260, h: 120 } } as any)
    if (editor.getShape(q2Id)) editor.updateShape({ id: q2Id, type: 'card', x: 1760, y: 162, props: { color: 'violet', colorKey: '', w: 260, h: 120 } } as any)
    if (editor.getShape(q3Id)) editor.updateShape({ id: q3Id, type: 'card', x: 1760, y: 302, props: { color: 'violet', colorKey: '', w: 260, h: 120 } } as any)

    // Re-anchor arrows for new layout
    const bindings = editor.store.allRecords().filter((r: any) =>
      r.typeName === 'binding' && [a7bId, a8Id, a9Id].includes((r as any).fromId)
    ) as any[]

    for (const b of bindings) {
      let anchor: { x: number; y: number } | null = null
      if (b.fromId === a7bId) {
        // standupInstr.RGT → q1.LFT (horizontal hand-off)
        anchor = b.props.terminal === 'start' ? { x: 1, y: 0.5 } : { x: 0, y: 0.5 }
      } else {
        // q1→q2 and q2→q3: straight vertical stack BOT → TOP
        anchor = b.props.terminal === 'start' ? { x: 0.5, y: 1 } : { x: 0.5, y: 0 }
      }
      if (anchor) editor.store.put([{ ...b, props: { ...b.props, normalizedAnchor: anchor } }])
    }
  })
}

/** Migration: fix reveal→frontier arrow direction; remove reveal→cta bypass. */
export function migrateRevealArrow(editor: Editor) {
  const revealId   = createShapeId('reveal')
  const frontierId = createShapeId('frontier')
  const a11Id      = createShapeId('a-front-reveal')
  const a17Id      = createShapeId('a-reveal-cta')

  editor.run(() => {
    // Fix a11: flip it so it goes reveal→frontier (was frontier→reveal)
    const allBindings = editor.store.allRecords().filter((r: any) => r.typeName === 'binding') as any[]
    const a11Bindings = allBindings.filter((b: any) => b.fromId === a11Id)
    const startBind   = a11Bindings.find((b: any) => b.props.terminal === 'start')

    if (startBind?.toId === frontierId) {
      // Currently wrong: start=frontier, end=reveal — flip to start=reveal, end=frontier
      for (const b of a11Bindings) {
        const isStart = b.props.terminal === 'start'
        editor.store.put([{
          ...b,
          toId: isStart ? revealId : frontierId,
          props: {
            ...b.props,
            normalizedAnchor: isStart ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 },
          },
        }])
      }
    }

    // Remove the a17 reveal→cta bypass arrow (flow should go via frontier)
    if (editor.getShape(a17Id)) {
      editor.deleteShapes([a17Id])
    }
  })
}

/** Adds the Stand Up Instructions card if missing (migration for existing canvases). */
export function migrateStandupInstr(editor: Editor) {
  if (editor.getShape(STANDUP_INSTR_ID)) return  // already present

  const standupInstr = STANDUP_INSTR_ID
  const q1 = createShapeId('q1')
  const a7b = createShapeId('a-instr-q1')

  editor.run(() => {
    editor.createShapes([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { type: 'card', id: standupInstr, x: 1400, y: 22, props: { w: 310, h: 190, badge: 'Slide 6 — Instructions', title: 'Everyone please stand up.', body: '"I\'ll ask three questions.\nIf your answer is yes — stay standing.\nIf no — sit down.\n\nBy the end, only two people will\nstill be standing — and those two are\nthe AI leaders in local government."', footer: '', url: '', color: 'light-blue', colorKey: '' } } as any,
      // arrow shape
      { type: 'arrow', id: a7b, x: 0, y: 0, props: { start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, bend: 10, color: 'grey', dash: 'dashed', size: 's', arrowheadStart: 'none', arrowheadEnd: 'arrow', font: 'draw', richText: toRichText(''), labelPosition: 0.5, scale: 1 } } as any,
    ])

    editor.createBindings([
      { id: createBindingId(), type: 'arrow', fromId: a7b, toId: standupInstr, props: { terminal: 'start', normalizedAnchor: { x: 0.5, y: 1 }, isExact: false, isPrecise: true } },
      { id: createBindingId(), type: 'arrow', fromId: a7b, toId: q1,           props: { terminal: 'end',   normalizedAnchor: { x: 0.5, y: 0 }, isExact: false, isPrecise: true } },
    ])
  })
}

/** Adds the FabriCouncil logo once, top-left beside the opening quote card. */
export function initLogo(editor: Editor) {
  if (editor.getShape(LOGO_SHAPE_ID)) return  // already present (persistenceKey restored it)

  editor.run(() => {
    // Register the PNG as a TLDraw image asset
    editor.store.put([{
      id: LOGO_ASSET_ID,
      type: 'image' as const,
      typeName: 'asset' as const,
      props: {
        src: '/fabricouncil-logo.png',
        w: 1020,
        h: 1020,
        mimeType: 'image/png',
        isAnimated: false,
        name: 'FabriCouncil Logo',
      },
      meta: {},
    }])

    // Place logo top-left, same row as the opening card (x:500,y:28), so it reads as
    // "Presented to FabriCouncil" before the first slide
    editor.createShape({
      type: 'image',
      id: LOGO_SHAPE_ID,
      x: 220,
      y: -10,
      props: {
        assetId: LOGO_ASSET_ID,
        w: 240,
        h: 240,
        playing: false,
        url: '',
        crop: null,
        flipX: false,
        flipY: false,
        altText: 'FabriCouncil Logo',
      },
    })
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function card(id: ReturnType<typeof createShapeId>, x: number, y: number, w: number, h: number, badge: string, title: string, body: string, footer: string, color: string, url = ''): any {
  return { type: 'card', id, x, y, props: { w, h, badge, title, body, footer, color, url } }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function arrowShape(id: ReturnType<typeof createShapeId>, bend = 0): any {
  return {
    type: 'arrow', id, x: 0, y: 0,
    props: {
      start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, bend,
      color: 'grey', dash: 'dashed', size: 's',
      arrowheadStart: 'none', arrowheadEnd: 'arrow',
      font: 'draw', richText: toRichText(''), labelPosition: 0.5, scale: 1,
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function label(x: number, y: number, text: string): any {
  return {
    type: 'text', id: createShapeId(), x, y,
    props: { richText: toRichText(text), color: 'grey', size: 's', font: 'draw', textAlign: 'start', autoSize: true, scale: 0.85, w: 200 },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bind(arrowId: ReturnType<typeof createShapeId>, shapeId: ReturnType<typeof createShapeId>, terminal: 'start' | 'end', anchor: { x: number; y: number }): any {
  return { id: createBindingId(), type: 'arrow', fromId: arrowId, toId: shapeId, props: { terminal, normalizedAnchor: anchor, isExact: false, isPrecise: true } }
}

const TOP   = { x: 0.5, y: 0 }
const BOT   = { x: 0.5, y: 1 }
const LFT   = { x: 0,   y: 0.5 }
const RGT   = { x: 1,   y: 0.5 }
const BOT_L = { x: 0.2, y: 1 }
const BOT_R = { x: 0.8, y: 1 }

export function initPresentation(editor: Editor) {
  // Guard against React StrictMode double-mount — check if shapes already exist
  if (editor.store.allRecords().some((r: any) => r.typeName === 'shape')) return

  const opening    = createShapeId('opening')
  const standup    = createShapeId('standup')
  const standupInstr = createShapeId('standup-instr')
  const problem    = createShapeId('problem')
  const sharepoint = createShapeId('sharepoint')
  const blueprint  = createShapeId('blueprint')
  const q1         = createShapeId('q1')
  const q2         = createShapeId('q2')
  const q3         = createShapeId('q3')
  const frontier   = createShapeId('frontier')
  const reveal     = createShapeId('reveal')
  const citzen     = createShapeId('citzen')
  const outcomes   = createShapeId('outcomes')
  const cta        = createShapeId('cta')
  const vibesub    = createShapeId('vibesub')

  const a1  = createShapeId('a-open-problem')
  const a2  = createShapeId('a-open-blueprint')
  const a3  = createShapeId('a-open-standup')
  const a4  = createShapeId('a-prob-share')
  const a5  = createShapeId('a-share-blue')
  const a6  = createShapeId('a-blue-front')
  const a7  = createShapeId('a-stand-instr')
  const a7b = createShapeId('a-instr-q1')
  const a8  = createShapeId('a-q1-q2')
  const a9  = createShapeId('a-q2-q3')
  const a10 = createShapeId('a-q3-reveal')
  const a11 = createShapeId('a-front-reveal')
  const a12 = createShapeId('a-front-citzen')
  const a13 = createShapeId('a-front-outcomes')
  const a14 = createShapeId('a-front-cta')
  const a15 = createShapeId('a-citzen-outcomes')
  const a16 = createShapeId('a-outcomes-cta')
  const a18 = createShapeId('a-cta-vibesub')

  editor.run(() => {
    // ── CARDS ────────────────────────────────────────────────────
    editor.createShapes([
      card(opening, 500, 28, 390, 185,
        'Opening',
        '"You can outsource your thinking —\nbut you can\'t outsource\nyour understanding."',
        'AI accelerates work.\nCouncils must own their knowledge.',
        '', 'blue'),

      card(standup, 1055, 22, 295, 148,
        'Interactive',
        '🖐  Stand Up Leadership Test',
        'Everyone stands. Three questions.\nOnly 2 people remain —\nthe AI leaders in local government.',
        '', 'blue'),

      card(standupInstr, 1400, 22, 310, 190,
        'Instructions',
        'Everyone please stand up.',
        '"I\'ll ask three questions.\nIf your answer is yes — stay standing.\nIf no — sit down.\n\nBy the end, only two people will\nstill be standing — and those two are\nthe AI leaders in local government."',
        '', 'light-blue'),

      card(problem, 20, 228, 320, 212,
        'The Problem',
        'Reality in Councils Today',
        '· Siloed knowledge across teams\n· Gated systems restricting access\n· Systems of record holding intel\n· SharePoint sprawl — not AI-ready',
        '↳ They lack accessible knowledge.', 'red'),

      card(sharepoint, 380, 240, 292, 196,
        'Root Cause',
        'SharePoint: The Classic Example',
        '· No taxonomy or structure\n· PDFs without machine context\n· Version sprawl\n· No authoritative source of truth',
        '↳ AI needs structure — not document dumps.', 'yellow'),

      card(blueprint, 762, 248, 288, 162,
        'Blueprint',
        'How Councils Fix This',
        '01  Remodel knowledge\n02  Connect systems of record\n03  Expose knowledge to Copilot\n04  Enable customer service teams',
        '', 'blue'),

      // Q1/Q2/Q3 — clustered vertical stack, same violet colour
      card(q1, 1760, 22,  260, 120, 'Q1', 'Used an LLM today?',             'ChatGPT, Claude, Copilot — any of them.',  '', 'violet'),
      card(q2, 1760, 162, 260, 120, 'Q2', 'Built or bought an agent?',       'For your role or department.',             '', 'violet'),
      card(q3, 1760, 302, 260, 120, 'Q3', 'Planning your token budget\nfor FY27?', 'Thinking about AI cost governance.', '', 'violet'),

      card(frontier, 582, 542, 322, 192,
        'Proof Point',
        '🚀  Frontier Firm Story',
        'Independent RFP review agent:\n· Analysed all vendor submissions\n· Compared pricing, compliance, risk\n· Cross-referenced technical specs\n· 6–8 weeks of work in <48 hours\n· Full auditability throughout',
        '', 'green'),

      card(reveal, 1018, 582, 318, 225,
        'Reveal',
        '⭐  These are your future leaders.',
        'Not because they know AI —\nbut because they lean into the future\nbefore it arrives.',
        '"AI will 100% change your job —\nwith 90% certainty in 24 months."\n\nYour mind is malleable. You have a\nchance to re-educate yourself.', 'orange'),

      card(citzen, 18, 752, 305, 225,
        'Solution',
        '🏛️  Introducing Citi-Zen AI',
        '📐  SharePoint Remodelling\n👤  Customer 360\n📞  24/7 Customer Service\n🤖  Copilot Integration',
        'Not a chatbot — a full intelligence platform.', 'blue'),

      card(outcomes, 395, 762, 300, 202,
        'Outcomes',
        'What This Means for Teams',
        '✓  Instant access to policies & cases\n✓  Faster onboarding\n✓  Consistent, accurate answers\n✓  Reduced handle time\n✓  More time solving problems',
        'AI augments — it doesn\'t replace.', 'grey'),

      card(cta, 760, 752, 295, 230,
        'Call to Action',
        'Fix Your Biggest CX Pain — Live',
        'Scan the QR code.\nComplete the Microsoft Form.\nTell us your biggest pain point.',
        'We\'ll fix it live at our booth\nusing Copilot & Citi-Zen AI.', 'blue'),

      card(vibesub, 1100, 752, 295, 230,
        '14 — Live Demo',
        '🔗 VibeSubmissions',
        'Submit your biggest customer experience\npain point directly at the event.',
        'Powered by Exigo Tech', 'light-blue',
        'https://exigotech.com.au'),
    ])

    // ── ARROWS ───────────────────────────────────────────────────
    editor.createShapes([
      arrowShape(a1,  -20), arrowShape(a2,   0), arrowShape(a3, -15),
      arrowShape(a4,    0), arrowShape(a5,   0), arrowShape(a6,  20),
      arrowShape(a7,    0), arrowShape(a7b, 10),
      arrowShape(a8,    0), arrowShape(a9,  10),
      arrowShape(a10,  10), arrowShape(a11, 20), arrowShape(a12,-40),
      arrowShape(a13, -10), arrowShape(a14,  0), arrowShape(a15,  0),
      arrowShape(a16,   0), arrowShape(a18,   0),
    ])

    // ── BINDINGS ─────────────────────────────────────────────────
    editor.createBindings([
      bind(a1,  opening,    'start', BOT),   bind(a1,  problem,    'end',   TOP),
      bind(a2,  opening,    'start', BOT),   bind(a2,  blueprint,  'end',   TOP),
      bind(a3,  opening,    'start', RGT),   bind(a3,  standup,    'end',   LFT),
      bind(a4,  problem,    'start', RGT),   bind(a4,  sharepoint, 'end',   LFT),
      bind(a5,  sharepoint, 'start', RGT),   bind(a5,  blueprint,  'end',   LFT),
      bind(a6,  blueprint,  'start', BOT),   bind(a6,  frontier,   'end',   TOP),
      bind(a7,  standup,      'start', RGT),   bind(a7,  standupInstr, 'end',   LFT),
      bind(a7b, standupInstr, 'start', RGT),   bind(a7b, q1,           'end',   LFT),
      bind(a8,  q1,           'start', BOT),   bind(a8,  q2,           'end',   TOP),
      bind(a9,  q2,           'start', BOT),   bind(a9,  q3,           'end',   TOP),
      bind(a10, q3,         'start', BOT),   bind(a10, reveal,     'end',   TOP),
      bind(a11, reveal,     'start', LFT),   bind(a11, frontier,   'end',   RGT),
      bind(a12, frontier,   'start', BOT_L), bind(a12, citzen,     'end',   TOP),
      bind(a13, frontier,   'start', BOT),   bind(a13, outcomes,   'end',   TOP),
      bind(a14, frontier,   'start', BOT_R), bind(a14, cta,        'end',   TOP),
      bind(a15, citzen,     'start', RGT),   bind(a15, outcomes,   'end',   LFT),
      bind(a16, outcomes,   'start', RGT),   bind(a16, cta,        'end',   LFT),
      bind(a18, cta,        'start', RGT),   bind(a18, vibesub,    'end',   LFT),
    ])

    // ── FLOATING LABELS ──────────────────────────────────────────
    editor.createShapes([
      label(190, 445, 'foundation first ↓'),
      label(810, 460, 'only 2 remain standing →'),
      label(592, 720, 'proof works ↓'),
    ])

    editor.zoomToFit({ animation: { duration: 400 } })
  })
}
