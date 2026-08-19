import styled from 'styled-components'
import { layout } from '@/theme/tokens'

export const TasksContainer = styled.div`
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

export const TaskGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`

export const AddTaskRow = styled.div`
  display: flex;
  justify-content: center;
`

export const EmptyState = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.palette.text.secondary};
`
