import { useEffect } from 'react'
import type { RefObject } from 'react'
import { clampNumber } from '../../pages/plannerViewSettings.js'

interface UseEditor11SplitLayoutArgs {
  splitContainerRef: RefObject<HTMLDivElement | null>
  activeSplitDrag: 'split' | null
  splitRatio: number
  setSplitRatio: (value: number) => void
  setActiveSplitDrag: (value: 'split' | null) => void
}

export function useEditor11SplitLayout({
  splitContainerRef,
  activeSplitDrag,
  splitRatio,
  setSplitRatio,
  setActiveSplitDrag,
}: UseEditor11SplitLayoutArgs) {
  useEffect(() => {
    if (activeSplitDrag !== 'split') {
      return
    }

    const handlePointerMove = (event: MouseEvent) => {
      const host = splitContainerRef.current
      if (!host) {
        return
      }

      const rect = host.getBoundingClientRect()
      const ratio = ((event.clientX - rect.left) / rect.width) * 100
      setSplitRatio(clampNumber(ratio, 25, 75))
    }

    const handlePointerUp = () => {
      setActiveSplitDrag(null)
    }

    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handlePointerUp)
    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
    }
  }, [activeSplitDrag, setActiveSplitDrag, setSplitRatio, splitContainerRef])

  useEffect(() => {
    if (!splitContainerRef.current) {
      return
    }

    splitContainerRef.current.style.setProperty('--split-left', `${splitRatio}%`)
  }, [splitContainerRef, splitRatio])
}
