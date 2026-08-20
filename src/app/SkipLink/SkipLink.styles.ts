import styled from 'styled-components'

// Off-screen (not display:none/visibility:hidden, which would also pull it
// out of tab order) until it receives keyboard focus, then jumps into view
// above everything else — the standard "skip to content" pattern. A mouse
// user never sees it; a sighted keyboard user tabbing from a fresh page load
// gets an immediate way past the header (logo, account menu) straight to the
// tab's actual content, instead of having to tab through it every time.
export const SkipLinkAnchor = styled.a`
  position: absolute;
  top: -100%;
  left: 8px;
  z-index: 2000;
  padding: 8px 16px;
  background: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.contrastText};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  text-decoration: none;
  font-weight: 500;

  &:focus {
    top: 8px;
  }
`
