'use client'

import { useState } from 'react'
import { format, addDays, subDays, startOfWeek, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths, addYears, subYears } from 'date-fns'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { getTodayDate, formatDate } from '@/store/taskStore'

interface DateNavigationProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

export function DateNavigation({ selectedDate, onDateChange }: DateNavigationProps) {
  const [showCalendar, setShowCalendar] = useState(false)

  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate + 'T00:00:00')
    const newDate = direction === 'next' ? addDays(current, 1) : subDays(current, 1)
    onDateChange(newDate.toISOString().split('T')[0])
  }

  // Week dates for quick navigation - based on selected date's week
  const weekStart = startOfWeek(new Date(selectedDate + 'T00:00:00'), { weekStartsOn: 0 })
  const weekDates = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })

  return (
    <div className="bg-gradient-to-r from-[oklch(0.18_0.018_265)]/80 to-[oklch(0.16_0.015_265)]/80 backdrop-blur-sm rounded-2xl p-4 border border-white/5 mb-6 shadow-lg">
      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {weekDates.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const isSelected = dateStr === selectedDate
          const isCurrentDay = isToday(date)
          
          return (
            <button
              key={dateStr}
              onClick={() => onDateChange(dateStr)}
              className={cn(
                "flex flex-col items-center p-2 rounded-xl transition-all",
                isSelected
                  ? "bg-gradient-to-b from-[oklch(0.72_0.2_280)] to-[oklch(0.65_0.22_320)] text-white shadow-lg shadow-purple-500/20"
                  : isCurrentDay
                    ? "bg-white/10 text-white hover:bg-white/15"
                    : "bg-white/5 text-[oklch(0.6_0_0)] hover:bg-white/10 hover:text-white"
              )}
            >
              <span className="text-[10px] uppercase font-medium opacity-80">
                {format(date, 'EEE')}
              </span>
              <span className={cn(
                "text-sm font-semibold mt-0.5",
                isSelected && "text-white"
              )}>
                {format(date, 'd')}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main navigation row with day arrows */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateDate('prev')}
          className="h-10 w-10 text-[oklch(0.5_0_0)] hover:text-white hover:bg-white/5 rounded-xl"
          title="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="text-center">
                <div className={cn(
                  "text-lg font-bold",
                  selectedDate === getTodayDate() ? "gradient-text" : "text-white"
                )}>
                  {formatDate(selectedDate)}
                </div>
                {selectedDate !== getTodayDate() && (
                  <div className="text-xs text-[oklch(0.5_0_0)] mt-0.5">
                    {format(new Date(selectedDate + 'T00:00:00'), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[oklch(0.18_0.018_265)] border-white/10 rounded-xl" align="center">
            <Calendar
              mode="single"
              selected={new Date(selectedDate + 'T00:00:00')}
              onSelect={(date) => {
                if (date) {
                  onDateChange(date.toISOString().split('T')[0])
                  setShowCalendar(false)
                }
              }}
              className="bg-transparent text-white rounded-xl"
              classNames={{
                day_selected: "bg-gradient-to-r from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] text-white hover:opacity-90 rounded-lg",
                day_today: "bg-white/10 text-white ring-2 ring-[oklch(0.72_0.2_280_/_0.5)] rounded-lg",
                day: "text-[oklch(0.7_0_0)] hover:bg-white/10 rounded-lg",
                nav_button: "text-[oklch(0.7_0_0)] hover:text-white hover:bg-white/10 rounded-lg",
              }}
            />
          </PopoverContent>
        </Popover>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateDate('next')}
          className="h-10 w-10 text-[oklch(0.5_0_0)] hover:text-white hover:bg-white/5 rounded-xl"
          title="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
