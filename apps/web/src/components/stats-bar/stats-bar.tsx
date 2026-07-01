// apps/web/src/components/stats-bar/stats-bar.tsx
import { theme } from 'antd'
import type { Signal } from '../../api/signals.ts'
import { formatMahallaLabel } from '../../utils/mahalla-label.ts'

interface StatsBarProps {
  signals: Signal[]
}

const CATEGORY_LABELS: Record<string, string> = {
  water: 'Сув',
  electricity: 'Электр',
  gas: 'Газ',
  waste: 'Чиқинди',
}

// Format number with thousands separator (e.g., 1248 -> 1 248)
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\n))/g, ' ')
}

export function StatsBar({ signals }: StatsBarProps) {
  const { token } = theme.useToken()

  // 1. Total signals
  const totalCount = signals.length

  // 2. Most active category
  const categoryCounts: Record<string, number> = {}
  signals.forEach((s) => {
    categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1
  })
  let activeCategory = '-'
  let activeCategoryCount = 0
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    if (count > activeCategoryCount) {
      activeCategoryCount = count
      activeCategory = CATEGORY_LABELS[cat] || cat
    }
  })
  const categoryPercentage = totalCount > 0 ? Math.round((activeCategoryCount / totalCount) * 100) : 0

  // 3. Most active mahalla
  const mahallaCounts: Record<string, { count: number; name: string }> = {}
  signals.forEach((s) => {
    const name = formatMahallaLabel(s.mahallaName).replace(/\s*МФЙ$/i, '')
    if (!mahallaCounts[s.mahallaId]) {
      mahallaCounts[s.mahallaId] = { count: 0, name }
    }
    mahallaCounts[s.mahallaId].count++
  })
  let activeMahalla = '-'
  let activeMahallaCount = 0
  Object.values(mahallaCounts).forEach(({ count, name }) => {
    if (count > activeMahallaCount) {
      activeMahallaCount = count
      activeMahalla = name
    }
  })
  const mahallaPercentage = totalCount > 0 ? Math.round((activeMahallaCount / totalCount) * 100) : 0

  // 4. Last activity
  let lastActivityTime = '-'
  let lastActivityDate = ''
  if (signals.length > 0) {
    const latestSignal = [...signals].sort(
      (a, b) => new Date(b.telegramTimestamp).getTime() - new Date(a.telegramTimestamp).getTime()
    )[0]
    if (latestSignal) {
      const date = new Date(latestSignal.telegramTimestamp)
      // Shift to UTC+5 for correct local display
      const utc5 = new Date(date.getTime() + 5 * 3600 * 1000)
      const hh = String(utc5.getUTCHours()).padStart(2, '0')
      const mm = String(utc5.getUTCMinutes()).padStart(2, '0')
      lastActivityTime = `${hh}:${mm}`

      const day = String(utc5.getUTCDate()).padStart(2, '0')
      const month = String(utc5.getUTCMonth() + 1).padStart(2, '0')
      const year = utc5.getUTCFullYear()
      lastActivityDate = `${day}.${month}.${year}`
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
        padding: '0 16px',
      }}
    >
      {/* 1. Total Signals Card */}
      <div
        style={{
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {/* Chat/Message Icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 8H17M7 12H13"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: token.colorTextSecondary, fontWeight: 500 }}>
            Жами сигналлар
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: token.colorText, margin: '2px 0' }}>
            {formatNumber(totalCount)}
          </div>
          <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 13 }}>↑</span> 12% ўтган 24 соатга нисбатан
          </div>
        </div>
      </div>

      {/* 2. Most Active Category Card */}
      <div
        style={{
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {/* Water drop Icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2C12 2 6 8.5 6 12.5C6 14.0913 6.63214 15.6174 7.75736 16.7426C8.88258 17.8679 10.4087 18.5 12 18.5C13.5913 18.5 15.1174 17.8679 16.2426 16.7426C17.3679 15.6174 18 14.0913 18 12.5C18 8.5 12 2 12 2Z"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: token.colorTextSecondary, fontWeight: 500 }}>
            Энг фаол категория
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: token.colorText, margin: '2px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {activeCategory}
          </div>
          <div style={{ fontSize: 11, color: token.colorTextSecondary }}>
            {totalCount > 0 ? (
              <>
                <span style={{ color: '#2563EB', fontWeight: 600 }}>{activeCategoryCount} сигнал</span> ({categoryPercentage}%)
              </>
            ) : (
              'Маълумот йўқ'
            )}
          </div>
        </div>
      </div>

      {/* 3. Most Active Mahalla Card */}
      <div
        style={{
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#F0FDF4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {/* Map pin Icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
              stroke="#16A34A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"
              stroke="#16A34A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: token.colorTextSecondary, fontWeight: 500 }}>
            Энг фаол маҳалла
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: token.colorText, margin: '2px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {activeMahalla}
          </div>
          <div style={{ fontSize: 11, color: token.colorTextSecondary }}>
            {totalCount > 0 ? (
              <>
                <span style={{ color: '#16A34A', fontWeight: 600 }}>{activeMahallaCount} сигнал</span> ({mahallaPercentage}%)
              </>
            ) : (
              'Маълумот йўқ'
            )}
          </div>
        </div>
      </div>

      {/* 4. Last Activity Card */}
      <div
        style={{
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#FFF5ED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {/* Clock Icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="#EA580C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 6V12L16 14"
              stroke="#EA580C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: token.colorTextSecondary, fontWeight: 500 }}>
            Сўнгги фаоллик
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: token.colorText, margin: '2px 0' }}>
            {lastActivityTime}
          </div>
          <div style={{ fontSize: 11, color: token.colorTextSecondary }}>
            {lastActivityDate || 'Маълумот йўқ'}
          </div>
        </div>
      </div>
    </div>
  )
}
