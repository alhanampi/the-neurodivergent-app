import styled from 'styled-components'

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100dvh;
  width: 100%;
  background: ${({ theme }) => theme.palette.background.default};
`
