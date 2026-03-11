import {
  Body1,
  Button,
  Card,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  Subtitle2,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { useEffect, useState, type FormEvent } from 'react'

const useStyles = makeStyles({
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: tokens.spacingVerticalXXL,
    background: `linear-gradient(180deg, ${tokens.colorNeutralBackground2} 0%, ${tokens.colorNeutralBackground1} 100%)`,
  },
  card: {
    width: 'min(560px, 100%)',
    display: 'grid',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalXXL,
    boxShadow: tokens.shadow16,
  },
  copy: {
    display: 'grid',
    gap: tokens.spacingVerticalS,
  },
  form: {
    display: 'grid',
    gap: tokens.spacingVerticalM,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
})

interface InitialRoomSetupProps {
  projectName: string
  initialRoomName?: string
  busy: boolean
  error: string | null
  onSubmit: (roomName: string) => Promise<void>
  onBackToProjects: () => void
}

export function InitialRoomSetup({
  projectName,
  initialRoomName = 'Raum 1',
  busy,
  error,
  onSubmit,
  onBackToProjects,
}: InitialRoomSetupProps) {
  const styles = useStyles()
  const [roomName, setRoomName] = useState(initialRoomName)

  useEffect(() => {
    setRoomName(initialRoomName)
  }, [initialRoomName])

  return (
    <div className={styles.page} data-testid='initial-room-setup'>
      <Card className={styles.card} appearance='filled-alternative'>
        <div className={styles.copy}>
          <Subtitle2>Ersten Raum anlegen</Subtitle2>
          <Body1>
            Das Projekt <strong>{projectName}</strong> ist angelegt. Bevor der Editor startet, wird zuerst ein Raum benoetigt.
          </Body1>
          <Body1>
            Nach dem Anlegen startest du direkt im Wand-Workflow und kannst den Raum zeichnen.
          </Body1>
        </div>

        {error && (
          <MessageBar intent='error'>
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}

        <form
          className={styles.form}
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            void onSubmit(roomName)
          }}
        >
          <Field label='Raumname' required>
            <Input
              data-testid='initial-room-name'
              value={roomName}
              onChange={(_event, data) => setRoomName(data.value)}
              autoFocus
            />
          </Field>

          <div className={styles.actions}>
            <Button appearance='secondary' onClick={onBackToProjects} disabled={busy}>
              Zur Projektliste
            </Button>
            <Button appearance='primary' type='submit' disabled={busy || roomName.trim().length === 0} data-testid='initial-room-submit'>
              {busy ? <Spinner size='tiny' /> : 'Raum anlegen und Editor starten'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
