'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  currentMonth: number
  currentYear: number
}

export default function MonthSwitcher({ currentMonth: month, currentYear: year }: Props) {
  const router = useRouter()

  const handlePrev = () => {
    let newMonth = month - 1
    let newYear = year
    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }
    router.push(`/dashboard?month=${newMonth}&year=${newYear}`)
  }

  const handleNext = () => {
    let newMonth = month + 1
    let newYear = year
    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }
    router.push(`/dashboard?month=${newMonth}&year=${newYear}`)
  }

  const monthName = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1))

  return (
    <div className="flex items-center gap-4 bg-white/5 p-1 rounded-full border border-white/10">
      <button 
        onClick={handlePrev}
        className="p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-sm font-bold min-w-[120px] text-center capitalize">
        {monthName}
      </span>
      <button 
        onClick={handleNext}
        className="p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
