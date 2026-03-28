import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task } from './taskStore'

export interface SyncState {
  syncCode: string | null  // 8-character code
  storageKey: string | null  // JSONBlob key
  lastSyncTime: number | null
  lastRemoteUpdate: number | null
  isSyncing: boolean
  syncEnabled: boolean
  autoSyncEnabled: boolean
  syncInterval: number  // milliseconds
  error: string | null
  
  // Actions
  setSyncCode: (code: string | null) => void
  setStorageKey: (key: string | null) => void
  setLastSyncTime: (time: number) => void
  setLastRemoteUpdate: (time: number) => void
  setIsSyncing: (syncing: boolean) => void
  setAutoSyncEnabled: (enabled: boolean) => void
  setSyncInterval: (interval: number) => void
  setError: (error: string | null) => void
  clearSync: () => void
  
  // Full sync setup
  initSync: (code: string, storageKey: string) => void
}

// Generate a random 8-character sync code
export const generateSyncCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Default sync interval: 30 seconds
const DEFAULT_SYNC_INTERVAL = 30000

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      syncCode: null,
      storageKey: null,
      lastSyncTime: null,
      lastRemoteUpdate: null,
      isSyncing: false,
      syncEnabled: false,
      autoSyncEnabled: true,
      syncInterval: DEFAULT_SYNC_INTERVAL,
      error: null,
      
      setSyncCode: (code) => set({ syncCode: code, syncEnabled: !!code }),
      setStorageKey: (key) => set({ storageKey: key }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      setLastRemoteUpdate: (time) => set({ lastRemoteUpdate: time }),
      setIsSyncing: (syncing) => set({ isSyncing: syncing }),
      setAutoSyncEnabled: (enabled) => set({ autoSyncEnabled: enabled }),
      setSyncInterval: (interval) => set({ syncInterval: interval }),
      setError: (error) => set({ error }),
      
      clearSync: () => set({ 
        syncCode: null, 
        storageKey: null,
        lastSyncTime: null, 
        lastRemoteUpdate: null,
        syncEnabled: false,
        error: null
      }),
      
      initSync: (code, storageKey) => set({
        syncCode: code,
        storageKey,
        syncEnabled: true,
        lastSyncTime: Date.now()
      })
    }),
    {
      name: 'day-organizer-sync',
    }
  )
)

// API functions for sync operations
const getApiUrl = () => {
  if (typeof window === 'undefined') return ''
  // Use Netlify function path
  return `${window.location.origin}/.netlify/functions/sync`
}

export interface SyncResponse {
  success: boolean
  key?: string
  data?: { tasks: Task[], updatedAt: number, settings?: Record<string, unknown> }
  error?: string
  updatedAt?: number
}

interface SyncPayload {
  tasks: Task[]
  updatedAt: number
  settings?: {
    webhookUrl?: string
    telegramWebhookUrl?: string
    notifyMinutesBefore?: number
    notifyAtAlert?: boolean
    notifyAtStart?: boolean
  }
}

// Create a new sync session
export async function createSyncSession(payload: SyncPayload): Promise<SyncResponse> {
  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    return await response.json()
  } catch (error) {
    console.error('Create sync error:', error)
    return { success: false, error: 'Failed to create sync session' }
  }
}

// Get sync data
export async function getSyncData(key: string): Promise<SyncResponse> {
  try {
    const response = await fetch(`${getApiUrl()}?id=${key}`, {
      method: 'GET'
    })
    
    return await response.json()
  } catch (error) {
    console.error('Get sync error:', error)
    return { success: false, error: 'Failed to get sync data' }
  }
}

// Update sync data
export async function updateSyncData(key: string, payload: SyncPayload): Promise<SyncResponse> {
  try {
    const response = await fetch(`${getApiUrl()}?id=${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    return await response.json()
  } catch (error) {
    console.error('Update sync error:', error)
    return { success: false, error: 'Failed to update sync data' }
  }
}
