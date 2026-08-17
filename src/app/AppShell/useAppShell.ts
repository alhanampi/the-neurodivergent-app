import type { SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { TABS } from './AppShell.constants'
import { getActiveTabId } from './AppShell.utils'

export function useAppShell() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const activeTabId = getActiveTabId(location.pathname, TABS)

  const tabs = TABS.map((tab) => ({ ...tab, label: t(tab.labelKey) }))

  const handleTabChange = (_event: SyntheticEvent, nextTabId: string) => {
    const nextTab = TABS.find((tab) => tab.id === nextTabId)
    if (nextTab) {
      navigate(nextTab.path)
    }
  }

  return { tabs, activeTabId, handleTabChange }
}
