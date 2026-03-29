'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useTaskStore, Task } from '@/store/taskStore'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface TimelineViewProps {
  selectedDate: string
  onEditTask: (task: Task) => void
}

// Urgency colors for task blocks
const URGENCY_STYLES = {
  low: {
    gradient: 'from-emerald-500/90 to-emerald-600/70',
    border: 'border-emerald-400/50',
    shadow: 'shadow-emerald-500/40 hover:shadow-emerald-500/60'
  },
  medium: {
    gradient: 'from-sky-500/90 to-sky-600/70',
    border: 'border-sky-400/50',
    shadow: 'shadow-sky-500/40 hover:shadow-sky-500/60'
  },
  high: {
    gradient: 'from-amber-500/90 to-amber-600/70',
    border: 'border-amber-400/50',
    shadow: 'shadow-amber-500/40 hover:shadow-amber-500/60'
  },
  urgent: {
    gradient: 'from-rose-500/90 to-rose-600/70',
    border: 'border-rose-400/50',
    shadow: 'shadow-rose-500/40 hover:shadow-rose-500/60'
  },
}

interface TaskLayout {
  task: Task
  top: number
  height: number
  left: number
  width: number
  column: number
  totalColumns: number
}

export function TimelineView({ selectedDate, onEditTask }: TimelineViewProps) {
  const { getTasksForDateWithDaily, toggleComplete, updateTask } = useTaskStore()
  const tasks = getTasksForDateWithDaily(selectedDate)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [dragInfo, setDragInfo] = useState<{
    taskId: string
    mode: 'move' | 'resize-top' | 'resize-bottom'
    startMouseY: number
    originalStartMins: number
    originalEndMins: number
  } | null>(null)
  const hasDragged = useRef(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Timeline configuration - show all 24 hours
  const START_HOUR = 0
  const END_HOUR = 24
  const HOUR_HEIGHT = 48
  const MINUTE_HEIGHT = HOUR_HEIGHT / 60
  const MIN_TASK_HEIGHT = 24

  // Convert time string to minutes from start hour
  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number)
    return (h - START_HOUR) * 60 + m
  }

  // Convert minutes back to time string (5-minute snapping)
  const minutesToTime = (mins: number): string => {
    const totalMins = Math.max(0, Math.min((END_HOUR - START_HOUR) * 60, mins))
    const snapped = Math.round(totalMins / 5) * 5
    const h = Math.floor(snapped / 60) + START_HOUR
    const m = snapped % 60
    // Handle 24-hour format properly
    const displayHour = h >= 24 ? 23 : h
    const displayMin = h >= 24 ? 55 : m
    return `${displayHour.toString().padStart(2, '0')}:${displayMin.toString().padStart(2, '0')}`
  }

  // Calculate task layouts with overlap handling
  const taskLayouts = useMemo(() => {
    if (tasks.length === 0) return []

    // Sort tasks by start time
    const sortedTasks = [...tasks].sort((a, b) => 
      a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime)
    )

    // Calculate positions
    const layouts: TaskLayout[] = []
    const columns: { endMins: number }[] = []

    sortedTasks.forEach((task) => {
      const startMins = timeToMinutes(task.startTime)
      const endMins = timeToMinutes(task.endTime)
      const top = startMins * MINUTE_HEIGHT
      const height = Math.max(MIN_TASK_HEIGHT, (endMins - startMins) * MINUTE_HEIGHT)

      // Find first available column
      let columnIndex = 0
      while (columnIndex < columns.length && columns[columnIndex].endMins > startMins) {
        columnIndex++
      }

      // Update or add column
      if (columnIndex < columns.length) {
        columns[columnIndex].endMins = endMins
      } else {
        columns.push({ endMins })
      }

      layouts.push({
        task,
        top,
        height,
        left: 0, // Will be calculated
        width: 1, // Will be calculated
        column: columnIndex,
        totalColumns: 1, // Will be updated
      })
    })

    // Calculate widths based on max columns at any point
    const maxColumns = columns.length

    // Calculate actual width for each task based on overlapping groups
    const groups: TaskLayout[][] = []
    const usedTasks = new Set<string>()

    layouts.forEach((layout) => {
      if (usedTasks.has(layout.task.id)) return

      const group: TaskLayout[] = [layout]
      usedTasks.add(layout.task.id)

      const layoutStart = timeToMinutes(layout.task.startTime)
      const layoutEnd = timeToMinutes(layout.task.endTime)

      // Find all tasks that overlap with this one
      layouts.forEach((other) => {
        if (usedTasks.has(other.task.id)) return

        const otherStart = timeToMinutes(other.task.startTime)
        const otherEnd = timeToMinutes(other.task.endTime)

        // Check if they overlap
        if (layoutStart < otherEnd && layoutEnd > otherStart) {
          group.push(other)
          usedTasks.add(other.task.id)
        }
      })

      groups.push(group)
    })

    // Calculate widths for each group
    groups.forEach((group) => {
      // Find max column index in this group
      const maxCol = Math.max(...group.map(l => l.column)) + 1
      const groupWidth = 100 / maxCol

      group.forEach((layout) => {
        layout.totalColumns = maxCol
        layout.left = (layout.column / maxCol) * 100
        layout.width = groupWidth
      })
    })

    return layouts
  }, [tasks, MINUTE_HEIGHT])

  // Start drag operation
  const startDrag = (e: React.MouseEvent, task: Task, mode: 'move' | 'resize-top' | 'resize-bottom') => {
    e.preventDefault()
    e.stopPropagation()
    hasDragged.current = false
    setDragInfo({
      taskId: task.id,
      mode,
      startMouseY: e.clientY,
      originalStartMins: timeToMinutes(task.startTime),
      originalEndMins: timeToMinutes(task.endTime),
    })
  }

  // Handle mouse move during drag
  useEffect(() => {
    if (!dragInfo) return

    const onMouseMove = (e: MouseEvent) => {
      hasDragged.current = true
      const deltaY = e.clientY - dragInfo.startMouseY
      const deltaMins = Math.round((deltaY / HOUR_HEIGHT) * 60 / 5) * 5

      let newStart = dragInfo.originalStartMins
      let newEnd = dragInfo.originalEndMins
      const duration = dragInfo.originalEndMins - dragInfo.originalStartMins
      const maxMins = (END_HOUR - START_HOUR) * 60

      if (dragInfo.mode === 'move') {
        newStart = Math.max(0, Math.min(maxMins - duration, dragInfo.originalStartMins + deltaMins))
        newEnd = newStart + duration
      } else if (dragInfo.mode === 'resize-top') {
        newStart = Math.max(0, Math.min(dragInfo.originalEndMins - 15, dragInfo.originalStartMins + deltaMins))
      } else {
        newEnd = Math.max(dragInfo.originalStartMins + 15, Math.min(maxMins, dragInfo.originalEndMins + deltaMins))
      }

      updateTask(dragInfo.taskId, {
        startTime: minutesToTime(newStart),
        endTime: minutesToTime(newEnd)
      })
    }

    const onMouseUp = () => setDragInfo(null)

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragInfo, HOUR_HEIGHT, updateTask])

  // Get current time indicator position
  const getCurrentTimePos = () => {
    const today = new Date().toISOString().split('T')[0]
    if (selectedDate !== today) return null
    const h = currentTime.getHours()
    const m = currentTime.getMinutes()
    // Show current time for all 24 hours
    return h * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
  }

  const currentTimePos = getCurrentTimePos()
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

  // Handle task click (only if not dragging)
  const handleTaskClick = (task: Task) => {
    if (!hasDragged.current) {
      onEditTask(task)
    }
  }

  // Format hour label
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM'
    if (hour === 12) return '12 PM'
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`
  }

  // Check if this is the current hour
  const isCurrentHour = (hour: number) => {
    const today = new Date().toISOString().split('T')[0]
    return selectedDate === today && currentTime.getHours() === hour
  }

  return (
    <div className="relative">
      {/* Help text */}
      <div className="text-xs text-[oklch(0.4_0_0)] mb-4 text-center bg-white/5 rounded-xl py-2">
        Drag tasks to move • Drag edges to resize
      </div>

      {/* Timeline container */}
      <div className="flex rounded-2xl overflow-hidden border border-white/5 bg-[oklch(0.12_0.015_265)]/50">
        {/* Time labels column */}
        <div className="w-14 flex-shrink-0 border-r border-white/5 bg-white/5">
          {hours.slice(0, -1).map((hour) => (
            <div
              key={hour}
              className="flex items-start justify-end pr-2 pt-1"
              style={{ height: HOUR_HEIGHT }}
            >
              <span className={cn(
                "text-[11px] font-medium tabular-nums",
                isCurrentHour(hour) ? "text-[oklch(0.72_0.2_280)]" : "text-[oklch(0.4_0_0)]"
              )}>
                {formatHour(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* Timeline grid and tasks */}
        <div
          ref={timelineRef}
          className="flex-1 relative"
          style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}
        >
          {/* Hour grid lines */}
          {hours.slice(0, -1).map((hour) => (
            <div
              key={hour}
              className={cn(
                "border-t border-white/5",
                isCurrentHour(hour) && "bg-[oklch(0.72_0.2_280_/_0.05)]"
              )}
              style={{ height: HOUR_HEIGHT }}
            />
          ))}

          {/* Current time indicator */}
          {currentTimePos !== null && (
            <div
              className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
              style={{ top: currentTimePos }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 shadow-lg shadow-rose-500/50" />
              <div className="flex-1 h-0.5 bg-gradient-to-r from-rose-500 to-rose-500/0" />
            </div>
          )}

          {/* Task blocks */}
          {taskLayouts.map((layout) => {
            const { task, top, height, left, width, column, totalColumns } = layout
            const urgency = task.urgency || 'medium'
            const style = URGENCY_STYLES[urgency]
            const isDragging = dragInfo?.taskId === task.id
            const isShort = height < 32
            const isOverlapped = totalColumns > 1

            return (
              <div
                key={task.id}
                className={cn(
                  "absolute rounded-xl overflow-hidden",
                  "bg-gradient-to-br border shadow-lg transition-all duration-150",
                  style.gradient,
                  style.border,
                  style.shadow,
                  task.completed && "opacity-40 grayscale",
                  isDragging && "ring-2 ring-white/50 scale-[1.02] z-30",
                  isOverlapped ? "mx-0.5" : "mx-1"
                )}
                style={{
                  top,
                  height,
                  left: `calc(${left}% + 2px)`,
                  width: `calc(${width}% - 4px)`,
                }}
              >
                {/* Top resize handle */}
                <div
                  className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-20 hover:bg-white/20 transition-colors rounded-t-xl"
                  onMouseDown={(e) => startDrag(e, task, 'resize-top')}
                />

                {/* Main drag area / content */}
                <div
                  className="h-full flex items-center gap-1 cursor-move px-2 py-1"
                  onMouseDown={(e) => startDrag(e, task, 'move')}
                  onClick={() => handleTaskClick(task)}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleComplete(task.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 border-white/40 data-[state=checked]:bg-white/30 data-[state=checked]:border-white/50 scale-75"
                  />
                  <span className={cn(
                    "font-semibold text-white truncate flex-1 min-w-0 drop-shadow-sm",
                    isShort || isOverlapped ? "text-[10px]" : "text-xs",
                    task.completed && "line-through text-white/70"
                  )}>
                    {task.title}
                  </span>
                  {width > 25 && (
                    <span className={cn(
                      "text-white/80 font-medium tabular-nums shrink-0 drop-shadow-sm",
                      isShort || isOverlapped ? "text-[9px]" : "text-xs"
                    )}>
                      {task.startTime}
                    </span>
                  )}
                </div>

                {/* Bottom resize handle */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20 hover:bg-white/20 transition-colors rounded-b-xl"
                  onMouseDown={(e) => startDrag(e, task, 'resize-bottom')}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-[oklch(0.4_0_0)] bg-[oklch(0.16_0.018_265)]/90 px-6 py-4 rounded-2xl backdrop-blur-sm border border-white/5">
            <p className="font-medium">No tasks scheduled</p>
            <p className="text-sm mt-1">Add a task to see it on the timeline</p>
          </div>
        </div>
      )}
    </div>
  )
}
