import type { TabConfig, TabId } from './AppLayout.interfaces'

/** Maps the current URL path to the tab that should show as active. Falls
 * back to the first tab if nothing matches, rather than showing no selection. */
export function getActiveTabId(pathname: string, tabs: TabConfig[]): TabId {
  const match = tabs.find((tab) => tab.path === pathname)
  return match?.id ?? tabs[0].id
}
