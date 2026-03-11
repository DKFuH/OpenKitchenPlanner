import { makeStyles, tokens } from '@fluentui/react-components'
import { useState, type ReactNode } from 'react'
import { useEditorInspectorSections } from '../plugins/EditorPluginHost.js'

const useStyles = makeStyles({
  root: {
    width: '232px',
    minWidth: '232px',
    maxWidth: '232px',
    flexShrink: 0,
    borderLeft: '1px solid ' + tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '0',
  },
  pluginSections: {
    borderBottom: '1px solid ' + tokens.colorNeutralStroke2,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    display: 'grid',
    gap: tokens.spacingVerticalXXS,
    overflowY: 'auto',
    minHeight: '0',
  },
  pluginSection: {
    display: 'grid',
    gap: '4px',
    border: '1px solid ' + tokens.colorNeutralStroke2,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground2,
    overflow: 'hidden',
  },
  pluginSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    width: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    cursor: 'pointer',
    textAlign: 'left',
  },
  pluginSectionTitle: {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground3,
  },
  pluginSectionChevron: {
    fontSize: '0.72rem',
    color: tokens.colorNeutralForeground3,
  },
  pluginSectionBody: {
    padding: `0 ${tokens.spacingHorizontalS} ${tokens.spacingVerticalXXS}`,
  },
  legacy: {
    minHeight: '0',
    overflowY: 'auto',
    display: 'flex',
    flex: '1',
  },
})

const DEFAULT_OPEN_SECTION_IDS = new Set([
  'legacy-catalog',
  'legacy-selection',
])

export function InspectorPanel({ children }: { children?: ReactNode }) {
  const styles = useStyles()
  const inspectorSections = useEditorInspectorSections()
  const [sectionState, setSectionState] = useState<Record<string, boolean>>({})

  return (
    <aside className={styles.root}>
      {inspectorSections.length > 0 && (
        <div className={styles.pluginSections}>
          {inspectorSections.map((section) => {
            const content = section.render()
            if (content === null || content === undefined || content === false) {
              return null
            }

            const expanded = sectionState[section.id] ?? DEFAULT_OPEN_SECTION_IDS.has(section.id)

            return (
              <div key={section.id} className={styles.pluginSection}>
                <button
                  type='button'
                  className={styles.pluginSectionHeader}
                  onClick={() => {
                    setSectionState((previous) => ({
                      ...previous,
                      [section.id]: !expanded,
                    }))
                  }}
                >
                  <span className={styles.pluginSectionTitle}>{section.title}</span>
                  <span className={styles.pluginSectionChevron}>{expanded ? '-' : '+'}</span>
                </button>
                {expanded ? <div className={styles.pluginSectionBody}>{content}</div> : null}
              </div>
            )
          })}
        </div>
      )}
      {children ? <div className={styles.legacy}>{children}</div> : null}
    </aside>
  )
}
