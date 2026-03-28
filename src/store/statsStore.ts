import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getTodayDate } from './taskStore'

export interface DayStats {
  date: string
  totalTasks: number
  completedTasks: number
  completionRate: number
  quickTasksCompleted: number
  urgentTasksCompleted: number
  totalTimePlanned: number // in minutes
  totalTimeCompleted: number // in minutes
}

interface StatsStore {
  dayStats: Record<string, DayStats>
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  
  // Actions
  updateDayStats: (date: string, stats: Partial<DayStats>) => void
  calculateStreak: () => void
  getWeekStats: (startDate: string) => DayStats[]
  getTotalStats: () => {
    totalDays: number
    totalTasks: number
    completedTasks: number
    avgCompletionRate: number
    currentStreak: number
    longestStreak: number
  }
  getRecentDays: (count: number) => DayStats[]
}

// Helper to get date N days ago
export const getDateDaysAgo = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

// Helper to check if a day was "perfect" (all tasks completed)
const isPerfectDay = (stats: DayStats | undefined): boolean => {
  if (!stats || stats.totalTasks === 0) return false
  return stats.completionRate === 100
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      dayStats: {},
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      
      updateDayStats: (date, stats) => {
        set((state) => {
          const existingStats = state.dayStats[date] || {
            date,
            totalTasks: 0,
            completedTasks: 0,
            completionRate: 0,
            quickTasksCompleted: 0,
            urgentTasksCompleted: 0,
            totalTimePlanned: 0,
            totalTimeCompleted: 0,
          }
          
          const newStats = { ...existingStats, ...stats }
          
          // Calculate completion rate
          if (newStats.totalTasks > 0) {
            newStats.completionRate = Math.round(
              (newStats.completedTasks / newStats.totalTasks) * 100
            )
          }
          
          return {
            dayStats: {
              ...state.dayStats,
              [date]: newStats,
            },
            lastActiveDate: date,
          }
        })
        
        // Recalculate streak
        get().calculateStreak()
      },
      
      calculateStreak: () => {
        const { dayStats } = get()
        const today = getTodayDate()
        
        let streak = 0
        let checkDate = new Date(today)
        
        // Count consecutive perfect days going backwards
        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0]
          const stats = dayStats[dateStr]
          
          // For today, check if there are tasks and if all are completed
          // For past days, only count if there were tasks and all completed
          if (dateStr === today) {
            // Today counts if all tasks done OR no tasks yet (still in progress)
            if (stats && stats.totalTasks > 0 && stats.completionRate === 100) {
              streak++
            } else if (!stats || stats.totalTasks === 0) {
              // Don't break streak if today hasn't started yet
              checkDate.setDate(checkDate.getDate() - 1)
              continue
            } else {
              break
            }
          } else {
            if (isPerfectDay(stats)) {
              streak++
            } else if (stats && stats.totalTasks > 0) {
              // Had tasks but didn't complete all - streak broken
              break
            } else {
              // No tasks for this day - check if we should continue
              // Stop if we hit a day with no data (gap in activity)
              if (!stats) break
              // Skip days with no tasks but continue streak check
            }
          }
          
          checkDate.setDate(checkDate.getDate() - 1)
          
          // Limit check to 365 days
          if (streak > 365) break
        }
        
        set((state) => ({
          currentStreak: streak,
          longestStreak: Math.max(state.longestStreak, streak),
        }))
      },
      
      getWeekStats: (startDate) => {
        const { dayStats } = get()
        const stats: DayStats[] = []
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate + 'T00:00:00')
          date.setDate(date.getDate() + i)
          const dateStr = date.toISOString().split('T')[0]
          
          stats.push(dayStats[dateStr] || {
            date: dateStr,
            totalTasks: 0,
            completedTasks: 0,
            completionRate: 0,
            quickTasksCompleted: 0,
            urgentTasksCompleted: 0,
            totalTimePlanned: 0,
            totalTimeCompleted: 0,
          })
        }
        
        return stats
      },
      
      getTotalStats: () => {
        const { dayStats, currentStreak, longestStreak } = get()
        const dates = Object.keys(dayStats)
        
        const totalTasks = dates.reduce((sum, date) => sum + dayStats[date].totalTasks, 0)
        const completedTasks = dates.reduce((sum, date) => sum + dayStats[date].completedTasks, 0)
        const avgCompletionRate = dates.length > 0 
          ? Math.round(dates.reduce((sum, date) => sum + dayStats[date].completionRate, 0) / dates.length)
          : 0
        
        return {
          totalDays: dates.length,
          totalTasks,
          completedTasks,
          avgCompletionRate,
          currentStreak,
          longestStreak,
        }
      },
      
      getRecentDays: (count) => {
        const { dayStats } = get()
        const today = getTodayDate()
        const stats: DayStats[] = []
        
        for (let i = 0; i < count; i++) {
          const date = new Date(today + 'T00:00:00')
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          
          if (dayStats[dateStr]) {
            stats.push(dayStats[dateStr])
          }
        }
        
        return stats.reverse()
      },
    }),
    {
      name: 'day-organizer-stats',
    }
  )
)
