import styled from 'styled-components'

export const Row = styled.li<{ $completed: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  opacity: ${({ $completed }) => ($completed ? 0.6 : 1)};
`

export const HeaderLine = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

export const TitleButton = styled.button`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
  color: ${({ theme }) => theme.palette.text.primary};
`

export const CompletedTitle = styled.span<{ $completed: boolean }>`
  text-decoration: ${({ $completed }) => ($completed ? 'line-through' : 'none')};
`

export const SubtaskMinutes = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.text.secondary};
  white-space: nowrap;
`

export const TimerPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 4px 4px;
`

export const TimerControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`

export const Countdown = styled.span`
  font-variant-numeric: tabular-nums;
  font-size: 1.1rem;
  min-width: 3.5ch;
  text-align: center;
  color: ${({ theme }) => theme.palette.text.primary};
`

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`
