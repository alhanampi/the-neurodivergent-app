import Typography from '@mui/material/Typography'
import type { ComingSoonPlaceholderProps } from './ComingSoonPlaceholder.interfaces'
import { PlaceholderContainer, IconWrapper } from './ComingSoonPlaceholder.styles'

// Shared placeholder used by every tab until its real feature iteration
// lands. Also serves as the reference pattern (thin .tsx + sibling
// .styles.ts/.interfaces.ts) new feature tabs should follow.
export function ComingSoonPlaceholder({
  title,
  description,
  icon: Icon,
}: ComingSoonPlaceholderProps) {
  return (
    <PlaceholderContainer>
      <IconWrapper>
        <Icon />
      </IconWrapper>
      <Typography variant="h5" component="h1">
        {title}
      </Typography>
      <Typography variant="body1">{description}</Typography>
    </PlaceholderContainer>
  )
}
