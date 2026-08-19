import styled from 'styled-components'

export const DrawerContent = styled.div`
  width: 280px;
  max-width: 80vw;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`

export const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`

export const GroupLabel = styled.p`
  margin: 12px 12px 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: ${({ theme }) => theme.palette.text.secondary};
`

export const ConversationRow = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  background: ${({ $active, theme }) => ($active ? theme.palette.action.selected : 'transparent')};

  &:hover {
    background: ${({ theme }) => theme.palette.action.hover};
  }
`

export const ConversationTitle = styled.span`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.palette.text.primary};
  cursor: pointer;
  padding: 4px 0;
`

export const SidebarEmpty = styled.p`
  padding: 16px;
  text-align: center;
  color: ${({ theme }) => theme.palette.text.secondary};
`
