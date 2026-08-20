import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeModeProvider } from '@/theme/ThemeModeProvider/ThemeModeProvider'
import { MAIN_CONTENT_ID } from './SkipLink.constants'
import { SkipLink } from './SkipLink'

describe('SkipLink', () => {
  it('links to the main content region', () => {
    render(
      <ThemeModeProvider>
        <SkipLink />
      </ThemeModeProvider>,
    )

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      `#${MAIN_CONTENT_ID}`,
    )
  })
})
