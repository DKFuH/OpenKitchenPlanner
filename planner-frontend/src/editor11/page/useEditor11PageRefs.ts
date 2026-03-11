import { useRef } from 'react'

export function useEditor11PageRefs() {
  const moreMenuRef = useRef<HTMLDivElement | null>(null)
  const sectionMenuRef = useRef<HTMLDivElement | null>(null)
  const toolboxMenuRef = useRef<HTMLDivElement | null>(null)
  const navigationPanelRef = useRef<HTMLDivElement | null>(null)
  const cameraPresetPanelRef = useRef<HTMLDivElement | null>(null)
  const screenshotPanelRef = useRef<HTMLDivElement | null>(null)
  const captureRootRef = useRef<HTMLDivElement | null>(null)
  const splitContainerRef = useRef<HTMLDivElement | null>(null)

  return {
    moreMenuRef,
    sectionMenuRef,
    toolboxMenuRef,
    navigationPanelRef,
    cameraPresetPanelRef,
    screenshotPanelRef,
    captureRootRef,
    splitContainerRef,
  }
}
