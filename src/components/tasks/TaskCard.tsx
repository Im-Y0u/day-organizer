'use client'

import { Task, formatTime, useTaskStore, URGENCY_COLORS, URGENCY_LABELS, UrgencyLevel } from '@/store/taskStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Clock, Trash2, Edit2, Zap, Bell, BellOff, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  isDailyTemplate?: boolean
}

export function TaskCard({ task, onEdit, isDailyTemplate = false }: TaskCardProps) {
  const { toggleComplete, deleteTask, deleteDailyTask } = useTaskStore()
  
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
      className={cn(
        "group p-0 transition-all duration-300 hover:shadow-xl overflow-hidden border-0",
        "bg-gradient-to-r from-[oklch(0.2_0.018_265)] to-[oklch(0.18_0.015_265)]",
        "hover:from-[oklch(0.22_0.02_265)] hover:to-[oklch(0.2_0.018_265)]",
        task.completed && "opacity-60 hover:opacity-80",
        isPast && !task.completed && "opacity-50"
      )}
    >
      {/* Urgency indicator bar */}
      <div className={cn(
        "h-1 w-full",
        task.urgency === 'urgent' && "bg-gradient-to-r from-rose-500 to-pink-500",
        task.urgency === 'high' && "bg-gradient-to-r from-amber-500 to-orange-500",
        task.urgency === 'medium' && "bg-gradient-to-r from-sky-500 to-cyan-500",
        task.urgency === 'low' && "bg-gradient-to-r from-emerald-500 to-teal-500"
      )} />
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag handle indicator */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1">
            <GripVertical className="w-4 h-4 text-[oklch(0.4_0_0)]" />
          </div>
          
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => {
              if (!isDailyTemplate) {
                toggleComplete(task.id)
              }
            }}
            className={cn(
              "mt-1 w-5 h-5 rounded-md border-2 transition-all",
              task.urgency === 'urgent' && "border-rose-500 data-[state=checked]:bg-rose-500",
              task.urgency === 'high' && "border-amber-500 data-[state=checked]:bg-amber-500",
              task.urgency === 'medium' && "border-sky-500 data-[state=checked]:bg-sky-500",
              task.urgency === 'low' && "border-emerald-500 data-[state=checked]:bg-emerald-500",
              task.completed && "bg-white/10 border-white/30"
            )}
            disabled={isDailyTemplate}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 
                className={cn(
                  "font-semibold text-[15px] text-white",
                  task.completed && "line-through text-[oklch(0.5_0_0)]"
                )}
              >
                {task.title}
              </h3>
              
              <div className="flex items-center gap-1.5 flex-wrap">
                {task.isQuick && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 bg-[oklch(0.72_0.2_280_/_0.15)] text-[oklch(0.72_0.2_280)] border-[oklch(0.72_0.2_280_/_0.3)] rounded-full">
                    <Zap className="w-3 h-3 mr-0.5" />
                    Quick
                  </Badge>
                )}
                
                <Badge variant="outline" className={cn("text-[10px] px-2 py-0 h-5 rounded-full", urgencyStyle.badge)}>
                  {URGENCY_LABELS[task.urgency || 'medium']}
                </Badge>
                
                {isDailyTemplate && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 bg-[oklch(0.72_0.2_280_/_0.15)] text-[oklch(0.72_0.2_280)] border-[oklch(0.72_0.2_280_/_0.3)] rounded-full">
                    Daily
                  </Badge>
                )}
                
                {task.notifySent && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 rounded-full">
                    <BellOff className="w-3 h-3 mr-0.5" />
                    Notified
                  </Badge>
                )}
              </div>
            </div>
            
            {task.description && (
              <p className={cn(
                "text-xs text-[oklch(0.5_0_0)] mt-2 line-clamp-2",
                task.completed && "line-through"
              )}>
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-[oklch(0.6_0_0)]">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium tabular-nums">
                  {formatTime(task.startTime)} - {formatTime(task.endTime)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[oklch(0.5_0_0)] hover:text-white hover:bg-white/10 rounded-lg"
                onClick={() => onEdit(task)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-[oklch(0.5_0_0)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
