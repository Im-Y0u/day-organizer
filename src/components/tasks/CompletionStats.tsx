'use client'

import { useStatsStore } from '@/store/statsStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Trophy, Target, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompletionStatsProps {
  compact?: boolean
}

export function CompletionStats({ compact = false }: CompletionStatsProps) {
  const { getTotalStats, getRecentDays, currentStreak, longestStreak } = useStatsStore()
  const stats = getTotalStats()
  const recentDays = getRecentDays(7)

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-orange-400">{currentStreak}</span>
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-amber-400">{longestStreak}</span>
        </div>
      </div>
    )
  }

  // Calculate chart data
  const maxTasks = Math.max(...recentDays.map(d => d.totalTasks), 1)

  return (
    <div className="space-y-4">
      {/* Streak Banner */}
      <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{currentStreak}</div>
                <div className="text-sm text-slate-400">Current Streak</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-amber-400">{longestStreak}</div>
              <div className="text-xs text-slate-500">Best Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardContent className="py-3 text-center">
            <Calendar className="w-4 h-4 mx-auto mb-1 text-violet-400" />
            <div className="text-lg font-bold">{stats.totalDays}</div>
            <div className="text-[10px] text-slate-400">Days</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardContent className="py-3 text-center">
            <Target className="w-4 h-4 mx-auto mb-1 text-sky-400" />
            <div className="text-lg font-bold">{stats.totalTasks}</div>
            <div className="text-[10px] text-slate-400">Tasks</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardContent className="py-3 text-center">
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
            <div className="text-lg font-bold">{stats.completedTasks}</div>
            <div className="text-[10px] text-slate-400">Done</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardContent className="py-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-fuchsia-400" />
            <div className="text-lg font-bold">{stats.avgCompletionRate}%</div>
            <div className="text-[10px] text-slate-400">Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium text-slate-300">Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-28">
            {recentDays.map((day, i) => {
              const date = new Date(day.date + 'T00:00:00')
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
              const isToday = day.date === new Date().toISOString().split('T')[0]
              const height = day.totalTasks > 0 ? (day.completedTasks / maxTasks) * 100 : 0

              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-20">
                    {day.totalTasks > 0 && (
                      <div className="text-[10px] text-slate-400 mb-1">
                        {day.completionRate}%
                      </div>
                    )}
                    <div
                      className={cn(
                        "w-full max-w-8 rounded-t-sm transition-all",
                        day.completionRate === 100
                          ? "bg-gradient-to-t from-emerald-500 to-emerald-400"
                          : day.completionRate >= 50
                            ? "bg-gradient-to-t from-sky-500 to-sky-400"
                            : "bg-gradient-to-t from-slate-600 to-slate-500",
                        isToday && "ring-2 ring-violet-400"
                      )}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <div className={cn(
                    "text-[10px] mt-1",
                    isToday ? "text-violet-400 font-bold" : "text-slate-500"
                  )}>
                    {dayName}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-emerald-400" />
              <span>100%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-sky-400" />
              <span>50%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-slate-500" />
              <span>&lt;50%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
