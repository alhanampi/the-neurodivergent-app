import { Routes, Route } from 'react-router-dom'
import BottomNavigation from '@mui/material/BottomNavigation'
import { TimersTab } from '@/features/timers/TimersTab'
import { AiChatTab } from '@/features/ai-chat/AiChatTab'
import { DashboardTab } from '@/features/dashboard/DashboardTab'
import { SettingsTab } from '@/features/settings/SettingsTab'
import { useAppLayout } from './useAppLayout'
import { ShellContainer, ContentArea, NavContainer, NavAction } from './AppLayout.styles'

export function AppLayout() {
  const { tabs, activeTabId, handleTabChange } = useAppLayout()

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
