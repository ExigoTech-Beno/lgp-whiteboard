import { CardColorPicker } from './CardColorPicker'
import { SaveRestore } from './SaveRestore'

/** Single component used as InFrontOfTheCanvas — combines all overlay UI. */
export function CanvasOverlay() {
  return (
    <>
      <CardColorPicker />
      <SaveRestore />
    </>
  )
}
