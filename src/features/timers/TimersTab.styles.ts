import styled from 'styled-components'
import { layout } from '@/theme/tokens'

// Fits the composer + a handful of timer cards within one screen (the ask
// that drove this layout: no giant fixed-height countdown circle, compact
// rows instead) while still scrolling gracefully — via the inherited
// ContentArea overflow — once there are enough timers/history entries to
// need it.
export const TimersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
  min-height: calc(100dvh - ${layout.headerHeight + layout.bottomNavHeight}px);
`

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`

export const IconWrapper = styled.div`
  font-size: 32px;
  line-height: 1;
  color: ${({ theme }) => theme.palette.primary.main};
`

export const NotificationBanner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.palette.background.default};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  text-align: center;
`

export const ComposerSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
`

export const PresetRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: 100%;
`

export const TimersList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
`

export const TimerCard = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.palette.divider};
`

export const TimerCardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
`

export const TimerCardName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.palette.text.primary};
`

export const TimerCardPhaseTag = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.text.secondary};
`

export const TimerCardTime = styled.span`
  font-variant-numeric: tabular-nums;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.palette.text.primary};
  white-space: nowrap;
`

export const HistorySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`

export const HistoryList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
`

export const HistoryItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.palette.divider};
`

export const HistoryItemLabel = styled.span`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.palette.text.primary};
`

export const HistoryItemMeta = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.text.secondary};
`

export const HistoryEmpty = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.palette.text.secondary};
`
