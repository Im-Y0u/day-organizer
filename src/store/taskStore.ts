import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description?: string
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  completed: boolean
  completedAt?: number // timestamp when completed
  date: string // YYYY-MM-DD format
  isDaily: boolean // If true, this task repeats every day
  isQuick: boolean // Quick task flag
  urgency: UrgencyLevel
  order: number // For drag and drop ordering
  notifySent?: boolean // Track if notification was sent
  createdAt: number
  updatedAt?: number // timestamp when last updated (for sync)
  deletedAt?: number // timestamp when deleted (soft delete for sync)
}

// Urgency colors mapping
export const URGENCY_COLORS: Record<UrgencyLevel, { bg: string; border: string; text: string; badge: string }> = {
  low: {
    bg: 'bg-emerald-600/40',
    border: 'border-l-emerald-400',
    text: 'text-emerald-100',
    badge: 'bg-emerald-500/30 text-emerald-200'
  },
  medium: {
    bg: 'bg-sky-600/40',
    border: 'border-l-sky-400',
    text: 'text-sky-100',
    badge: 'bg-sky-500/30 text-sky-200'
  },
  high: {
    bg: 'bg-amber-600/40',
    border: 'border-l-amber-400',
    text: 'text-amber-100',
    badge: 'bg-amber-500/30 text-amber-200'
  },
  urgent: {
    bg: 'bg-rose-600/40',
    border: 'border-l-rose-400',
    text: 'text-rose-100',
    badge: 'bg-rose-500/30 text-rose-200'
  }
}

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
}

interface TaskStore {
  tasks: Task[]
  deletedIds: string[] // Track deleted task IDs for sync
  
  // Actions
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'order'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleComplete: (id: string) => void
  markNotified: (id: string) => void
  reorderTasks: (date: string, orderedIds: string[]) => void
  
  // Undo/Redo
  restoreTasks: (tasks: Task[]) => void
  
  // Getters
  getTasksForDate: (date: string) => Task[]
  getDailyTasks: () => Task[]
  getTasksForDateWithDaily: (date: string) => Task[]
  getUpcomingTasks: (minutes: number) => Task[]
  
  // Eisenhower Matrix (simplified to urgency-based)
  getEisenhowerTasks: (date: string) => {
    doNow: Task[]       // Urgent
    doSoon: Task[]      // High priority
    canWait: Task[]     // Medium
    whenever: Task[]    // Low
  }
  
  // Daily task management
  addDailyTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'date' | 'isDaily' | 'order'>) => void
  updateDailyTask: (id: string, updates: Partial<Task>) => void
  deleteDailyTask: (id: string) => void
  
  // Progress
  getProgressForDate: (date: string) => { completed: number; total: number }
}

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 11)

// Helper to get today's date in YYYY-MM-DD format
export const getTodayDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Helper to format time for display
export const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

