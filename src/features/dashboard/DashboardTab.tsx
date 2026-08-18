import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material/styles'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { BarChart } from '@mui/x-charts/BarChart'
import { FiBarChart2 } from 'react-icons/fi'
import { getPresetTranslationKey } from '@/features/timers/TimersTab.utils'
import { useDashboardTab } from './useDashboardTab'
import { CHART_HEIGHT, DATE_RANGE_PRESETS } from './DashboardTab.constants'
import { formatBucketLabel, splitDurationParts } from './DashboardTab.utils'
import {
  ChartCard,
  ChartScrollArea,
  DashboardContainer,
  EmptyState,
  FilterRow,
  HeaderRow,
  IconWrapper,
  ResultsArea,
  StatLabel,
  StatTile,
  StatValue,
  StatsRow,
} from './DashboardTab.styles'
import type { DateRangePresetId } from './DashboardTab.interfaces'

export function DashboardTab() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const {
    rangePresetId,
    setRangePresetId,
    isLoading,
    hasLoadedOnce,
    stats,
    timeSeries,
    presetBreakdown,
  } = useDashboardTab()

  const { hours, minutes } = splitDurationParts(stats.totalSeconds)
  const totalTimeLabel =
    hours > 0 && minutes > 0
      ? t('dashboard.duration.hoursMinutes', { hours, minutes })
      : hours > 0
        ? t('dashboard.duration.hoursOnly', { hours })
        : t('dashboard.duration.minutesOnly', { minutes })

  const timeSeriesDataset = timeSeries.map((bucket) => ({
    bucketLabel: formatBucketLabel(bucket.bucketStart, bucket.granularity, i18n.language),
    totalMinutes: bucket.totalMinutes,
  }))

  const presetBreakdownDataset = presetBreakdown.map((slice) => ({
    presetLabel: t(getPresetTranslationKey(slice.presetId)),
    totalMinutes: slice.totalMinutes,
  }))

  const isEmpty = hasLoadedOnce && !isLoading && stats.sessionsCount === 0

  return (
    <DashboardContainer>
      <HeaderRow>
        <IconWrapper>
          <FiBarChart2 />
        </IconWrapper>
        <Typography variant="h5" component="h1">
          {t('dashboard.title')}
        </Typography>
      </HeaderRow>

      <FilterRow>
        <ToggleButtonGroup
          value={rangePresetId}
          exclusive
          size="small"
          onChange={(_event, next: DateRangePresetId | null) => {
            if (next) setRangePresetId(next)
          }}
        >
          {DATE_RANGE_PRESETS.map((presetId) => (
            <ToggleButton key={presetId} value={presetId}>
              {t(`dashboard.rangePresets.${presetId}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FilterRow>

      {!hasLoadedOnce && isLoading && <EmptyState>{t('dashboard.loading')}</EmptyState>}

      {isEmpty && <EmptyState>{t('dashboard.empty')}</EmptyState>}

      {hasLoadedOnce && stats.sessionsCount > 0 && (
        <ResultsArea $isLoading={isLoading}>
          <StatsRow>
            <StatTile>
              <StatValue>{totalTimeLabel}</StatValue>
              <StatLabel>{t('dashboard.stats.totalTime')}</StatLabel>
            </StatTile>
            <StatTile>
              <StatValue>{stats.sessionsCount}</StatValue>
              <StatLabel>{t('dashboard.stats.sessions')}</StatLabel>
            </StatTile>
            <StatTile>
              <StatValue>{Math.round(stats.completionRate * 100)}%</StatValue>
              <StatLabel>{t('dashboard.stats.completionRate')}</StatLabel>
            </StatTile>
          </StatsRow>

          <ChartCard>
            <Typography variant="subtitle2">{t('dashboard.charts.timeSpentTitle')}</Typography>
            <ChartScrollArea>
              <BarChart
                dataset={timeSeriesDataset}
                xAxis={[{ scaleType: 'band', dataKey: 'bucketLabel' }]}
                series={[
                  {
                    dataKey: 'totalMinutes',
                    label: t('dashboard.charts.minutesSeriesLabel'),
                    color: theme.palette.primary.main,
                    valueFormatter: (value) =>
                      value === null
                        ? null
                        : t('dashboard.charts.minutesValue', { minutes: value }),
                  },
                ]}
                height={CHART_HEIGHT}
                borderRadius={4}
                grid={{ horizontal: true }}
                hideLegend
              />
            </ChartScrollArea>
          </ChartCard>

          {presetBreakdownDataset.length > 0 && (
            <ChartCard>
              <Typography variant="subtitle2">{t('dashboard.charts.byPresetTitle')}</Typography>
              <ChartScrollArea>
                <BarChart
                  dataset={presetBreakdownDataset}
                  layout="horizontal"
                  yAxis={[{ scaleType: 'band', dataKey: 'presetLabel' }]}
                  series={[
                    {
                      dataKey: 'totalMinutes',
                      label: t('dashboard.charts.minutesSeriesLabel'),
                      color: theme.palette.primary.main,
                      valueFormatter: (value) =>
                        value === null
                          ? null
                          : t('dashboard.charts.minutesValue', { minutes: value }),
                    },
                  ]}
                  height={CHART_HEIGHT}
                  borderRadius={4}
                  grid={{ vertical: true }}
                  hideLegend
                />
              </ChartScrollArea>
            </ChartCard>
          )}
        </ResultsArea>
      )}
    </DashboardContainer>
  )
}
