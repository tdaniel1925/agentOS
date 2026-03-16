'use client'

/**
 * FilterChip Component
 * Category filter button for mobile email inbox
 * Shows label and count badge
 */

interface FilterChipProps {
  active: boolean
  onClick: () => void
  count: number
  label: string
  color?: 'red' | 'blue' | 'green' | 'gray'
}

export function FilterChip({
  active,
  onClick,
  count,
  label,
  color = 'gray'
}: FilterChipProps) {
  // Define color classes based on the color prop
  const colorClasses = {
    red: {
      active: 'bg-red-600 text-white',
      inactive: 'bg-red-100 text-red-800'
    },
    blue: {
      active: 'bg-blue-600 text-white',
      inactive: 'bg-blue-100 text-blue-800'
    },
    green: {
      active: 'bg-green-600 text-white',
      inactive: 'bg-green-100 text-green-800'
    },
    gray: {
      active: 'bg-gray-600 text-white',
      inactive: 'bg-gray-100 text-gray-800'
    }
  }

  const classes = active ? colorClasses[color].active : colorClasses[color].inactive

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap
        transition-colors duration-200
        ${classes}
      `}
    >
      <span>{label}</span>
      <span className={`text-xs ${active ? 'opacity-90' : 'opacity-70'}`}>
        ({count})
      </span>
    </button>
  )
}
