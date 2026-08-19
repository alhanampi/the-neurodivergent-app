import styled from 'styled-components'

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  background: ${({ theme }) => theme.palette.background.paper};
`

export const TaskFieldsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

// Column, not a single row — a step's title can run to two+ lines (it's a
// multiline field now, see PlanPreviewCard.tsx), so priority/minutes/delete
// live on their own row below it instead of squeezing the title into one
// line and clipping it.
export const StepRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.palette.divider};
  }
`

export const StepTitleField = styled.div`
  width: 100%;
`

export const StepUtilityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const PomodoroEstimate = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.text.secondary};
`

export const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`
