'use client'

import { Task, formatTime, useTaskStore, URGENCY_COLORS, URGENCY_LABELS, UrgencyLevel } from '@/store/taskStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Clock, Trash2, Edit2, Zap, Bell, BellOff } from 'lucide-react'
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
        "p-0 transition-all duration-200 hover:shadow-md overflow-hidden border-l-4",
        urgencyStyle.border,
        task.completed && "opacity-60",
        isPast && !task.completed && "opacity-50"
      )}
    >
      <div className={cn("p-4", urgencyStyle.bg)}>
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => {
              if (!isDailyTemplate) {
                toggleComplete(task.id)
              }
            }}
            className={cn("mt-0.5", task.urgency === 'urgent' && "border-rose-500")}
            disabled={isDailyTemplate}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 
                className={cn(
                  "font-semibold text-sm",
                  task.completed && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </h3>
              
              <div className="flex items-center gap-1.5 flex-wrap">
                {task.isQuick && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-300">
                    <Zap className="w-3 h-3 mr-0.5" />
                    Quick
                  </Badge>
                )}
                
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", urgencyStyle.badge)}>
                  {URGENCY_LABELS[task.urgency || 'medium']}
                </Badge>
                
                {isDailyTemplate && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary">
                    Daily
                  </Badge>
                )}
                
                {task.notifySent && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-green-500/20 text-green-700 dark:text-green-300">
                    <BellOff className="w-3 h-3 mr-0.5" />
                    Notified
                  </Badge>
                )}
              </div>
            </div>
            
            {task.description && (
              <p className={cn(
                "text-xs text-muted-foreground mt-1.5 line-clamp-2",
                task.completed && "line-through"
              )}>
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">
                {formatTime(task.startTime)} - {formatTime(task.endTime)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background/50"
                onClick={() => onEdit(task)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
