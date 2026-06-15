// apps/web/src/api/health.ts
// Intentional frontend API-boundary type — do NOT import from apps/server
import { useQuery } from '@tanstack/react-query'

export interface DashboardHealthStatus {
  lastBatchAt: string | null // ISO 8601 UTC
  status: 'current' | 'delayed'
}

async function fetchHealth(): Promise<DashboardHealthStatus> {
  const res = await fetch('/api/health', {
    credentials: 'same-origin',
  })

  if (!res.ok) {
    throw new Error(`GET /api/health failed: ${res.status}`)
  }

  return res.json() as Promise<DashboardHealthStatus>
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 60000,
  })
}
