import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InitialRoomSetup } from './InitialRoomSetup.js'
import { useEditor11PageRuntime } from './useEditor11PageRuntime.js'

export function EditorPage11() {
  const navigate = useNavigate()
  const { styles, pageState, roomOperations, chromeNodes, dockPanels, workspaceView, statusBarNode, previewPopoutNode } = useEditor11PageRuntime()
  const [initialRoomName, setInitialRoomName] = useState('Raum 1')
  const [setupBusy, setSetupBusy] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)

  useEffect(() => {
    setInitialRoomName('Raum 1')
    setSetupBusy(false)
    setSetupError(null)
  }, [pageState.project?.id])

  if (pageState.loading) return <div className={styles.center}>Lade Projekt...</div>
  if (pageState.error) return <div className={styles.center}>{pageState.error}</div>
  if (!pageState.project) return null
  if (pageState.project.rooms.length === 0) {
    return (
      <InitialRoomSetup
        projectName={pageState.project.name}
        initialRoomName={initialRoomName}
        busy={setupBusy}
        error={setupError}
        onSubmit={async (roomName) => {
          const trimmedName = roomName.trim()
          if (!trimmedName) {
            setSetupError('Bitte einen Raumnamen eingeben.')
            return
          }

          setSetupBusy(true)
          setSetupError(null)
          try {
            await roomOperations.handleAddRoom(trimmedName)
          } catch (error) {
            setSetupError(error instanceof Error ? error.message : 'Raum konnte nicht angelegt werden.')
          } finally {
            setSetupBusy(false)
          }
        }}
        onBackToProjects={() => navigate('/')}
      />
    )
  }

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
