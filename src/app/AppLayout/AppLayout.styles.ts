import styled from 'styled-components'
import Paper from '@mui/material/Paper'

export const ShellContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
`

// 56px matches MUI's default BottomNavigation height, so content never sits
// underneath the fixed nav bar.
export const ContentArea = styled.main`
  flex: 1 1 auto;
  overflow-y: auto;
  padding-bottom: 56px;
`

export const NavContainer = styled(Paper).attrs({ elevation: 3 })`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
`
