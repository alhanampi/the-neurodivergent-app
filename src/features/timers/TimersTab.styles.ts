import styled from 'styled-components'

export const TimersContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px 16px 32px;
  max-width: 480px;
  margin: 0 auto;
`

export const IconWrapper = styled.div`
  font-size: 40px;
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

export const PresetRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: 100%;
`

export const CustomRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
`

export const MinutesStepper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

export const MinutesValue = styled.span`
  min-width: 3ch;
  text-align: center;
  font-variant-numeric: tabular-nums;
`

export const CountdownWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 220px;
  height: 220px;
`

export const CountdownText = styled.div`
  position: absolute;
  font-size: 40px;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.palette.text.primary};
`

export const ControlsRow = styled.div`
  display: flex;
  gap: 12px;
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
