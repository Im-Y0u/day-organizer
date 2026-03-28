'use client'

import { Task, formatTime, useTaskStore, URGENCY_COLORS, URGENCY_LABELS, UrgencyLevel } from '@/store/taskStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Clock, Trash2, Edit2, Zap, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableTaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  isDailyTemplate?: boolean
}

export function SortableTaskCard({ task, onEdit, isDailyTemplate = false }: SortableTaskCardProps) {
  const { toggleComplete, deleteTask, deleteDailyTask } = useTaskStore()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleDelete = () => {
    if (isDailyTemplate) {
      deleteDailyTask(task.id)
    } else {
      deleteTask(task.id)
    }
  }

  const isPastTask = () => {
    if (isDailyTemplate) return false
    const now = new Date()
    const [hours, minutes] = task.endTime.split(':')
    const taskEndTime = new Date()
    taskEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    return taskEndTime < now && task.date === new Date().toISOString().split('T')[0]
  }

  const urgencyStyle = URGENCY_COLORS[task.urgency || 'medium']
  const isPast = isPastTask()

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-lg border-l-4",
        urgencyStyle.border,
        task.completed && "opacity-60",
        isPast && !task.completed && "opacity-50",
        isDragging && "shadow-xl scale-[1.02] z-50 ring-2 ring-violet-400/50"
      )}
    >
      <div className={cn("p-4 flex items-center gap-3", urgencyStyle.bg)}>
        {/* Drag Handle */}
        {!isDailyTemplate && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 touch-none"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <Checkbox
          checked={task.completed}
          onCheckedChange={() => {
            if (!isDailyTemplate) {
              toggleComplete(task.id)
            }
          }}
          className={cn("data-[state=checked]:bg-white/20 data-[state=checked]:border-white/40", task.urgency === 'urgent' && "border-rose-400")}
          disabled={isDailyTemplate}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={cn(
                "font-medium text-sm",
                task.completed && "line-through text-slate-400"
              )}
            >
              {task.title}
            </h3>

            <div className="flex items-center gap-1.5">
              {task.isQuick && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-violet-500/20 text-violet-300 border-violet-400/30">
                  <Zap className="w-3 h-3 mr-0.5" />
                  Quick
                </Badge>
              )}

              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", urgencyStyle.badge)}>
                {URGENCY_LABELS[task.urgency || 'medium']}
              </Badge>

              {isDailyTemplate && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-violet-500/20 text-violet-300 border-violet-400/30">
                  Daily
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span className="font-medium tabular-nums">
              {formatTime(task.startTime)} - {formatTime(task.endTime)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
              onClick={() => onEdit(task)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
