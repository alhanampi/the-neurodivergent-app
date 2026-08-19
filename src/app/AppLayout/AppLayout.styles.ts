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

// Shown briefly while a lazy-loaded tab's chunk downloads (see AppLayout.tsx's
// Suspense boundary) — fills the same space the tab itself will occupy rather
// than the whole viewport, so switching tabs doesn't cover the header/nav.
// <output> (not a plain <div role="status">) carries an implicit
// role="status"/aria-live="polite" on its own — oxlint's jsx-a11y rule flags
// the role-on-div spelling in favor of the semantic element that already
// means the same thing.
export const RouteLoadingFallback = styled.output`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40dvh;
  width: 100%;
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
