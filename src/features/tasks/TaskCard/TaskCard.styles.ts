import styled from 'styled-components'

export const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.palette.background.default};
  border: 1px solid ${({ theme }) => theme.palette.divider};
`

export const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
`

export const TitleColumn = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`

export const CollapseButton = styled.button`
  background: none;
  border: none;
  padding: 4px 0 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.palette.text.secondary};
`

export const Description = styled.p`
  margin: 2px 0 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.text.secondary};
`

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

export const TotalMinutes = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.text.secondary};
`

export const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

export const ProgressBarWrapper = styled.div`
  flex: 1 1 auto;
`

export const ProgressLabel = styled.span`
  font-size: 0.8rem;
  min-width: 3ch;
  text-align: right;
  color: ${({ theme }) => theme.palette.text.secondary};
`

export const SubtaskList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
`

export const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`
