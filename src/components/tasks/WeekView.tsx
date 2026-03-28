'use client'

import { useState } from 'react'
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTaskStore, getTodayDate, Task } from '@/store/taskStore'
import { cn } from '@/lib/utils'

interface WeekViewProps {
  onSelectDate: (date: string) => void
  selectedDate: string
}

export function WeekView({ onSelectDate, selectedDate }: WeekViewProps) {
  const { getTasksForDateWithDaily, getProgressForDate } = useTaskStore()
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    return startOfWeek(today, { weekStartsOn: 1 }) // Monday
  })
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekStart(current => 
      direction === 'next' ? addWeeks(current, 1) : subWeeks(current, 1)
    )
  }
  
  const goToToday = () => {
    const today = new Date()
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }))
    onSelectDate(getTodayDate())
  }
  
  const isCurrentWeek = () => {
    const today = new Date()
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })
    return format(weekStart, 'yyyy-MM-dd') === format(currentWeekStart, 'yyyy-MM-dd')
  }
  
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = getTodayDate()
  
  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek('prev')}
          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <button
          onClick={goToToday}
          className={cn(
            "text-sm font-medium px-3 py-1 rounded-lg transition-colors",
            isCurrentWeek() 
              ? "text-violet-400" 
              : "text-slate-400 hover:text-white"
          )}
        >
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek('next')}
          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const tasks = getTasksForDateWithDaily(dateStr)
          const progress = getProgressForDate(dateStr)
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          const isPast = day < new Date(today + 'T00:00:00')
          
          // Group tasks by urgency for quick view
          const urgentCount = tasks.filter(t => t.urgency === 'urgent' || t.urgency === 'high').length
          const completedCount = progress.completed
          
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "p-2 rounded-xl text-center transition-all",
                isSelected 
                  ? "bg-violet-500/20 border-2 border-violet-500" 
                  : "bg-slate-800/50 border border-slate-700 hover:border-slate-600",
                isToday && !isSelected && "ring-2 ring-violet-400/50"
              )}
            >
              <div className={cn(
                "text-[10px] font-medium mb-1",
                isToday ? "text-violet-400" : "text-slate-500"
              )}>
                {format(day, 'EEE')}
              </div>
              
              <div className={cn(
                "text-lg font-bold mb-2",
                isPast && !isToday ? "text-slate-500" : "text-white"
              )}>
                {format(day, 'd')}
              </div>
              
              {/* Task indicators */}
              {tasks.length > 0 && (
                <div className="space-y-1">
                  {/* Progress bar */}
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all",
                        progress.completed === progress.total && progress.total > 0
                          ? "bg-emerald-400"
                          : "bg-violet-400"
                      )}
                      style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                  
                  {/* Task count */}
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[10px] text-slate-400">
                      {completedCount}/{progress.total}
                    </span>
                    {urgentCount > 0 && (
                      <Badge className="h-3.5 px-1 text-[8px] bg-rose-500/20 text-rose-400 border-0">
                        {urgentCount}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {tasks.length === 0 && (
                <div className="text-[10px] text-slate-600">No tasks</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
