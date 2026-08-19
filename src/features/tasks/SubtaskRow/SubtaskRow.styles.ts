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

export const TitleLine = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
`

// Full title, always — no ellipsis/nowrap. Priority/minutes/delete moved to
// their own UtilityLine below specifically so a long title has the whole
// row width to wrap into instead of being squeezed by those controls.
export const TitleButton = styled.button`
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
  white-space: normal;
  overflow-wrap: break-word;
  background: none;
  border: none;
  padding: 6px 0 0;
  cursor: pointer;
  font: inherit;
  color: ${({ theme }) => theme.palette.text.primary};
`

export const CompletedTitle = styled.span<{ $completed: boolean }>`
  text-decoration: ${({ $completed }) => ($completed ? 'line-through' : 'none')};
`

export const UtilityLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 42px; /* aligns under the title, past the checkbox */
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
