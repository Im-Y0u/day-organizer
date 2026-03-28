'use client'

import { useState, useEffect, useSyncExternalStore, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { format, addDays, subDays, addMonths, subMonths, addYears, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isSameDay } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTaskStore, getTodayDate, Task } from '@/store/taskStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useStatsStore } from '@/store/statsStore'
import { AppLayout } from '@/components/AppLayout'
import { TaskForm } from '@/components/tasks/TaskForm'
import { SettingsDialog } from '@/components/tasks/SettingsDialog'
import { CompletionStats } from '@/components/tasks/CompletionStats'
import { TimelineView } from '@/components/tasks/TimelineView'
import { soundManager } from '@/lib/sounds'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

function TimelineContent() {
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)

  const hydrated = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)
  const { getProgressForDate } = useTaskStore()
  const { soundEnabled } = useSettingsStore()
  const { updateDayStats } = useStatsStore()
  const progress = getProgressForDate(selectedDate)

  // Handle date from URL params (from calendar page)
  useEffect(() => {
    const dateParam = searchParams.get('date')
    if (dateParam) {
      // Validate the date format
      const parsedDate = new Date(dateParam + 'T00:00:00')
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(dateParam)
      }
    }
  }, [searchParams])

  useEffect(() => {
    soundManager.setEnabled(soundEnabled)
  }, [soundEnabled])

  useEffect(() => {
    if (selectedDate === getTodayDate()) {
      updateDayStats(selectedDate, { totalTasks: progress.total, completedTasks: progress.completed })
    }
  }, [selectedDate, progress.total, progress.completed, updateDayStats])

  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate + 'T00:00:00')
    const newDate = direction === 'next' ? addDays(current, 1) : subDays(current, 1)
    setSelectedDate(newDate.toISOString().split('T')[0])
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate + 'T00:00:00')
    const newDate = direction === 'next' ? addMonths(current, 1) : subMonths(current, 1)
    setSelectedDate(newDate.toISOString().split('T')[0])
  }

  const navigateYear = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate + 'T00:00:00')
    const newDate = direction === 'next' ? addYears(current, 1) : subYears(current, 1)
    setSelectedDate(newDate.toISOString().split('T')[0])
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskFormOpen(true)
  }

  const selectedDateObj = new Date(selectedDate + 'T00:00:00')
  const isToday = selectedDate === getTodayDate()

  if (!hydrated) return null

  return (
    <AppLayout onOpenSettings={() => setIsSettingsOpen(true)} onOpenStats={() => setIsStatsOpen(true)}>
      {/* Date Navigation */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50 mb-4">
        {/* Main navigation row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            {/* Year back */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateYear('prev')}
              className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10"
              title="Previous year"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            {/* Month back */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Date display with calendar picker */}
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <button className="text-center px-4 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <div className={cn(
                  "text-lg font-semibold",
                  isToday ? "text-violet-400" : "text-white"
                )}>
                  {isToday ? 'Today' : format(selectedDateObj, 'EEEE')}
                </div>
                <div className="text-sm text-slate-400">
                  {format(selectedDateObj, 'MMMM d, yyyy')}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="center">
              <Calendar
                mode="single"
                selected={selectedDateObj}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date.toISOString().split('T')[0])
                    setShowCalendar(false)
                  }
                }}
                className="bg-slate-800 text-white rounded-lg"
                classNames={{
                  day_selected: "bg-violet-500 text-white hover:bg-violet-600",
                  day_today: "bg-slate-700 text-white ring-2 ring-violet-500/50",
                  day: "text-slate-300 hover:bg-slate-700 rounded-md",
                  nav_button: "text-slate-300 hover:text-white hover:bg-slate-700",
                }}
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1">
            {/* Month forward */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {/* Year forward */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateYear('next')}
              className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10"
              title="Next year"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day-by-day navigation row */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate('prev')}
            className="h-9 w-9 text-slate-400 hover:text-white hover:bg-white/10"
            title="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(getTodayDate())}
              className="text-xs border-slate-600 hover:bg-slate-700"
            >
              Today
            </Button>
            <span className="text-xs text-slate-500">
              Week {format(selectedDateObj, 'w')}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate('next')}
            className="h-9 w-9 text-slate-400 hover:text-white hover:bg-white/10"
            title="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Add Task Button */}
      <Button
        onClick={() => { setEditingTask(null); setIsTaskFormOpen(true) }}
        className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 rounded-xl font-medium mb-4"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Task
      </Button>

      {/* Timeline */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
        <TimelineView
          selectedDate={selectedDate}
          onEditTask={handleEditTask}
        />
      </div>

      {/* Task Count */}
      {progress.total > 0 && (
        <div className="text-center text-sm text-slate-400 mt-4">
          {progress.completed} of {progress.total} tasks completed
          {progress.total > 0 && (
            <span className="ml-2 text-slate-500">
              ({Math.round((progress.completed / progress.total) * 100)}%)
            </span>
          )}
        </div>
      )}

      <TaskForm
        open={isTaskFormOpen}
        onOpenChange={(open) => { setIsTaskFormOpen(open); if (!open) setEditingTask(null) }}
        editTask={editingTask}
        defaultDate={selectedDate}
      />

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      {isStatsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsStatsOpen(false)}>
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="font-semibold text-lg">Statistics</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsStatsOpen(false)} className="text-slate-400">
                Close
              </Button>
            </div>
            <div className="p-4">
              <CompletionStats />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default function TimelinePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <TimelineContent />
    </Suspense>
  )
}
