import { useEditor11PageRuntime } from './useEditor11PageRuntime.js'

export function EditorPage11() {
  const { styles, pageState, chromeNodes, dockPanels, workspaceView, statusBarNode, previewPopoutNode } = useEditor11PageRuntime()

  if (pageState.loading) return <div className={styles.center}>Lade Projekt...</div>
  if (pageState.error) return <div className={styles.center}>{pageState.error}</div>
  if (!pageState.project) return null

  return (
    <div className={styles.shell}>
      {chromeNodes}
      {dockPanels}
      {workspaceView}
      {statusBarNode}
      {previewPopoutNode}
    </div>
  )
}
