import type { ComponentProps } from 'react'
import { PopoutWindow } from '../../components/editor/PopoutWindow.js'
import { Preview3D } from '../../components/editor/Preview3D.js'

interface Preview3DPopoutProps {
  open: boolean
  title: string
  name: string
  onClose: () => void
  previewProps: ComponentProps<typeof Preview3D>
}

export function Preview3DPopout({
  open,
  title,
  name,
  onClose,
  previewProps,
}: Preview3DPopoutProps) {
  if (!open) {
    return null
  }

  return (
    <PopoutWindow title={title} name={name} onClose={onClose}>
      <Preview3D {...previewProps} />
    </PopoutWindow>
  )
}
