'use client'

import { useState, useSyncExternalStore } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTaskStore, getTodayDate, formatDate, Task } from '@/store/taskStore'
import { AppLayout } from '@/components/AppLayout'
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

  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate + 'T00:00:00')
    const newDate = direction === 'next' ? addDays(current, 1) : subDays(current, 1)
    setSelectedDate(newDate.toISOString().split('T')[0])
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskFormOpen(true)
  }

  if (!hydrated) return null

  return (
    <AppLayout onOpenSettings={() => setIsSettingsOpen(true)} onOpenStats={() => setIsStatsOpen(true)}>
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateDate('prev')}
          className="h-9 w-9 text-slate-400 hover:text-white hover:bg-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <button
          onClick={() => setSelectedDate(getTodayDate())}
          className="text-center px-4 py-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className={cn(
            "text-lg font-semibold",
            selectedDate === getTodayDate() ? "text-violet-400" : "text-white"
          )}>
            {formatDate(selectedDate)}
          </div>
          {selectedDate !== getTodayDate() && (
            <div className="text-xs text-slate-500 mt-0.5">
              {format(new Date(selectedDate + 'T00:00:00'), 'MMM d, yyyy')}
            </div>
          )}
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateDate('next')}
          className="h-9 w-9 text-slate-400 hover:text-white hover:bg-white/10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Add Task Button */}
      <Button
        onClick={() => { setEditingTask(null); setIsTaskFormOpen(true) }}
        className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 rounded-xl font-medium mb-4"
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
