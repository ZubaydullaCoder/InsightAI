import type { ThemeConfig } from 'antd'

export const mahallaTheme: ThemeConfig = {
  token: {
    // Primary: reference blue
    colorPrimary: '#2563EB',
    // Backgrounds
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F1F5F9',
    colorBgElevated: '#FFFFFF',
    // Borders
    colorBorder: '#E2E8F0',
    colorBorderSecondary: '#CBD5E1',
    // Text
    colorText: '#1E293B',
    colorTextSecondary: '#64748B',
    colorTextPlaceholder: '#94A3B8',
    // Semantic
    colorWarning: '#F59E0B',
    colorSuccess: '#16A34A',
    colorError: '#DC2626',
    // Typography
    fontFamily: "'Inter', 'Outfit', sans-serif",
    // Geometry — softer rounded corners
    borderRadius: 10,
    // Shadows
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
    boxShadowSecondary: '0 4px 12px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
  },
}

export type CategoryKey = 'hokim' | 'water' | 'electricity' | 'gas' | 'waste'

// Category accent colors — aligned with reference design palette
export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  hokim:       '#7C3AED', // Purple-violet — Boshqalar (others) lane
  water:       '#2563EB', // Reference blue — Suv lane
  electricity: '#EA580C', // Reference orange — Elektr lane
  gas:         '#0D9488', // Reference teal/greenish blue — Gaz lane
  waste:       '#16A34A', // Reference green — Chiqindi lane
} as const

// Lighter tint backgrounds for lane icon chips (matches reference col-icon palette)
export const CATEGORY_LIGHT_COLORS: Record<CategoryKey, string> = {
  hokim:       '#F5F3FF', // purple-lt
  water:       '#EFF6FF', // blue-lt
  electricity: '#FFF5ED', // orange-lt
  gas:         '#F0FDFA', // teal-lt
  waste:       '#F0FDF4', // green-lt
} as const
