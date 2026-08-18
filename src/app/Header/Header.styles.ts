import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { layout } from '@/theme/tokens'

export const HeaderBar = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: ${layout.headerHeight}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 16px;
  background: ${({ theme }) => theme.palette.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  z-index: ${({ theme }) => theme.zIndex.appBar};
`

export const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: ${({ theme }) => theme.palette.text.primary};
`

export const BrandLogo = styled.img`
  width: 28px;
  height: 28px;
`

export const BrandName = styled.span`
  font-weight: 600;
  font-size: 1rem;
`

export const AccountArea = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`
