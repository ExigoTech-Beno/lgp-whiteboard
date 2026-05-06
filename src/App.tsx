import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { CardShapeUtil } from './shapes/CardShape'
import { CanvasOverlay } from './components/CanvasOverlay'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initPresentation, initLogo, migrateStandupInstr, migrateQCards, migrateRevealArrow, migrateGatedCard } from './slides/initPresentation'

const customShapes = [CardShapeUtil]
const customComponents = { InFrontOfTheCanvas: CanvasOverlay }

function App() {
return (
  <ErrorBoundary>
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        persistenceKey="lgp-presentation"
        shapeUtils={customShapes}
        components={customComponents}
        onMount={(editor) => {
          editor.user.updateUserPreferences({ colorScheme: 'dark' })
          initPresentation(editor)
          initLogo(editor)
          migrateStandupInstr(editor)
          migrateQCards(editor)
          migrateRevealArrow(editor)
          migrateGatedCard(editor)
        }}
      />
    </div>
  </ErrorBoundary>
)
}

export default App
