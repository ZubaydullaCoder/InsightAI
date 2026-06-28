import type { CategoryKey } from '../theme.ts'

interface CategoryIconProps {
  category: CategoryKey
  color: string
  size?: number
}

export function CategoryIcon({ category, color, size = 16 }: CategoryIconProps) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    fill: 'none',
    'aria-hidden': true,
  } as const

  switch (category) {
    case 'hokim':
      return (
        <svg {...commonProps}>
          <path d="M3 18V8L10 2L17 8V18H13V13H7V18H3Z" fill={color} opacity=".85" />
        </svg>
      )
    case 'water':
      return (
        <svg {...commonProps}>
          <path
            d="M10 2C10 2 4 8.5 4 12.5C4 15.537 6.686 18 10 18C13.314 18 16 15.537 16 12.5C16 8.5 10 2 10 2Z"
            fill={color}
            opacity=".9"
          />
        </svg>
      )
    case 'electricity':
      return (
        <svg {...commonProps}>
          <path d="M11 2L4 11H10L9 18L16 9H10L11 2Z" fill={color} />
        </svg>
      )
    case 'gas':
      return (
        <svg {...commonProps}>
          <path
            d="M10 2C8 5 6 7 6 10.5C6 13.538 7.79 16 10 16C12.21 16 14 13.538 14 10.5C14 9 13.5 8 13 7C12 9 11 9.5 10 9C10 6.5 10 4.5 10 2Z"
            fill={color}
            opacity=".85"
          />
          <path
            d="M9 12.5C9 13.328 9.448 14 10 14C10.552 14 11 13.328 11 12.5C11 11.672 10 10.5 10 10.5C10 10.5 9 11.672 9 12.5Z"
            fill="#DDD6FE"
          />
        </svg>
      )
    case 'waste':
      return (
        <svg {...commonProps}>
          <path
            d="M7 4H13M5 4H15L14 17H6L5 4Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 8V13M12 8V13"
            stroke={color}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      )
  }
}
