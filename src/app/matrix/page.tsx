'use client'

import { useState, useSyncExternalStore } from 'react'
import { format, addDays, subDays, startOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTaskStore, getTodayDate, formatDate, Task } from '@/store/taskStore'
import { AppLayout } from '@/components/AppLayout'
import { DateNavigation } from '@/components/DateNavigation'
import { TaskForm } from '@/components/tasks/TaskForm'
import { SettingsDialog } from '@/components/tasks/SettingsDialog'
import { CompletionStats } from '@/components/tasks/CompletionStats'
import { EisenhowerMatrix } from '@/components/tasks/EisenhowerMatrix'
import { cn } from '@/lib/utils'

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export default function MatrixPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const hydrated = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskFormOpen(true)
  }

  if (!hydrated) return null

  return (
    <AppLayout onOpenSettings={() => setIsSettingsOpen(true)} onOpenStats={() => setIsStatsOpen(true)}>
      {/* Date Navigation */}
      <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Add Task Button */}
      <Button
        onClick={() => { setEditingTask(null); setIsTaskFormOpen(true) }}
        className="w-full h-12 bg-gradient-to-r from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] hover:from-[oklch(0.75_0.2_280)] hover:to-[oklch(0.73_0.22_320)] text-white shadow-lg shadow-purple-500/20 rounded-xl font-medium text-sm mb-6"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Task
      </Button>

      {/* Matrix */}
      <EisenhowerMatrix
        selectedDate={selectedDate}
        onEditTask={handleEditTask}
      />

      <TaskForm
        open={isTaskFormOpen}
        onOpenChange={(open) => { setIsTaskFormOpen(open); if (!open) setEditingTask(null) }}
        editTask={editingTask}
        defaultDate={selectedDate}
      />

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

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
