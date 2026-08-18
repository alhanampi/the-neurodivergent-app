import type { TabConfig, TabId } from './AppLayout.interfaces'

/** Maps the current URL path to the tab that should show as active, or null
 * when the current route isn't one of the bottom-nav tabs at all (e.g.
 * Settings, reached via the header) — the bar should show nothing selected
 * rather than incorrectly highlighting an unrelated tab. */
export function getActiveTabId(pathname: string, tabs: TabConfig[]): TabId | null {
  return tabs.find((tab) => tab.path === pathname)?.id ?? null
}
