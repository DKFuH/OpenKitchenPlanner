import { Button, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Tooltip, makeStyles, tokens } from '@fluentui/react-components'
import { useTranslation } from 'react-i18next'
import type { RibbonCommand as RibbonCommandType } from './ribbonStateResolver.js'

interface RibbonCommandProps {
  command: RibbonCommandType
  onExecute: (command: RibbonCommandType) => void
  compact?: boolean
}

const useStyles = makeStyles({
  button: {
    minWidth: 'unset',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: tokens.spacingVerticalXXS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  compactButton: {
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
  },
})

export function RibbonCommand({ command, onExecute, compact = false }: RibbonCommandProps) {
  const styles = useStyles()
  const { t } = useTranslation()

  if (!command.visible) return null

  const label = t(command.labelKey)
  const disabledReason = !command.enabled && command.reasonKey ? t(command.reasonKey) : undefined

  // Dropdown menu button (e.g. MCP actions)
  if (command.subCommands && command.subCommands.length > 0) {
    return (
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Button
            appearance='subtle'
            className={compact ? styles.compactButton : styles.button}
            data-testid={`ribbon-cmd-${command.id}`}
          >
            {label}
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {command.subCommands.map((sub) => (
              <MenuItem
                key={sub.id}
                disabled={!sub.enabled}
                onClick={() => { if (sub.enabled) onExecute(sub) }}
              >
                {t(sub.labelKey)}
              </MenuItem>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>
    )
  }

  const button = (
    <Button
      appearance='subtle'
      className={compact ? styles.compactButton : styles.button}
      disabled={!command.enabled}
      data-testid={`ribbon-cmd-${command.id}`}
      onClick={() => {
        if (command.enabled) {
          onExecute(command)
        }
      }}
    >
      {label}
    </Button>
  )

  if (!disabledReason) {
    return button
  }

  return (
    <Tooltip content={disabledReason} relationship='label'>
      <span>{button}</span>
    </Tooltip>
  )
}
