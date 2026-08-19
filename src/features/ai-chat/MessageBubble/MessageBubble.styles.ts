import styled from 'styled-components'

export const BubbleRow = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
`

export const Bubble = styled.div<{ $isUser: boolean }>`
  max-width: 85%;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ $isUser, theme }) =>
    $isUser ? theme.palette.primary.main : theme.palette.background.paper};
  color: ${({ $isUser, theme }) =>
    $isUser ? theme.palette.primary.contrastText : theme.palette.text.primary};
  border: 1px solid ${({ $isUser, theme }) => ($isUser ? 'transparent' : theme.palette.divider)};
  overflow-wrap: break-word;

  & p {
    margin: 0 0 8px;
  }
  & p:last-child {
    margin-bottom: 0;
  }
  & ul,
  & ol {
    margin: 0 0 8px;
    padding-left: 20px;
  }
`
