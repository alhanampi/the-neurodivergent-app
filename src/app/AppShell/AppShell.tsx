import { Routes, Route } from 'react-router-dom'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import { TimersTab } from '@/features/timers/TimersTab'
import { AiChatTab } from '@/features/ai-chat/AiChatTab'
import { DashboardTab } from '@/features/dashboard/DashboardTab'
import { SettingsTab } from '@/features/settings/SettingsTab'
import { useAppShell } from './useAppShell'
import { ShellContainer, ContentArea, NavContainer } from './AppShell.styles'

export function AppShell() {
  const { tabs, activeTabId, handleTabChange } = useAppShell()

  return (
    <ShellContainer>
      <ContentArea>
        <Routes>
          <Route path="/" element={<TimersTab />} />
          <Route path="/chat" element={<AiChatTab />} />
          <Route path="/dashboard" element={<DashboardTab />} />
          <Route path="/settings" element={<SettingsTab />} />
        </Routes>
      </ContentArea>

      <NavContainer>
        <BottomNavigation value={activeTabId} onChange={handleTabChange} showLabels>
          {tabs.map((tab) => (
            <BottomNavigationAction
              key={tab.id}
              value={tab.id}
              label={tab.label}
              icon={<tab.icon size={22} />}
            />
          ))}
        </BottomNavigation>
      </NavContainer>
    </ShellContainer>
  )
}
