import styled from 'styled-components'

export const SignInContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  min-height: 100dvh;
  padding: 24px;
  background: ${({ theme }) => theme.palette.background.default};
`

export const BrandTitle = styled.h1`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary};
  text-align: center;
`

export const BrandTagline = styled.p`
  margin: -16px 0 0;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.text.secondary};
  text-align: center;
`
