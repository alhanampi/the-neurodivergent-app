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

export const StepRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const StepTitleField = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`

export const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`
