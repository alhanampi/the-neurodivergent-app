import { useLocation, useNavigate } from 'react-router-dom'

export function useHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const isSettingsActive = location.pathname === '/settings'

  const goToSettings = () => navigate('/settings')

  return { goToSettings, isSettingsActive }
}
