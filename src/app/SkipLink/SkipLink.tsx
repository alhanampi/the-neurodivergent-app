import { useTranslation } from 'react-i18next'
import { MAIN_CONTENT_ID } from './SkipLink.constants'
import { SkipLinkAnchor } from './SkipLink.styles'

// Must be the very first focusable element in the DOM to do its job — see
// App.tsx for placement (before Header). Pure rendering + a read-only
// translation hook, no state/effects, so it stays directly in the .tsx per
// CLAUDE.md's file-split exception for pure-read hooks.
export function SkipLink() {
  const { t } = useTranslation()
  return <SkipLinkAnchor href={`#${MAIN_CONTENT_ID}`}>{t('app.skipToContent')}</SkipLinkAnchor>
}
