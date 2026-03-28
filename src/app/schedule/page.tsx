'use client'

import { useState, useEffect, useRef, useSyncExternalStore, useCallback } from 'react'
import { format, addDays, subDays, isToday, isSameDay, isPast, addWeeks, addMonths, subMonths, subYears, addYears } from 'date-fns'
import { Plus, Calendar as CalendarIcon, Repeat, CheckCircle2, Zap, ChevronLeft, ChevronRight, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useTaskStore, getTodayDate, formatDate, Task } from '@/store/taskStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useStatsStore } from '@/store/statsStore'
import { useHistoryStore, useUndoRedo } from '@/store/historyStore'
import { useSyncStore } from '@/store/syncStore'
import { AppLayout } from '@/components/AppLayout'
import { TaskForm } from '@/components/tasks/TaskForm'
import { DailyTaskForm } from '@/components/tasks/DailyTaskForm'
import { SettingsDialog } from '@/components/tasks/SettingsDialog'
import { CompletionStats } from '@/components/tasks/CompletionStats'
import { SortableTaskCard } from '@/components/tasks/SortableTaskCard'
import { SyncDialog } from '@/components/tasks/SyncDialog'
import { soundManager } from '@/lib/sounds'
import { cn } from '@/lib/utils'

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [isDailyFormOpen, setIsDailyFormOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [isSyncOpen, setIsSyncOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingDailyTask, setEditingDailyTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState('schedule')
  const [showCalendar, setShowCalendar] = useState(false)
  const prevCompletedRef = useRef<number>(0)

  const hydrated = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

  const {
    getTasksForDateWithDaily,
    getDailyTasks,
    getProgressForDate,
    reorderTasks,
    toggleComplete,
    restoreTasks
  } = useTaskStore()
  const { soundEnabled } = useSettingsStore()
  const { updateDayStats } = useStatsStore()
  const { canUndo, canRedo, undo, redo, pushHistory } = useHistoryStore()
  const { syncEnabled } = useSyncStore()

  const tasks = getTasksForDateWithDaily(selectedDate)
  const dailyTasks = getDailyTasks()
  const progress = getProgressForDate(selectedDate)

  useEffect(() => {
    soundManager.setEnabled(soundEnabled)
  }, [soundEnabled])

  useEffect(() => {
    if (progress.completed > prevCompletedRef.current && soundEnabled) {
      soundManager.play('complete')
    }
    prevCompletedRef.current = progress.completed
  }, [progress.completed, soundEnabled])

  useEffect(() => {
    if (selectedDate === getTodayDate()) {
      updateDayStats(selectedDate, {
        totalTasks: progress.total,
        completedTasks: progress.completed,
      })
    }
  }, [selectedDate, progress.total, progress.completed, updateDayStats])

  const quickTasks = tasks.filter(t => t.isQuick)
  const regularTasks = tasks.filter(t => !t.isQuick)
  const taskIds = tasks.map(t => t.id)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(t => t.id === active.id)
      const newIndex = tasks.findIndex(t => t.id === over.id)
      const newOrder = arrayMove(taskIds, oldIndex, newIndex)
      reorderTasks(selectedDate, newOrder)
    }
  }

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

  const isToday = selectedDate === getTodayDate()

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskFormOpen(true)
  }

  const handleEditDailyTask = (task: Task) => {
    setEditingDailyTask(task)
    setIsDailyFormOpen(true)
  }

  const groupedTasks = regularTasks.reduce((acc, task) => {
    const hour = parseInt(task.startTime.split(':')[0])
    let period = 'Morning'
    if (hour >= 12 && hour < 17) period = 'Afternoon'
    else if (hour >= 17) period = 'Evening'
    if (!acc[period]) acc[period] = []
    acc[period].push(task)
    return acc
  }, {} as Record<string, typeof tasks>)

  if (!hydrated) return null

  return (
    <AppLayout onOpenSettings={() => setIsSettingsOpen(true)} onOpenStats={() => setIsStatsOpen(true)} onOpenSync={() => setIsSyncOpen(true)}>
      {/* Date Navigation */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50 mb-6">
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
                  {formatDate(selectedDate)}
                </div>
                {!isToday && (
                  <div className="text-xs text-slate-500">
                    {format(new Date(selectedDate + 'T00:00:00'), 'MMM d, yyyy')}
                  </div>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="center">
              <Calendar
                mode="single"
                selected={new Date(selectedDate + 'T00:00:00')}
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(getTodayDate())}
            className="text-xs border-slate-600 hover:bg-slate-700"
          >
            Today
          </Button>

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-800/30 border border-slate-700/50 rounded-xl p-1 h-11">
          <TabsTrigger
            value="schedule"
            className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg h-9"
          >
            <CalendarIcon className="h-4 w-4" />
            Schedule
            {tasks.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-slate-700/50">
                {tasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="daily"
            className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg h-9"
          >
            <Repeat className="h-4 w-4" />
            Daily Tasks
            {dailyTasks.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-slate-700/50">
                {dailyTasks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Button
            onClick={() => { setEditingTask(null); setIsTaskFormOpen(true) }}
            className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 rounded-xl font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>

          {quickTasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Zap className="w-4 h-4 text-violet-400" />
                Quick Tasks
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={quickTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {quickTasks.map((task) => (
                      <SortableTaskCard key={task.id} task={task} onEdit={handleEditTask} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {regularTasks.length === 0 && quickTasks.length === 0 ? (
            <Card className="border-dashed border-slate-700 bg-slate-800/20">
              <CardContent className="py-12 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                <p className="text-base font-medium text-slate-400">No tasks scheduled</p>
                <p className="text-sm text-slate-500 mt-1">Add a task or set up daily tasks</p>
              </CardContent>
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {['Morning', 'Afternoon', 'Evening'].map((period) => {
                    const periodTasks = groupedTasks[period] || []
                    if (periodTasks.length === 0) return null
                    const periodColors = {
                      Morning: 'from-amber-400 to-orange-500',
                      Afternoon: 'from-sky-400 to-cyan-500',
                      Evening: 'from-violet-400 to-purple-500'
                    }
                    return (
                      <div key={period} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={cn("w-2 h-2 rounded-full bg-gradient-to-r", periodColors[period])} />
                          <h3 className="text-sm font-medium text-slate-300">{period}</h3>
                          <div className="flex-1 h-px bg-slate-700/50" />
                        </div>
                        <div className="space-y-2">
                          {periodTasks.map((task) => (
                            <SortableTaskCard key={task.id} task={task} onEdit={handleEditTask} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Button
            onClick={() => { setEditingDailyTask(null); setIsDailyFormOpen(true) }}
            className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 rounded-xl font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Daily Task
          </Button>

          {dailyTasks.length === 0 ? (
            <Card className="border-dashed border-slate-700 bg-slate-800/20">
              <CardContent className="py-12 text-center">
                <Repeat className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                <p className="text-base font-medium text-slate-400">No daily tasks</p>
                <p className="text-sm text-slate-500 mt-1">Add tasks you do every day</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {dailyTasks.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((task) => (
                <SortableTaskCard key={task.id} task={task} onEdit={handleEditDailyTask} isDailyTemplate={true} />
              ))}
            </div>
          )}

          {dailyTasks.length > 0 && (
            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-emerald-400">Daily Tasks</p>
                    <p className="text-slate-400 text-xs mt-0.5">These tasks appear on every day&apos;s schedule automatically.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <TaskForm
        open={isTaskFormOpen}
        onOpenChange={(open) => { setIsTaskFormOpen(open); if (!open) setEditingTask(null) }}
        editTask={editingTask}
        defaultDate={selectedDate}
      />

      <DailyTaskForm
        open={isDailyFormOpen}
        onOpenChange={(open) => { setIsDailyFormOpen(open); if (!open) setEditingDailyTask(null) }}
        editTask={editingDailyTask}
      />

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      <SyncDialog open={isSyncOpen} onOpenChange={setIsSyncOpen} />

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
