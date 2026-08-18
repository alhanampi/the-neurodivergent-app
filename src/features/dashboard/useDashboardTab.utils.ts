import type { TimerSession } from './DashboardTab.interfaces'

type GetToken = () => Promise<string | null>

// Swallows failures on purpose, same convention as useTimersTab.utils.ts's
// fetchTimerHistory: no /api backend under plain `npm run dev` (use
// `vercel dev`), and a failed dashboard fetch should degrade to an empty
// state, not crash the tab.
export async function fetchTimerHistoryInRange(
  startDate: Date,
  endDate: Date,
  getToken: GetToken,
): Promise<TimerSession[]> {
  try {
    const token = await getToken()
    if (!token) return []

    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
    const response = await fetch(`/api/timer-sessions?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return []

    const body = (await response.json()) as { sessions?: TimerSession[] }
    return body.sessions ?? []
  } catch {
    return []
  }
}
