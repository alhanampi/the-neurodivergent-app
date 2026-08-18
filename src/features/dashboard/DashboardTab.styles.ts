import styled from 'styled-components'
import { layout } from '@/theme/tokens'

export const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
  min-height: calc(100dvh - ${layout.headerHeight + layout.bottomNavHeight}px);
`

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`

export const IconWrapper = styled.div`
  font-size: 32px;
  line-height: 1;
  color: ${({ theme }) => theme.palette.primary.main};
`

export const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: 100%;
`

// Dimmed (not unmounted/skeletoned) while a refetch is in flight — avoids
// the "skeleton flash on refetch" anti-pattern: the previous range's
// numbers stay visible and legible, just faded, until the new ones land.
export const ResultsArea = styled.div<{ $isLoading: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  opacity: ${({ $isLoading }) => ($isLoading ? 0.5 : 1)};
  transition: opacity 0.15s ease;
`

export const StatsRow = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`

export const StatTile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 0;
  min-width: 0;
  padding: 12px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.palette.divider};
`

export const StatValue = styled.span`
  font-size: 1.4rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary};
`

export const StatLabel = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.text.secondary};
`

export const ChartCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.palette.divider};
`

// Wide bucket charts (e.g. months of "All time" data) scroll horizontally
// inside their own card rather than squeezing bars past legibility.
export const ChartScrollArea = styled.div`
  width: 100%;
  overflow-x: auto;
`

export const EmptyState = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.palette.text.secondary};
`
