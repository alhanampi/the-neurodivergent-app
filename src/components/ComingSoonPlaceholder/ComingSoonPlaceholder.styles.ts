import styled from 'styled-components'

export const PlaceholderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 60vh;
  padding: 24px;
  text-align: center;
  color: ${({ theme }) => theme.palette.text.secondary};
`

export const IconWrapper = styled.div`
  font-size: 48px;
  line-height: 1;
  color: ${({ theme }) => theme.palette.primary.main};
`
