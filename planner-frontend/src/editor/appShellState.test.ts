import { describe, expect, it } from 'vitest'
import { projectIdFromPathname, resolveAppShellActionMatrix } from './appShellState.js'
import { projectIdFromRouteContext, withProjectContext } from '../routing/projectContext.js'

describe('appShellState helpers', () => {
  it('extracts project id from project routes', () => {
    expect(projectIdFromPathname('/projects/abc-123')).toBe('abc-123')
    expect(projectIdFromPathname('/projects/abc-123/exports')).toBe('abc-123')
  })

  it('returns null project id outside project routes', () => {
    expect(projectIdFromPathname('/')).toBe(null)
    expect(projectIdFromPathname('/settings')).toBe(null)
  })

  it('restores project id from settings query context', () => {
    expect(projectIdFromRouteContext('/settings/plugins', '?projectId=abc-123')).toBe('abc-123')
    expect(withProjectContext('/settings/plugins', 'abc-123')).toBe('/settings/plugins?projectId=abc-123')
  })

  it('disables project-scoped actions without project context', () => {
    const matrix = resolveAppShellActionMatrix({
      projectId: null,
      compactLayout: false,
      workflowStep: 'walls',
    })

    expect(matrix.actionStates.presentationMode.enabled).toBe(false)
    expect(matrix.actionStates.navQuoteLines.enabled).toBe(false)
    expect(matrix.actionStates.navViewerExports.enabled).toBe(false)
    expect(matrix.actionStates.presentationMode.reasonIfDisabled).toContain('Projekt')
  })

  it('follows workflow-based mode suggestion and room preconditions', () => {
    const wallsMatrix = resolveAppShellActionMatrix({
      projectId: 'p1',
      compactLayout: false,
      workflowStep: 'walls',
    })
    const furnitureMatrix = resolveAppShellActionMatrix({
      projectId: 'p1',
      compactLayout: false,
      workflowStep: 'furniture',
    })

    expect(wallsMatrix.suggestedMode).toBe('wallCreate')
    expect(wallsMatrix.actionStates.viewElevation.enabled).toBe(false)
    expect(furnitureMatrix.suggestedMode).toBe('selection')
    expect(furnitureMatrix.actionStates.viewElevation.enabled).toBe(true)
    expect(furnitureMatrix.actionStates.viewSection.enabled).toBe(true)
  })

  it('disables split view actions in compact layout', () => {
    const matrix = resolveAppShellActionMatrix({
      projectId: 'p1',
      compactLayout: true,
      workflowStep: 'openings',
    })

    expect(matrix.actionStates.viewSplit.enabled).toBe(false)
    expect(matrix.actionStates.viewSplit.reasonIfDisabled).toContain('Split')
  })
})
