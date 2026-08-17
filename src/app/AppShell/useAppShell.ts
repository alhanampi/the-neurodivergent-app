import { useLocation, useNavigate } from 'react-router-dom'
import type { SyntheticEvent } from 'react'
import { TABS } from './AppShell.constants'
import { getActiveTabId } from './AppShell.utils'

export function useAppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTabId = getActiveTabId(location.pathname, TABS)

  const handleTabChange = (_event: SyntheticEvent, nextTabId: string) => {
    const nextTab = TABS.find((tab) => tab.id === nextTabId)
    if (nextTab) {
      navigate(nextTab.path)
    }
  }

  return { tabs: TABS, activeTabId, handleTabChange }
}
