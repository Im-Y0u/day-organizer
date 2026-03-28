import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task } from './taskStore'
import { useEffect, useCallback } from 'react'

// History entry for undo/redo
export interface HistoryEntry {
  action: 'add' | 'update' | 'delete' | 'reorder' | 'toggle' | 'bulk'
  timestamp: number
  description: string
  tasksBefore: Task[]
  tasksAfter: Task[]
}

interface HistoryStore {
  history: HistoryEntry[]
  currentIndex: number
  maxHistory: number
  
  pushHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => void
  undo: () => HistoryEntry | null
  redo: () => HistoryEntry | null
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      history: [],
      currentIndex: -1,
      maxHistory: 50,
      
      pushHistory: (entry) => {
        set((state) => {
          const newHistory = state.history.slice(0, state.currentIndex + 1)
          newHistory.push({ ...entry, timestamp: Date.now() })
          if (newHistory.length > state.maxHistory) newHistory.shift()
          return { history: newHistory, currentIndex: newHistory.length - 1 }
        })
      },
      
      undo: () => {
        const { history, currentIndex } = get()
        if (currentIndex < 0) return null
        const entry = history[currentIndex]
        set({ currentIndex: currentIndex - 1 })
        return entry
      },
      
      redo: () => {
        const { history, currentIndex } = get()
        if (currentIndex >= history.length - 1) return null
        const entry = history[currentIndex + 1]
        set({ currentIndex: currentIndex + 1 })
        return entry
      },
      
      canUndo: () => get().currentIndex >= 0,
      canRedo: () => get().currentIndex < get().history.length - 1,
      clearHistory: () => set({ history: [], currentIndex: -1 }),
    }),
    { name: 'day-organizer-history' }
  )
)

export function useUndoRedo(onUndo: () => void, onRedo: () => void) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      onUndo()
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      onRedo()
    }
  }, [onUndo, onRedo])
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
