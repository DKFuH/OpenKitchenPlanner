const PROJECT_PATH_PATTERN = /^\/projects\/([^/]+)/
const PROJECT_CONTEXT_QUERY_KEY = 'projectId'

export function projectIdFromRouteContext(pathname: string, search = ''): string | null {
  const pathMatch = pathname.match(PROJECT_PATH_PATTERN)
  if (pathMatch?.[1]) {
    return pathMatch[1]
  }

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const projectId = params.get(PROJECT_CONTEXT_QUERY_KEY)?.trim() ?? ''
  return projectId.length > 0 ? projectId : null
}

export function withProjectContext(targetPath: string, projectId: string | null): string {
  if (!projectId || !targetPath.startsWith('/settings')) {
    return targetPath
  }

  const [targetWithoutHash, hashFragment] = targetPath.split('#', 2)
  const [pathname, search = ''] = targetWithoutHash.split('?', 2)
  const params = new URLSearchParams(search)
  params.set(PROJECT_CONTEXT_QUERY_KEY, projectId)

  const nextPath = `${pathname}?${params.toString()}`
  return hashFragment ? `${nextPath}#${hashFragment}` : nextPath
}
