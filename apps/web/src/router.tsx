import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthGuard } from './components/auth-guard.tsx'

const LoginPage = lazy(() =>
  import('./pages/login-page.tsx').then(module => ({ default: module.LoginPage })),
)
const DashboardPage = lazy(() =>
  import('./pages/dashboard-page.tsx').then(module => ({ default: module.DashboardPage })),
)
const OpsPage = lazy(() =>
  import('./pages/ops-page.tsx').then(module => ({ default: module.OpsPage })),
)

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        color: '#64748B',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      Loading...
    </div>
  )
}

function lazyRoute(element: JSX.Element) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={lazyRoute(<LoginPage />)} />
      <Route
        path="/"
        element={
          <AuthGuard>
            {lazyRoute(<DashboardPage />)}
          </AuthGuard>
        }
      />
      {/* /ops is server-side guarded only (NODE_ENV + OPS_ENABLED + OPS_SECRET) - no AuthGuard here */}
      <Route path="/ops" element={lazyRoute(<OpsPage />)} />
    </Routes>
  )
}
