import styled from 'styled-components'
import { layout } from '@/theme/tokens'

export const SignInContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  min-height: 100dvh;
  padding: ${layout.headerHeight + 24}px 24px 24px;
  background: ${({ theme }) => theme.palette.background.default};
`

export const BrandTagline = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.text.secondary};
  text-align: center;
`
