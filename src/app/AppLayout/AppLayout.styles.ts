import styled from 'styled-components'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
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

// MUI's default min-width (80px) per action doesn't leave room for longer
// translated labels (e.g. "Temporizadores") on narrow phones — 4 of them
// overflow the screen width. Let the label shrink and truncate instead.
export const NavAction = styled(BottomNavigationAction)`
  min-width: 0;
  padding-left: 4px;
  padding-right: 4px;

  & .MuiBottomNavigationAction-label {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.7rem;
  }
`
