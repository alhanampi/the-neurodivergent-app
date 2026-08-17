import { BrowserRouter } from 'react-router-dom'
import { AppLayout } from './AppLayout/AppLayout'

// Root component: only wires up top-level providers. Everything else lives in
// AppLayout and below.
export function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