// Helper to format date for display
export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const taskDate = new Date(date)
  taskDate.setHours(0, 0, 0, 0)
  
  const diffDays = Math.round((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      deletedIds: [],
      
      addTask: (taskData) => {
        const allTasks = get().tasks
        const dateTasks = allTasks.filter(t => t.date === taskData.date && !t.isDaily)
        const maxOrder = dateTasks.length > 0 ? Math.max(...dateTasks.map(t => t.order)) : -1
        
        const newTask: Task = {
          ...taskData,
          id: generateId(),
          completed: false,
          order: maxOrder + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({ 
          tasks: [...state.tasks, newTask],
          // Remove from deletedIds if re-adding
          deletedIds: state.deletedIds.filter(id => id !== newTask.id)
        }))
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates, updatedAt: Date.now() } : task
          ),
        }))
      },
      
      deleteTask: (id) => {
        set((state) => ({
          // Soft delete - mark as deleted for sync
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, deletedAt: Date.now(), updatedAt: Date.now() } : task
          ),
          deletedIds: [...state.deletedIds, id]
        }))
      },
      
      toggleComplete: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { 
              ...task, 
              completed: !task.completed,
              completedAt: !task.completed ? Date.now() : undefined,
              updatedAt: Date.now()
            } : task
          ),
        }))
      },
      
      markNotified: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, notifySent: true } : task
          ),
        }))
      },
      
      reorderTasks: (date, orderedIds) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.date === date && !task.isDaily) {
              const newOrder = orderedIds.indexOf(task.id)
              return newOrder >= 0 ? { ...task, order: newOrder, updatedAt: Date.now() } : task
            }
            return task
          })
        }))
      },
      
      restoreTasks: (tasks) => {
        // Filter out deleted tasks when restoring from sync
        const deletedIds = get().deletedIds
        const filteredTasks = tasks.filter(t => !deletedIds.includes(t.id) && !t.deletedAt)
        set({ tasks: filteredTasks })
      },
      
      getTasksForDate: (date) => {
        return get().tasks.filter((task) => task.date === date && !task.isDaily && !task.deletedAt)
      },
      
      getDailyTasks: () => {
        return get().tasks.filter((task) => task.isDaily && !task.deletedAt)
      },
      
      getTasksForDateWithDaily: (date) => {
        const allTasks = get().tasks.filter(t => !t.deletedAt)
        const dateTasks = allTasks.filter((task) => task.date === date && !task.isDaily)
        const dailyTasks = allTasks.filter((task) => task.isDaily)
        
        // Create instances for daily tasks
        const dailyInstances: Task[] = []
        dailyTasks.forEach((dailyTask) => {
          const instanceId = `daily-${dailyTask.id}-${date}`
          const existingInstance = allTasks.find(
            (t) => t.id === instanceId
          )
          
          if (existingInstance) {
            dailyInstances.push(existingInstance)
          } else {
            dailyInstances.push({
              ...dailyTask,
              id: instanceId,
              date,
              isDaily: false,
              completed: false,
              order: 999,
            })
          }
        })
        
        return [...dateTasks, ...dailyInstances].sort((a, b) => 
          a.order - b.order || a.startTime.localeCompare(b.startTime)
        )
      },
      
      getUpcomingTasks: (minutes) => {
        const now = new Date()
        const today = getTodayDate()
        const tasks = get().getTasksForDateWithDaily(today)
        
        return tasks.filter((task) => {
          if (task.completed || task.notifySent || task.deletedAt) return false
          
          const [hours, mins] = task.startTime.split(':').map(Number)
          const taskTime = new Date()
          taskTime.setHours(hours, mins, 0, 0)
          
          const diffMs = taskTime.getTime() - now.getTime()
          const diffMins = diffMs / (1000 * 60)
          
          return diffMins > 0 && diffMins <= minutes
        })
      },
      
      getEisenhowerTasks: (date) => {
        const tasks = get().getTasksForDateWithDaily(date)
        
        return {
          doNow: tasks.filter(t => t.urgency === 'urgent'),
          doSoon: tasks.filter(t => t.urgency === 'high'),
          canWait: tasks.filter(t => t.urgency === 'medium'),
          whenever: tasks.filter(t => t.urgency === 'low'),
        }
      },
      
      addDailyTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: generateId(),
          date: 'daily',
          isDaily: true,
          completed: false,
          order: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({ tasks: [...state.tasks, newTask] }))
      },
      
      updateDailyTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates, updatedAt: Date.now() } : task
          ),
        }))
      },
      
      deleteDailyTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) => 
            (task.id === id || task.id.startsWith(`daily-${id}`)) 
              ? { ...task, deletedAt: Date.now(), updatedAt: Date.now() } 
              : task
          ),
          deletedIds: [...state.deletedIds, id]
        }))
      },
      
      getProgressForDate: (date) => {
        const tasks = get().getTasksForDateWithDaily(date)
        const completed = tasks.filter((t) => t.completed).length
        return { completed, total: tasks.length }
      },
    }),
    {
      name: 'day-organizer-tasks',
    }
  )
)
