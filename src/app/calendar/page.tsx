'use client'

import { useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  isPast, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTaskStore, getTodayDate } from '@/store/taskStore'
import { AppLayout } from '@/components/AppLayout'
import { DateNavigation } from '@/components/DateNavigation'
import { SettingsDialog } from '@/components/tasks/SettingsDialog'
import { cn } from '@/lib/utils'

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const hydrated = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)
  const { getTasksForDateWithDaily } = useTaskStore()

  const today = getTodayDate()

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
    setSelectedDate(getTodayDate())
  }

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    setSelectedDate(dateStr)
    router.push(`/timeline?date=${dateStr}`)
  }

  // Sync month view with selected date
  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    const newDate = new Date(date + 'T00:00:00')
    if (!isSameMonth(newDate, currentMonth)) {
      setCurrentMonth(newDate)
    }
  }

  // Get task info for a specific date
  const getTaskInfo = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayTasks = getTasksForDateWithDaily(dateStr)
    const completed = dayTasks.filter(t => t.completed).length
    const total = dayTasks.length
    return { completed, total, hasTasks: total > 0 }
  }

  // Get all days to display in the calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })

  if (!hydrated) return null

  return (
    <AppLayout onOpenSettings={() => setIsSettingsOpen(true)}>
      {/* Date Navigation */}
      <DateNavigation selectedDate={selectedDate} onDateChange={handleDateChange} />

      {/* Month Navigation */}
      <div className="bg-gradient-to-r from-[oklch(0.18_0.018_265)]/80 to-[oklch(0.16_0.015_265)]/80 backdrop-blur-sm rounded-2xl p-4 border border-white/5 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('prev')}
            className="h-11 w-11 text-[oklch(0.5_0_0)] hover:text-white hover:bg-white/5 rounded-xl"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <button 
              onClick={goToToday}
              className="text-2xl font-bold text-white hover:text-[oklch(0.72_0.2_280)] transition-colors"
            >
              {format(currentMonth, 'MMMM yyyy')}
            </button>
            <p className="text-xs text-[oklch(0.4_0_0)] mt-1">Click to go to today</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('next')}
            className="h-11 w-11 text-[oklch(0.5_0_0)] hover:text-white hover:bg-white/5 rounded-xl"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-gradient-to-br from-[oklch(0.18_0.018_265)]/60 to-[oklch(0.16_0.015_265)]/60 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden shadow-lg">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-white/5 border-b border-white/5">
          {WEEKDAYS.map((day) => (
            <div 
              key={day} 
              className="py-3.5 text-center text-sm font-medium text-[oklch(0.5_0_0)]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {allDays.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const isCurrentMonth = isSameMonth(date, currentMonth)
            const isCurrentDay = isToday(date)
            const isPastDay = isPast(date) && !isCurrentDay
            const isSelectedDay = dateStr === selectedDate
            const taskInfo = getTaskInfo(date)

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(date)}
                className={cn(
                  "relative aspect-square p-2 flex flex-col items-center justify-start border-b border-r border-white/5 transition-all",
                  "hover:bg-[oklch(0.72_0.2_280_/_0.1)]",
                  !isCurrentMonth && "bg-black/20",
                  isPastDay && "opacity-40",
                  isCurrentDay && "bg-[oklch(0.72_0.2_280_/_0.05)]",
                  isSelectedDay && "bg-[oklch(0.72_0.2_280_/_0.15)]"
                )}
              >
                {/* Day Number */}
                <span 
                  className={cn(
                    "text-sm font-semibold mb-1 transition-all",
                    isCurrentDay 
                      ? "w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] text-white shadow-lg shadow-purple-500/20" 
                      : isSelectedDay
                        ? "w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 text-white ring-2 ring-[oklch(0.72_0.2_280_/_0.5)]"
                        : isCurrentMonth 
                          ? "text-white" 
                          : "text-[oklch(0.4_0_0)]"
                  )}
                >
                  {format(date, 'd')}
                </span>

                {/* Task Indicators */}
                {taskInfo.hasTasks && (
                  <div className="flex flex-col items-center gap-1 w-full px-1">
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          taskInfo.completed === taskInfo.total 
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                            : "bg-gradient-to-r from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)]"
                        )}
                        style={{ width: `${(taskInfo.completed / taskInfo.total) * 100}%` }}
                      />
                    </div>
                    
                    {/* Task count */}
                    <span className={cn(
                      "text-[10px] font-medium",
                      taskInfo.completed === taskInfo.total 
                        ? "text-emerald-400" 
                        : "text-[oklch(0.5_0_0)]"
                    )}>
                      {taskInfo.completed}/{taskInfo.total}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-8 text-xs text-[oklch(0.5_0_0)]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)]" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-gradient-to-r from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] rounded-full" />
          <span>Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-black/20 opacity-40" />
          <span>Past days</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 bg-gradient-to-r from-[oklch(0.18_0.018_265)]/60 to-[oklch(0.16_0.015_265)]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.72_0.2_280_/_0.15)] flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 text-[oklch(0.72_0.2_280)]" />
          </div>
          <h3 className="text-sm font-medium text-[oklch(0.7_0_0)]">This Month</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {(() => {
            const monthStart = startOfMonth(currentMonth)
            const monthEnd = endOfMonth(currentMonth)
            const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
            
            let totalTasks = 0
            let completedTasks = 0
            
            monthDays.forEach(day => {
              const info = getTaskInfo(day)
              totalTasks += info.total
              completedTasks += info.completed
            })

            const futureDays = monthDays.filter(d => !isPast(d) || isToday(d))
            const futureDaysWithTasks = futureDays.filter(d => getTaskInfo(d).hasTasks).length

            return (
              <>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-bold text-white">{totalTasks}</div>
                  <div className="text-[11px] text-[oklch(0.5_0_0)]">Total Tasks</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-bold text-emerald-400">{completedTasks}</div>
                  <div className="text-[11px] text-[oklch(0.5_0_0)]">Completed</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-bold text-[oklch(0.72_0.2_280)]">{futureDaysWithTasks}</div>
                  <div className="text-[11px] text-[oklch(0.5_0_0)]">Days Planned</div>
                </div>
              </>
            )
          })()}
        </div>
      </div>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </AppLayout>
  )
}
