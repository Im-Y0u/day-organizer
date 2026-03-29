'use client'

import { useState, useEffect, useRef, useSyncExternalStore, useCallback } from 'react'
import { format, addDays, subDays, isToday, isSameDay, isPast, addWeeks, addMonths, subMonths, subYears, addYears, startOfWeek, eachDayOfInterval } from 'date-fns'
import { Plus, Calendar as CalendarIcon, Repeat, CheckCircle2, Zap, ChevronLeft, ChevronRight, ChevronDown, ChevronsLeft, ChevronsRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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
import { DateNavigation } from '@/components/DateNavigation'
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
      <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Progress indicator */}
      {progress.total > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[oklch(0.5_0_0)]">Daily Progress</span>
            <span className="text-xs font-medium text-[oklch(0.6_0_0)]">
              {progress.completed}/{progress.total} tasks
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] rounded-full transition-all duration-500"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-[oklch(0.18_0.018_265)]/80 border border-white/5 rounded-xl p-1 h-12">
          <TabsTrigger
            value="schedule"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[oklch(0.72_0.2_280)] data-[state=active]:to-[oklch(0.7_0.22_320)] data-[state=active]:text-white rounded-lg h-10"
          >
            <CalendarIcon className="h-4 w-4" />
            Schedule
            {tasks.length > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] bg-white/10 border-0 text-white">
                {tasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="daily"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg h-10"
          >
            <Repeat className="h-4 w-4" />
            Daily Tasks
            {dailyTasks.length > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] bg-white/10 border-0 text-white">
                {dailyTasks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Button
            onClick={() => { setEditingTask(null); setIsTaskFormOpen(true) }}
            className="w-full h-12 bg-gradient-to-r from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] hover:from-[oklch(0.75_0.2_280)] hover:to-[oklch(0.73_0.22_320)] text-white shadow-lg shadow-purple-500/20 rounded-xl font-medium text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Task
          </Button>

          {quickTasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[oklch(0.6_0_0)]">
                <Zap className="w-4 h-4 text-[oklch(0.72_0.2_280)]" />
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
            <Card className="border-dashed border-white/10 bg-white/5 rounded-2xl">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[oklch(0.72_0.2_280_/_0.2)] to-[oklch(0.7_0.22_320_/_0.2)] flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-[oklch(0.72_0.2_280)]" />
                </div>
                <p className="text-base font-medium text-white mb-1">No tasks scheduled</p>
                <p className="text-sm text-[oklch(0.5_0_0)]">Add a task or set up daily tasks to get started</p>
              </CardContent>
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {['Morning', 'Afternoon', 'Evening'].map((period) => {
                    const periodTasks = groupedTasks[period] || []
                    if (periodTasks.length === 0) return null
                    const periodStyles = {
                      Morning: { gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/10' },
                      Afternoon: { gradient: 'from-sky-400 to-cyan-500', bg: 'bg-sky-500/10' },
                      Evening: { gradient: 'from-violet-400 to-purple-500', bg: 'bg-violet-500/10' }
                    }
                    return (
                      <div key={period} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={cn("w-2 h-2 rounded-full bg-gradient-to-r", periodStyles[period].gradient)} />
                          <h3 className="text-sm font-medium text-[oklch(0.7_0_0)]">{period}</h3>
                          <div className="flex-1 h-px bg-white/5" />
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
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 rounded-xl font-medium text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Daily Task
          </Button>

          {dailyTasks.length === 0 ? (
            <Card className="border-dashed border-white/10 bg-white/5 rounded-2xl">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <Repeat className="h-8 w-8 text-emerald-400" />
                </div>
                <p className="text-base font-medium text-white mb-1">No daily tasks</p>
                <p className="text-sm text-[oklch(0.5_0_0)]">Add tasks you do every day</p>
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
            <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 rounded-2xl">
              <CardContent className="py-4 px-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-emerald-400">Daily Tasks</p>
                    <p className="text-[oklch(0.5_0_0)] text-xs mt-0.5">These tasks appear on every day&apos;s schedule automatically.</p>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsStatsOpen(false)}>
          <div
            className="bg-gradient-to-br from-[oklch(0.16_0.018_265)] to-[oklch(0.14_0.015_265)] border border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="font-semibold text-lg text-white">Statistics</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsStatsOpen(false)} className="text-[oklch(0.5_0_0)] hover:text-white hover:bg-white/5 rounded-lg">
                Close
              </Button>
            </div>
            <div className="p-5">
              <CompletionStats />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
