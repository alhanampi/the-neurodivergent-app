import styled from 'styled-components'
import { layout } from '@/theme/tokens'

// Same shape as TimersContainer/DashboardContainer — a MessagesArea below
// grows and scrolls internally (flex: 1 1 auto + overflow-y: auto) rather
// than the whole page scrolling, so the header and composer stay put.
export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
  height: calc(100dvh - ${layout.headerHeight + layout.bottomNavHeight}px);
`

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

export const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1 1 auto;
`

export const IconWrapper = styled.div`
  font-size: 28px;
  line-height: 1;
  color: ${({ theme }) => theme.palette.primary.main};
`

export const MessagesArea = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  min-height: 0;
`

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  gap: 4px;
  text-align: center;
  color: ${({ theme }) => theme.palette.text.secondary};
  padding: 32px 16px;
`

export const TypingIndicator = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.text.secondary};
`

export const PlanActionsRow = styled.div`
  display: flex;
  justify-content: center;
`
