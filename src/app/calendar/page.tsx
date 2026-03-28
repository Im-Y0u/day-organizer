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
  endOfWeek,
  getDay
} from 'date-fns'
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTaskStore, getTodayDate } from '@/store/taskStore'
import { AppLayout } from '@/components/AppLayout'
import { SettingsDialog } from '@/components/tasks/SettingsDialog'
import { cn } from '@/lib/utils'

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const hydrated = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)
  const { tasks, getTasksForDateWithDaily } = useTaskStore()

  const today = getTodayDate()

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    router.push(`/timeline?date=${dateStr}`)
  }

  // Get all days to display in the calendar grid (including days from adjacent months)
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })

  // Get task info for a specific date
  const getTaskInfo = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayTasks = getTasksForDateWithDaily(dateStr)
    const completed = dayTasks.filter(t => t.completed).length
    const total = dayTasks.length
    return { completed, total, hasTasks: total > 0 }
  }

  if (!hydrated) return null

  return (
    <AppLayout onOpenSettings={() => setIsSettingsOpen(true)}>
      {/* Month Navigation */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 mb-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('prev')}
            className="h-10 w-10 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <button 
              onClick={goToToday}
              className="text-xl font-semibold text-white hover:text-violet-400 transition-colors"
            >
              {format(currentMonth, 'MMMM yyyy')}
            </button>
            <p className="text-xs text-slate-500 mt-1">Click month to go to today</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('next')}
            className="h-10 w-10 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-slate-800/50 border-b border-slate-700/50">
          {WEEKDAYS.map((day) => (
            <div 
              key={day} 
              className="py-3 text-center text-sm font-medium text-slate-400"
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
            const isSelectedDay = format(date, 'yyyy-MM-dd') === today
            const taskInfo = getTaskInfo(date)

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(date)}
                className={cn(
                  "relative aspect-square p-2 flex flex-col items-center justify-start border-b border-r border-slate-700/30 transition-all",
                  "hover:bg-violet-500/10 hover:border-violet-500/30",
                  !isCurrentMonth && "bg-slate-900/30",
                  isPastDay && "opacity-40",
                  isCurrentDay && "bg-violet-500/5"
                )}
              >
                {/* Day Number */}
                <span 
                  className={cn(
                    "text-sm font-medium mb-1",
                    isCurrentDay 
                      ? "text-violet-400 ring-2 ring-violet-500/50 rounded-full w-7 h-7 flex items-center justify-center" 
                      : isCurrentMonth 
                        ? "text-white" 
                        : "text-slate-600"
                  )}
                >
                  {format(date, 'd')}
                </span>

                {/* Task Indicators */}
                {taskInfo.hasTasks && (
                  <div className="flex flex-col items-center gap-0.5 w-full px-1">
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                        style={{ width: `${(taskInfo.completed / taskInfo.total) * 100}%` }}
                      />
                    </div>
                    
                    {/* Task count */}
                    <span className={cn(
                      "text-[10px] font-medium",
                      taskInfo.completed === taskInfo.total 
                        ? "text-emerald-400" 
                        : "text-slate-400"
                    )}>
                      {taskInfo.completed}/{taskInfo.total}
                    </span>
                  </div>
                )}

                {/* Today outline indicator */}
                {isCurrentDay && (
                  <div className="absolute inset-0 border-2 border-violet-500/30 rounded-lg pointer-events-none" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-violet-500/50 bg-violet-500/10" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
          <span>Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-900/30 opacity-40" />
          <span>Past days</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-3">This Month</h3>
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
                <div>
                  <div className="text-2xl font-bold text-white">{totalTasks}</div>
                  <div className="text-xs text-slate-500">Total Tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{completedTasks}</div>
                  <div className="text-xs text-slate-500">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-violet-400">{futureDaysWithTasks}</div>
                  <div className="text-xs text-slate-500">Days Planned</div>
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
