'use client'

import { useEffect, useRef } from 'react'
import { useTaskStore, formatTime, getTodayDate } from '@/store/taskStore'
import { useStatsStore } from '@/store/statsStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Target, Trophy, XCircle, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface DailySummaryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DailySummary({ open, onOpenChange }: DailySummaryProps) {
  const { getTasksForDateWithDaily } = useTaskStore()
  const { updateDayStats } = useStatsStore()
  const hasUpdatedRef = useRef(false)
  
  const today = getTodayDate()
  const tasks = getTasksForDateWithDaily(today)
  const completedTasks = tasks.filter(t => t.completed)
  const incompleteTasks = tasks.filter(t => !t.completed)
  
  // Calculate stats
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0
  const quickTasksCompleted = completedTasks.filter(t => t.isQuick).length
  const urgentTasksCompleted = completedTasks.filter(t => t.urgency === 'urgent' || t.urgency === 'high').length
  
  // Calculate total time
  const calculateTotalMinutes = (taskList: typeof tasks) => {
    return taskList.reduce((total, task) => {
      const [startH, startM] = task.startTime.split(':').map(Number)
      const [endH, endM] = task.endTime.split(':').map(Number)
      const startMins = startH * 60 + startM
      const endMins = endH * 60 + endM
      return total + (endMins - startMins)
    }, 0)
  }
  
  const totalTimePlanned = calculateTotalMinutes(tasks)
  const totalTimeCompleted = calculateTotalMinutes(completedTasks)
  
  // Update stats when dialog opens
  useEffect(() => {
    if (open && !hasUpdatedRef.current) {
      updateDayStats(today, {
        totalTasks,
        completedTasks: completedTasks.length,
        quickTasksCompleted,
        urgentTasksCompleted,
        totalTimePlanned,
        totalTimeCompleted,
      })
      hasUpdatedRef.current = true
    }
    if (!open) {
      hasUpdatedRef.current = false
    }
  }, [open, today, totalTasks, completedTasks.length, quickTasksCompleted, urgentTasksCompleted, totalTimePlanned, totalTimeCompleted, updateDayStats])
  
  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }
  
  const getPerformanceMessage = () => {
    if (completionRate === 100) return { text: "Perfect day! 🎉", emoji: "🏆" }
    if (completionRate >= 80) return { text: "Excellent work!", emoji: "🌟" }
    if (completionRate >= 60) return { text: "Good progress!", emoji: "💪" }
    if (completionRate >= 40) return { text: "Keep going!", emoji: "🚀" }
    return { text: "Tomorrow is a new day!", emoji: "🌅" }
  }
  
  const performance = getPerformanceMessage()
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Daily Summary
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Performance Banner */}
          <div className={cn(
            "text-center py-1 rounded-2xl",
            completionRate === 100 
              ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
              : "bg-slate-800/50 border border-slate-700"
          )}>
            <div className="text-4xl mb-2">{performance.emoji}</div>
            <div className="text-xl font-bold">{performance.text}</div>
            <div className="text-3xl font-bold mt-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {completionRate}%
            </div>
            <div className="text-sm text-slate-400 mt-1">tasks completed</div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                <div className="text-2xl font-bold">{completedTasks.length}</div>
                <div className="text-xs text-slate-400">Completed</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <XCircle className="w-6 h-6 mx-auto mb-2 text-rose-400" />
                <div className="text-2xl font-bold">{incompleteTasks.length}</div>
                <div className="text-xs text-slate-400">Remaining</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-sky-400" />
                <div className="text-2xl font-bold">{formatMinutes(totalTimeCompleted)}</div>
                <div className="text-xs text-slate-400">Time Completed</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-violet-400" />
                <div className="text-2xl font-bold">{quickTasksCompleted}</div>
                <div className="text-xs text-slate-400">Quick Tasks</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Completed Today
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {completedTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm line-through text-slate-400">{task.title}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatTime(task.startTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Incomplete Tasks */}
          {incompleteTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3">
                Incomplete ({incompleteTasks.length})
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {incompleteTasks.slice(0, 5).map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20"
                  >
                    <span className="text-sm">{task.title}</span>
                    <Badge variant="outline" className="text-xs text-rose-400 border-rose-500/30">
                      {task.urgency}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 border-slate-600 hover:bg-slate-800"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
