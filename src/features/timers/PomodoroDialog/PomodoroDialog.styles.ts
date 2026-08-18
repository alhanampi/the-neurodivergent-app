import styled from 'styled-components'

export const PhaseRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;

  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  }
`

export const PhaseLabel = styled.span`
  color: ${({ theme }) => theme.palette.text.primary};
`
