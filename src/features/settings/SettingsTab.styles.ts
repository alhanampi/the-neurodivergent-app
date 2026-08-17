import styled from 'styled-components'

export const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  min-height: 60vh;
  padding: 32px 24px;
  text-align: center;
  color: ${({ theme }) => theme.palette.text.secondary};
`

export const IconWrapper = styled.div`
  font-size: 48px;
  line-height: 1;
  color: ${({ theme }) => theme.palette.primary.main};
`

export const SettingsSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`
