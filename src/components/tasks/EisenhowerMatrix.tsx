'use client'

import { Task, useTaskStore, formatTime, URGENCY_COLORS, URGENCY_LABELS } from '@/store/taskStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Flame, Clock, Trash2, AlertTriangle,
  Calendar, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EisenhowerMatrixProps {
  selectedDate: string
  onEditTask: (task: Task) => void
}

export function EisenhowerMatrix({ selectedDate, onEditTask }: EisenhowerMatrixProps) {
  const { getEisenhowerTasks, toggleComplete, deleteTask } = useTaskStore()
  const quadrants = getEisenhowerTasks(selectedDate)

  const quadrantConfig = {
    doNow: {
      title: 'Do Now',
      subtitle: 'Urgent • Act immediately',
      icon: Flame,
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      iconBg: 'bg-rose-500/20',
    },
    doSoon: {
      title: 'Do Soon',
      subtitle: 'High • Plan time today',
      icon: AlertTriangle,
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
    },
    canWait: {
      title: 'Can Wait',
      subtitle: 'Medium • Flexible',
      icon: Calendar,
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/30',
      text: 'text-sky-400',
      iconBg: 'bg-sky-500/20',
    },
    whenever: {
      title: 'Whenever',
      subtitle: 'Low • Optional',
      icon: Zap,
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
    },
  }

  const totalTasks = Object.values(quadrants).flat().length

  return (
    <div className="space-y-4">
      {/* Matrix Grid */}
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(quadrants) as Array<keyof typeof quadrants>).map((key) => {
          const config = quadrantConfig[key]
          const tasks = quadrants[key]
          const Icon = config.icon

          return (
            <Card
              key={key}
              className={cn(
                "border-2 bg-slate-800/30 overflow-hidden",
                config.border
              )}
            >
              {/* Header */}
              <div className={cn("px-3 py-2 border-b border-slate-700/50", config.bg)}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center",
                    config.iconBg
                  )}>
                    <Icon className={cn("w-4 h-4", config.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{config.title}</h3>
                    <p className="text-[10px] text-slate-500 truncate">{config.subtitle}</p>
                  </div>
                  <Badge variant="outline" className={cn("h-5 text-[10px]", config.border, config.text)}>
                    {tasks.length}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-2">
                {tasks.length === 0 ? (
                  <div className="text-center py-4 text-slate-600">
                    <Icon className="w-5 h-5 mx-auto opacity-40" />
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {tasks.map((task) => {
                      return (
                        <div
                          key={task.id}
                          onClick={() => onEditTask(task)}
                          className={cn(
                            "rounded-lg border cursor-pointer transition-all hover:shadow-md p-2",
                            config.bg,
                            config.border,
                            task.completed && "opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleComplete(task.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="scale-75"
                            />
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "text-xs font-medium truncate",
                                task.completed && "line-through text-slate-400"
                              )}>
                                {task.title}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                              {task.startTime}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-slate-500 hover:text-rose-400 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteTask(task.id)
                              }}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Legend */}
      <Card className="bg-slate-800/20 border-slate-700/50">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Urgent = Act now</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Focus top-left first</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
