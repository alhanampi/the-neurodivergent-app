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

export const TaskList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
`

export const TaskRow = styled.li<{ $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  opacity: ${({ $completed }) => ($completed ? 0.6 : 1)};
`

export const TaskTitle = styled.span<{ $completed: boolean }>`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.palette.text.primary};
  text-decoration: ${({ $completed }) => ($completed ? 'line-through' : 'none')};
`

export const TaskMinutes = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.text.secondary};
  white-space: nowrap;
`

export const EmptyState = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.palette.text.secondary};
`
