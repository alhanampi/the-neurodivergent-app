import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import BottomNavigation from '@mui/material/BottomNavigation'
import CircularProgress from '@mui/material/CircularProgress'
import { visuallyHidden } from '@mui/utils'
import { useTranslation } from 'react-i18next'
import { useAppLayout } from './useAppLayout'
import {
  ShellContainer,
  ContentArea,
  NavContainer,
  NavAction,
  RouteLoadingFallback,
} from './AppLayout.styles'

// Each tab is its own lazy chunk instead of one bundled into the main
// download — MUI + Clerk + i18next already push the shared bundle past
// 1.3MB raw (see vite.config.ts's chunkSizeWarningLimit note), and every tab
// pulls in its own heavy dependency someone might never open in a given
// session (@mui/x-charts for Dashboard, react-markdown/remark-gfm for Chat).
// A signed-in user always lands on Timers first (the "/" route) — that one
// chunk is what actually gates first paint after sign-in; the rest load on
// demand when a tab is tapped. Each import().then() adapts the named export
// (TimersTab, etc.) to the default export React.lazy requires, without
// touching the tab components themselves.
const TimersTab = lazy(() =>
  import('@/features/timers/TimersTab').then((m) => ({ default: m.TimersTab })),
)
const AiChatTab = lazy(() =>
  import('@/features/ai-chat/AiChatTab').then((m) => ({ default: m.AiChatTab })),
)
const TasksTab = lazy(() =>
  import('@/features/tasks/TasksTab').then((m) => ({ default: m.TasksTab })),
)
const DashboardTab = lazy(() =>
  import('@/features/dashboard/DashboardTab').then((m) => ({ default: m.DashboardTab })),
)
const SettingsTab = lazy(() =>
  import('@/features/settings/SettingsTab').then((m) => ({ default: m.SettingsTab })),
)

export function AppLayout() {
  const { tabs, activeTabId, handleTabChange } = useAppLayout()
  const { t } = useTranslation()

  return (
    <ShellContainer>
      <ContentArea>
        <Suspense
          fallback={
            <RouteLoadingFallback>
              <CircularProgress aria-hidden="true" />
              <span style={visuallyHidden}>{t('app.loadingTab')}</span>
            </RouteLoadingFallback>
          }
        >
          <Routes>
            <Route path="/" element={<TimersTab />} />
            <Route path="/chat" element={<AiChatTab />} />
            <Route path="/tasks" element={<TasksTab />} />
            <Route path="/dashboard" element={<DashboardTab />} />
            <Route path="/settings" element={<SettingsTab />} />
          </Routes>
        </Suspense>
      </ContentArea>

      <NavContainer>
        <BottomNavigation value={activeTabId} onChange={handleTabChange} showLabels>
          {tabs.map((tab) => (
            <NavAction
              key={tab.id}
              value={tab.id}
              label={tab.label}
              icon={<tab.icon size={20} />}
            />
          ))}
        </BottomNavigation>
      </NavContainer>
    </ShellContainer>
  )
}
