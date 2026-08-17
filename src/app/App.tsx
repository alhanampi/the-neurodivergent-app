import { BrowserRouter } from 'react-router-dom'
import { AppShell } from './AppShell/AppShell'

// Root component: only wires up top-level providers. Everything else lives in
// AppShell and below.
export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
