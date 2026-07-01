import { type ReactNode, useState, useEffect } from 'react'
import { message, theme } from 'antd'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../api/auth.ts'
import { strings } from '../strings.ts'

interface AppShellProps {
  filterBar?: ReactNode       // Slot for FilterBar (Dashboard) or Segmented nav (Ops)
  children: ReactNode        // Slot for LaneGrid or Ops panel content
  showOpsLink?: boolean      // When true, renders an "Ops" nav button before the logout button
  contentOverflow?: 'hidden' | 'auto' // Content zone overflow; defaults to 'hidden' (dashboard)
  additionalLogoutQueryClients?: QueryClient[] // Extra isolated caches to clear on logout
}

// Logo SVG — 3-bar column chart matching reference design
function LogoIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ marginRight: 2 }}
    >
      <rect x="3" y="11" width="4" height="9" rx="1.5" fill="#2563EB" />
      <rect x="10" y="3" width="4" height="17" rx="1.5" fill="#2563EB" />
      <rect x="17" y="8" width="4" height="12" rx="1.5" fill="#2563EB" />
    </svg>
  )
}

// Logout icon SVG
function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function AppShell({
  filterBar,
  children,
  contentOverflow,
  additionalLogoutQueryClients = [],
}: AppShellProps) {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    function updateClock() {
      const now = new Date()
      const dd = String(now.getDate()).padStart(2, '0')
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const yyyy = now.getFullYear()
      const hh = String(now.getHours()).padStart(2, '0')
      const min = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')
      setTimeStr(`${dd}.${mm}.${yyyy} ${hh}:${min}:${ss}`)
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  async function handleLogout() {
    try {
      await logout()
      queryClient.clear()
      additionalLogoutQueryClients.forEach((client) => {
        if (client !== queryClient) client.clear()
      })
      navigate('/login', { replace: true })
    } catch {
      message.error(strings.app.logoutError)
    }
  }

  const isDashboardActive = location.pathname === '/'
  const isOpsActive = location.pathname.startsWith('/ops')

  // Helper for rendering nav links
  const renderNavLink = (
    label: string,
    isActive: boolean,
    icon: ReactNode,
    onClick: () => void,
    disabled = false
  ) => {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          border: isActive ? '1px solid #DBEAFE' : '1px solid transparent',
          borderRadius: 8,
          background: isActive ? '#EFF6FF' : 'transparent',
          fontSize: 13,
          fontWeight: 600,
          color: isActive ? '#2563EB' : '#64748B',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: token.fontFamily,
          transition: 'all 150ms ease',
          opacity: disabled ? 0.65 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isActive && !disabled) {
            e.currentTarget.style.background = '#F8FAFC'
            e.currentTarget.style.color = token.colorText
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive && !disabled) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#64748B'
          }
        }}
      >
        {icon}
        {label}
      </button>
    )
  }

  return (
    <div className="app-shell">
      {/* Header: logo + nav + actions */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: 60,
          zIndex: 10,
          background: '#FFFFFF',
          borderBottom: `1px solid ${token.colorBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        {/* Left: Logo: icon + wordmark */}
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 800,
            fontSize: 18,
            color: '#1E293B',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <LogoIcon />
          Insight AI
        </div>

        {/* Center: Navigation menu matching reference tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {renderNavLink(
            'Бошқарув панели',
            isDashboardActive,
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>,
            () => navigate('/')
          )}
          {renderNavLink(
            'Сигналлар',
            isOpsActive,
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>,
            () => navigate('/ops')
          )}
          {renderNavLink(
            'Таҳлил',
            false,
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>,
            () => void message.info('Таҳлил саҳифаси тез орада ишга тушади')
          )}
          {renderNavLink(
            'Ҳудудлар',
            false,
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>,
            () => void message.info('Ҳудудлар саҳифаси тез орада ишга тушади')
          )}
          {renderNavLink(
            'Созламалар',
            false,
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>,
            () => void message.info('Созламалар саҳифаси тез орада ишга тушади')
          )}
        </div>

        {/* Right: Notification Bell + Chiqish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Live Clock Pill */}
          {timeStr && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 8,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                fontSize: 13,
                fontWeight: 600,
                color: '#475569',
                fontFamily: token.fontFamily,
                fontVariantNumeric: 'tabular-nums',
                userSelect: 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{timeStr}</span>
            </div>
          )}

          {/* Notification Bell */}
          <div
            style={{
              position: 'relative',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
            onClick={() => void message.info('Сизда 12 та янги билдиришнома бор')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: 9,
                fontWeight: 800,
                borderRadius: 10,
                padding: '2px 4px',
                lineHeight: 1,
                minWidth: 16,
                textAlign: 'center',
                border: '2px solid #FFFFFF',
              }}
            >
              12
            </span>
          </div>

          {/* Logout button */}
          <button
            type="button"
            onClick={() => void handleLogout()}
            aria-label={strings.app.logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              border: `1px solid ${token.colorBorder}`,
              borderRadius: 8,
              background: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              fontFamily: token.fontFamily,
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F8FAFC'
              e.currentTarget.style.borderColor = '#CBD5E1'
              e.currentTarget.style.color = '#0F172A'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
              e.currentTarget.style.borderColor = token.colorBorder
              e.currentTarget.style.color = '#475569'
            }}
          >
            <LogoutIcon />
            {strings.app.logout}
          </button>
        </div>
      </div>

      {/* Filter Bar (Sub-header) Slot — placed directly below main header if provided */}
      {filterBar && (
        <div
          style={{
            background: '#FFFFFF',
            borderBottom: `1px solid ${token.colorBorder}`,
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            minHeight: 52,
            width: '100%',
          }}
        >
          {filterBar}
        </div>
      )}

      {/* Content zone — fills remaining viewport height */}
      <div
        style={{
          flex: 1,
          overflow: contentOverflow ?? 'hidden',
          background: token.colorBgLayout,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  )
}
