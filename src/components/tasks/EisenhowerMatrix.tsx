'use client'

import { Task, useTaskStore, formatTime, URGENCY_COLORS, URGENCY_LABELS } from '@/store/taskStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Flame, Clock, Trash2, AlertTriangle,
  Calendar, Zap, CheckCircle2
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
      gradient: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      iconBg: 'bg-rose-500/20',
    },
    doSoon: {
      title: 'Do Soon',
      subtitle: 'High • Plan time today',
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
    },
    canWait: {
      title: 'Can Wait',
      subtitle: 'Medium • Flexible',
      icon: Calendar,
      gradient: 'from-sky-500 to-cyan-500',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      text: 'text-sky-400',
      iconBg: 'bg-sky-500/20',
    },
    whenever: {
      title: 'Whenever',
      subtitle: 'Low • Optional',
      icon: Zap,
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
    },
  }

  const totalTasks = Object.values(quadrants).flat().length

  return (
    <div className="space-y-4">
      {/* Summary */}
      {totalTasks > 0 && (
        <div className="bg-gradient-to-r from-[oklch(0.18_0.018_265)]/60 to-[oklch(0.16_0.015_265)]/60 rounded-2xl border border-white/5 p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[oklch(0.5_0_0)]">Total tasks for this day</span>
            <Badge className="bg-gradient-to-r from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] text-white border-0 px-3 py-1">
              {totalTasks} tasks
            </Badge>
          </div>
        </div>
      )}

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
                "border-0 bg-gradient-to-br from-[oklch(0.18_0.018_265)]/80 to-[oklch(0.16_0.015_265)]/80 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              )}
            >
              {/* Top indicator bar */}
              <div className={cn("h-1 w-full bg-gradient-to-r", config.gradient)} />
              
              {/* Header */}
              <div className={cn("px-4 py-3 border-b border-white/5", config.bg)}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    config.iconBg
                  )}>
                    <Icon className={cn("w-4.5 h-4.5", config.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{config.title}</h3>
                    <p className="text-[10px] text-[oklch(0.5_0_0)] truncate">{config.subtitle}</p>
                  </div>
                  <Badge variant="outline" className={cn("h-6 text-[11px] px-2 border-0", config.bg, config.text)}>
                    {tasks.length}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-6">
                    <div className={cn(
                      "w-10 h-10 mx-auto rounded-xl flex items-center justify-center",
                      config.iconBg
                    )}>
                      <Icon className={cn("w-5 h-5 opacity-40", config.text)} />
                    </div>
                    <p className="text-xs text-[oklch(0.4_0_0)] mt-2">No tasks</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {tasks.map((task) => {
                      return (
                        <div
                          key={task.id}
                          onClick={() => onEditTask(task)}
                          className={cn(
                            "group rounded-xl border cursor-pointer transition-all hover:shadow-md p-3",
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
                              className="w-4 h-4"
                            />
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "text-xs font-medium truncate text-white",
                                task.completed && "line-through text-[oklch(0.5_0_0)]"
                              )}>
                                {task.title}
                              </div>
                            </div>
                            <span className="text-[10px] text-[oklch(0.5_0_0)] tabular-nums shrink-0">
                              {task.startTime}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-[oklch(0.4_0_0)] hover:text-rose-400 hover:bg-rose-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteTask(task.id)
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
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
      <Card className="bg-gradient-to-r from-[oklch(0.18_0.018_265)]/40 to-[oklch(0.16_0.015_265)]/40 border-white/5 rounded-2xl">
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-center gap-8 text-xs text-[oklch(0.5_0_0)]">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Urgent = Act now</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Focus top-left first</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
