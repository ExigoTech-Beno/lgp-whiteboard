import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor } from 'tldraw'
import { initPresentation, initLogo, migrateStandupInstr, migrateQCards, migrateRevealArrow, migrateGatedCard } from '../slides/initPresentation'

const MAX_SLOTS = 5
const SLOT_KEY = (i: number) => `lgp-bk-${i}`
const SLOT_TS_KEY = (i: number) => `lgp-bk-ts-${i}`
const NEXT_SLOT_KEY = 'lgp-bk-next'
const INTERVAL_MS = 30_000

interface Backup { slot: number; ts: number }

const btn = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
  background: `${color}22`,
  border: `1px solid ${color}55`,
  borderRadius: 6,
  color,
  padding: '5px 10px',
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: '"IBM Plex Sans",sans-serif',
  whiteSpace: 'nowrap',
  ...extra,
})

const relTime = (ts: number) => {
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 5)  return 'just now'
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  return new Date(ts).toLocaleTimeString()
}

export function SaveRestore() {
  const editor = useEditor()
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [tick, setTick]           = useState(0)           // forces re-render for relTime
  const [showPanel, setShowPanel] = useState(false)
  const [backups, setBackups]     = useState<Backup[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  // ── Auto-backup ──────────────────────────────────────────────────
  const doBackup = useCallback(() => {
    try {
      const snapshot = JSON.stringify(editor.getSnapshot())
      const next = parseInt(localStorage.getItem(NEXT_SLOT_KEY) ?? '0') % MAX_SLOTS
      localStorage.setItem(SLOT_KEY(next), snapshot)
      localStorage.setItem(SLOT_TS_KEY(next), Date.now().toString())
      localStorage.setItem(NEXT_SLOT_KEY, String(next + 1))
      setLastSaved(Date.now())
    } catch (e) {
      console.warn('Auto-backup failed:', e)
    }
  }, [editor])

  useEffect(() => {
    doBackup()
    const saveId = setInterval(doBackup, INTERVAL_MS)
    const tickId = setInterval(() => setTick(t => t + 1), 15_000)
    return () => { clearInterval(saveId); clearInterval(tickId) }
  }, [doBackup])

  // Close panel on outside click
  useEffect(() => {
    if (!showPanel) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false)
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [showPanel])

  // ── Load backups list ────────────────────────────────────────────
  const openPanel = () => {
    const list: Backup[] = []
    for (let i = 0; i < MAX_SLOTS; i++) {
      const ts = localStorage.getItem(SLOT_TS_KEY(i))
      if (ts) list.push({ slot: i, ts: parseInt(ts) })
    }
    list.sort((a, b) => b.ts - a.ts)
    setBackups(list)
    setShowPanel(p => !p)
  }

  // ── Restore from slot ────────────────────────────────────────────
  const restore = (slot: number) => {
    const raw = localStorage.getItem(SLOT_KEY(slot))
    if (!raw) return
    try {
      const snapshot = JSON.parse(raw)
      editor.loadSnapshot(snapshot)
      setShowPanel(false)
    } catch (e) {
      alert('Restore failed: ' + e)
    }
  }

  // ── Backup (full fidelity .json — for restoring in this app) ────────
  const exportBackup = () => {
    const snapshot = JSON.stringify(editor.getSnapshot(), null, 2)
    const blob = new Blob([snapshot], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `lgp-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Share as .tldr (tldraw.com / VS Code compatible) ─────────────
  // Custom 'card' shapes are stripped — they are unknown to tldraw.com
  // and cause an "invalid records" error if included.
  // Native shapes (arrows, text, images) are preserved and render correctly.
  const exportTldrCompat = () => {
    const snapshot = editor.getSnapshot()
    const store    = snapshot.document.store as Record<string, any>

    // Filter out card shapes and any card-specific schema sequences
    const compatRecords = Object.values(store).filter(
      (r: any) => !(r.typeName === 'shape' && r.type === 'card')
    )

    // Remove card-related sequences from the schema so tldraw.com doesn't
    // encounter an unknown migration sequence
    const origSchema = snapshot.document.schema as any
    const cleanSequences: Record<string, number> = {}
    for (const [key, val] of Object.entries(origSchema.sequences ?? {})) {
      if (!key.includes('.card')) cleanSequences[key] = val as number
    }

    const tldrFile = {
      tldrawFileFormatVersion: 1,
      schema: { ...origSchema, sequences: cleanSequences },
      records: compatRecords,
    }

    const blob = new Blob([JSON.stringify(tldrFile, null, 2)], { type: 'application/vnd.tldraw+json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `lgp-canvas-${new Date().toISOString().slice(0, 10)}.tldr`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import — accepts .json backup or .tldr ────────────────────────
  const importFile = () => {
    const input    = document.createElement('input')
    input.type     = 'file'
    input.accept   = '.tldr,.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target?.result as string)

          if (data.tldrawFileFormatVersion !== undefined) {
            // .tldr format: convert records array → store map
            const storeMap: Record<string, unknown> = {}
            for (const record of data.records as any[]) {
              storeMap[record.id] = record
            }
            editor.loadSnapshot({ document: { store: storeMap as any, schema: data.schema } })
          } else {
            // Full backup .json format: { document, session }
            editor.loadSnapshot(data)
          }
        } catch (err) {
          alert('Import failed: ' + err)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // ── Reset canvas — wipe everything and reinitialise from scratch ──
  const resetCanvas = () => {
    if (!confirm('Reset the canvas? All changes will be lost and the presentation will be rebuilt from scratch.')) return
    editor.run(() => {
      const allIds = [...editor.getCurrentPageShapeIds()]
      if (allIds.length) editor.deleteShapes(allIds)
    })
    initPresentation(editor)
    initLogo(editor)
    migrateStandupInstr(editor)
    migrateQCards(editor)
    migrateRevealArrow(editor)
    migrateGatedCard(editor)
  }


  return (
    <div
      style={{
        position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, alignItems: 'center',
        pointerEvents: 'all', zIndex: 300000,
        fontFamily: '"IBM Plex Sans",sans-serif',
        background: '#0d1520cc',
        border: '1px solid rgba(255,255,255,.10)',
        borderRadius: 10,
        padding: '5px 10px',
        backdropFilter: 'blur(8px)',
      }}
      onPointerDown={e => e.stopPropagation()}
    >
      {/* Last saved indicator */}
      {lastSaved && (
        <span style={{ fontSize: 10, color: '#4caf50', letterSpacing: '0.04em' }}
          title={`Auto-saved at ${new Date(lastSaved).toLocaleTimeString()}`}
        >
          {/* tick forces re-render so relTime stays fresh */}
          {tick >= 0 && `✓ ${relTime(lastSaved)}`}
        </span>
      )}

      <button onClick={exportBackup} style={btn('#1e88e5')} title="Full backup including card slides (.json) — restore in this app">
        💾 Backup
      </button>
      <button onClick={exportTldrCompat} style={btn('#00897b')} title="Export as .tldr for tldraw.com or VS Code extension (cards stripped, arrows/text preserved)">
        📤 Share .tldr
      </button>
      <button onClick={importFile} style={btn('#546e7a')} title="Restore from a .json backup or .tldr file">
        📂 Import
      </button>
      <button onClick={resetCanvas} style={btn('#e53935')} title="Wipe canvas and rebuild presentation from scratch">
        🔄 Reset
      </button>
      <div style={{ position: 'relative' }} ref={panelRef}>
        <button onClick={openPanel} style={btn('#7c4dff')} title="View auto-save history">
          🕒 History
        </button>

        {showPanel && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', right: 0,
            background: '#0d1520', border: '1px solid rgba(255,255,255,.14)',
            borderRadius: 10, padding: 12, minWidth: 220,
            boxShadow: '0 12px 40px rgba(0,0,0,.7)', zIndex: 300001,
          }}>
            <div style={{ fontSize: 11, color: '#90a4ae', marginBottom: 10, fontWeight: 600, letterSpacing: '0.06em' }}>
              AUTO-SAVE HISTORY
            </div>
            {backups.length === 0 ? (
              <div style={{ fontSize: 11, color: '#546e7a' }}>No backups yet (saving every 30s)</div>
            ) : (
              backups.map(b => (
                <div key={b.slot} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 8, gap: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#cfd8dc' }}>
                      {new Date(b.ts).toLocaleTimeString()}
                    </div>
                    <div style={{ fontSize: 10, color: '#546e7a' }}>
                      {relTime(b.ts)}
                    </div>
                  </div>
                  <button onClick={() => restore(b.slot)} style={btn('#2979ff', { padding: '3px 10px', fontSize: 10 })}>
                    Restore
                  </button>
                </div>
              ))
            )}

            <div style={{
              marginTop: 12, paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,.08)',
              fontSize: 10, color: '#37474f', lineHeight: 1.5,
            }}>
              💡 Use <strong style={{ color: '#546e7a' }}>Export</strong> to save a permanent backup file to your computer.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
