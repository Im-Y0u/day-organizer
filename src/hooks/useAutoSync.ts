'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useTaskStore, Task } from '@/store/taskStore'
import { useSettingsStore } from '@/store/settingsStore'
import { 
  useSyncStore, 
  createSyncSession, 
  getSyncData, 
  updateSyncData 
} from '@/store/syncStore'

export function useAutoSync() {
  const tasks = useTaskStore(state => state.tasks)
  const deletedIds = useTaskStore(state => state.deletedIds)
  const restoreTasks = useTaskStore(state => state.restoreTasks)
  
  const {
    webhookUrl,
    telegramWebhookUrl,
    notifyMinutesBefore,
    notifyAtAlert,
    notifyAtStart
  } = useSettingsStore()
  
  const {
    syncCode,
    storageKey,
    autoSyncEnabled,
    lastRemoteUpdate,
    setLastSyncTime,
    setLastRemoteUpdate,
    setIsSyncing,
    setError,
    initSync
  } = useSyncStore()
  
  // Refs
  const tasksRef = useRef(tasks)
  const deletedIdsRef = useRef(deletedIds)
  const settingsRef = useRef({ webhookUrl, telegramWebhookUrl, notifyMinutesBefore, notifyAtAlert, notifyAtStart })
  const syncInProgress = useRef(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastPushedRef = useRef<string>('')
  const hasInitialized = useRef(false)
  
  // Keep refs updated
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])
  
  useEffect(() => {
    deletedIdsRef.current = deletedIds
  }, [deletedIds])
  
  useEffect(() => {
    settingsRef.current = { webhookUrl, telegramWebhookUrl, notifyMinutesBefore, notifyAtAlert, notifyAtStart }
  }, [webhookUrl, telegramWebhookUrl, notifyMinutesBefore, notifyAtAlert, notifyAtStart])
  
  // Build payload - exclude deleted tasks
  const buildPayload = useCallback(() => {
    const activeTasks = tasksRef.current.filter(t => !t.deletedAt && !deletedIdsRef.current.includes(t.id))
    return {
      tasks: activeTasks,
      updatedAt: Date.now(),
      settings: {
        webhookUrl: settingsRef.current.webhookUrl,
        telegramWebhookUrl: settingsRef.current.telegramWebhookUrl,
        notifyMinutesBefore: settingsRef.current.notifyMinutesBefore,
        notifyAtAlert: settingsRef.current.notifyAtAlert,
        notifyAtStart: settingsRef.current.notifyAtStart
      }
    }
  }, [])
  
  // Get hash of tasks for comparison
  const getTasksHash = useCallback((taskList: Task[]) => {
    try {
      return JSON.stringify(taskList.map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        date: t.date,
        updatedAt: t.updatedAt,
        deletedAt: t.deletedAt
      })).sort((a, b) => a.id.localeCompare(b.id)))
    } catch {
      return ''
    }
  }, [])
  
  // PULL from server
  const pullFromServer = useCallback(async (): Promise<{ success: boolean; data?: { tasks: Task[], updatedAt: number } }> => {
    if (!storageKey) return { success: false }
    
    try {
      const result = await getSyncData(storageKey)
      
      if (result.success && result.data) {
        return { success: true, data: result.data }
      }
      return { success: false }
    } catch (err) {
      console.error('Pull error:', err)
      return { success: false }
    }
  }, [storageKey])
  
  // PUSH to server
  const pushToServer = useCallback(async (): Promise<boolean> => {
    if (!storageKey) return false
    
    try {
      const payload = buildPayload()
      const result = await updateSyncData(storageKey, payload)
      
      if (result.success) {
        const activeTasks = tasksRef.current.filter(t => !t.deletedAt)
        lastPushedRef.current = getTasksHash(activeTasks)
        setLastSyncTime(Date.now())
        return true
      }
      return false
    } catch (err) {
      console.error('Push error:', err)
      return false
    }
  }, [storageKey, buildPayload, getTasksHash, setLastSyncTime])
  
  // FULL SYNC - Pull first, merge, then push
  const doFullSync = useCallback(async (showLoading = true) => {
    if (!storageKey || syncInProgress.current) return
    
    syncInProgress.current = true
    if (showLoading) setIsSyncing(true)
    
    try {
      // STEP 1: Pull from server
      const pullResult = await pullFromServer()
      
      if (pullResult.success && pullResult.data) {
        const serverTasks = pullResult.data.tasks.filter(t => !t.deletedAt)
        const serverTime = pullResult.data.updatedAt
        const localTasks = tasksRef.current.filter(t => !t.deletedAt)
        const localDeletedIds = deletedIdsRef.current
        
        // STEP 2: Merge - respect local deletions
        const mergedMap = new Map<string, Task>()
        
        // Add server tasks that weren't deleted locally
        serverTasks.forEach(t => {
          if (!localDeletedIds.includes(t.id)) {
            mergedMap.set(t.id, t)
          }
        })
        
        // Add local tasks that don't exist on server OR were modified locally after server time
        localTasks.forEach(localTask => {
          const serverTask = mergedMap.get(localTask.id)
          
          if (!serverTask) {
            // Only exists locally - add it
            mergedMap.set(localTask.id, localTask)
          } else if (localTask.updatedAt && localTask.updatedAt > (serverTask.updatedAt || 0)) {
            // Local is newer - use local
            mergedMap.set(localTask.id, localTask)
          }
        })
        
        const mergedTasks = Array.from(mergedMap.values())
        
        // Update local state if different
        const localHash = getTasksHash(localTasks)
        const mergedHash = getTasksHash(mergedTasks)
        
        if (localHash !== mergedHash) {
          restoreTasks(mergedTasks)
        }
        
        setLastRemoteUpdate(serverTime)
        
        // STEP 3: Push merged state back to server
        const pushSuccess = await pushToServer()
        
        if (pushSuccess) {
          console.log('Sync complete - pulled, merged, pushed')
        }
      } else {
        // No server data - just push local
        await pushToServer()
        console.log('Sync complete - pushed local only')
      }
    } catch (err) {
      console.error('Sync error:', err)
      setError('Sync failed')
    } finally {
      syncInProgress.current = false
      setIsSyncing(false)
    }
  }, [storageKey, pullFromServer, pushToServer, restoreTasks, getTasksHash, setIsSyncing, setLastRemoteUpdate, setError])
  
  // Create new sync session
  const createSync = useCallback(async () => {
    setIsSyncing(true)
    setError(null)
    
    try {
      const payload = buildPayload()
      const result = await createSyncSession(payload)
      
      if (result.success && result.key) {
        const code = syncCode || generateCode()
        initSync(code, result.key)
        const activeTasks = tasksRef.current.filter(t => !t.deletedAt)
        lastPushedRef.current = getTasksHash(activeTasks)
        hasInitialized.current = true
        return { success: true, code, key: result.key }
      } else {
        setError(result.error || 'Failed to create sync')
        return { success: false }
      }
    } catch (err) {
      setError('Failed to create sync')
      return { success: false }
    } finally {
      setIsSyncing(false)
    }
  }, [syncCode, buildPayload, getTasksHash, initSync, setIsSyncing, setError])
  
  // Join existing sync
  const joinSync = useCallback(async (code: string, key: string) => {
    setIsSyncing(true)
    setError(null)
    
    try {
      const result = await getSyncData(key)
      
      if (result.success && result.data) {
        const serverTasks = result.data.tasks.filter(t => !t.deletedAt)
        restoreTasks(serverTasks)
        initSync(code, key)
        lastPushedRef.current = getTasksHash(serverTasks)
        setLastRemoteUpdate(result.data.updatedAt)
        hasInitialized.current = true
        return { success: true }
      } else {
        setError(result.error || 'Failed to join sync')
        return { success: false }
      }
    } catch (err) {
      setError('Failed to join sync')
      return { success: false }
    } finally {
      setIsSyncing(false)
    }
  }, [initSync, restoreTasks, getTasksHash, setIsSyncing, setError, setLastRemoteUpdate])
  
  // INITIAL SYNC on mount
  useEffect(() => {
    if (!autoSyncEnabled || !storageKey || hasInitialized.current) return
    
    hasInitialized.current = true
    
    // Pull immediately on first load
    doFullSync(true)
  }, [autoSyncEnabled, storageKey, doFullSync])
  
  // AUTO-PUSH on local changes (debounced)
  useEffect(() => {
    if (!autoSyncEnabled || !storageKey || !hasInitialized.current) return
    
    const activeTasks = tasks.filter(t => !t.deletedAt)
    const currentHash = getTasksHash(activeTasks)
    
    // Skip if nothing changed from what we last pushed
    if (currentHash === lastPushedRef.current) return
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    debounceTimer.current = setTimeout(() => {
      if (!syncInProgress.current) {
        doFullSync(false)
      }
    }, 1500)
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [tasks, deletedIds, autoSyncEnabled, storageKey, getTasksHash, doFullSync])
  
  // PERIODIC SYNC every 20 seconds
  useEffect(() => {
    if (!autoSyncEnabled || !storageKey) return
    
    const interval = setInterval(() => {
      if (!syncInProgress.current) {
        doFullSync(false)
      }
    }, 20000)
    
    return () => clearInterval(interval)
  }, [autoSyncEnabled, storageKey, doFullSync])
  
  return {
    createSync,
    joinSync,
    doFullSync,
    pullFromServer,
    pushToServer,
    restoreTasks
  }
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
