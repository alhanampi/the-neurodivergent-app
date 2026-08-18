import styled from 'styled-components'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Paper from '@mui/material/Paper'
import { layout } from '@/theme/tokens'

export const ShellContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
`

// Padding-top clears the fixed header (src/app/Header), padding-bottom
// clears the fixed bottom nav below, so content never sits under either.
export const ContentArea = styled.main`
  flex: 1 1 auto;
  overflow-y: auto;
  padding-top: ${layout.headerHeight}px;
  padding-bottom: ${layout.bottomNavHeight}px;
`

export const NavContainer = styled(Paper).attrs({ elevation: 3 })`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
`

// MUI's default min-width (80px) per action doesn't leave room for longer
// translated labels on narrow phones — 4 of them overflow the screen width
// (this is what pushed "Temporizadores" out in Spanish, since fixed by using
// the shorter "Timers" loanword — see i18n.locales/es/common.json). Keep this
// as a safety net for whichever label ends up longest in future languages.
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
