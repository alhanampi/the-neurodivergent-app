import { useNavigate } from 'react-router-dom'

export function useHeader() {
  const navigate = useNavigate()

  const goToSettings = () => navigate('/settings')

  return { goToSettings }
}
