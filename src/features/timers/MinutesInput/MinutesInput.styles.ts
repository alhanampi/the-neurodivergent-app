import styled from 'styled-components'

export const MinutesInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

export const MinutesUnit = styled.span`
  color: ${({ theme }) => theme.palette.text.secondary};
  font-size: 0.85rem;
  white-space: nowrap;
`
