'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useTaskStore, getTodayDate } from '@/store/taskStore'
import { useSettingsStore, sendWebhookNotification } from '@/store/settingsStore'
import { soundManager } from '@/lib/sounds'

// Track which notifications have been sent
interface NotificationTracker {
  alertSent: Set<string>  // Task IDs that had alert notification sent
  startSent: Set<string>  // Task IDs that had start notification sent
}

export function useNotifications() {
  const tasks = useTaskStore(state => state.tasks)
  const markNotified = useTaskStore(state => state.markNotified)
  
  const {
    webhookUrl,
    telegramWebhookUrl,
    notificationsEnabled,
    notifyAtAlert,
    notifyAtStart,
    notifyMinutesBefore,
    soundEnabled
  } = useSettingsStore()
  
  // Track sent notifications
  const notifiedRef = useRef<NotificationTracker>({
    alertSent: new Set(),
    startSent: new Set()
  })
  const lastCheckRef = useRef<number>(0)
  
  // Use either generic webhook or Telegram webhook
  const activeWebhook = webhookUrl || telegramWebhookUrl
  
  const checkAndNotify = useCallback(async () => {
    // Debounce - only check every 10 seconds
    const now = Date.now()
    if (now - lastCheckRef.current < 10000) return
    lastCheckRef.current = now
    
    if (!notificationsEnabled || !activeWebhook) return
    if (!notifyAtAlert && !notifyAtStart) return
    
    const today = getTodayDate()
    const currentDate = new Date()
    const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes()
    const currentSeconds = currentDate.getSeconds()
    
    // Get today's tasks that aren't completed
    const todayTasks = tasks.filter(task => {
      if (task.isDaily) {
        const instanceId = `daily-${task.id}-${today}`
        return !tasks.find(t => t.id === instanceId && t.completed)
      }
      return task.date === today && !task.completed
    })
    
    for (const task of todayTasks) {
      // Parse start time
      const [hours, mins] = task.startTime.split(':').map(Number)
      const taskMinutes = hours * 60 + mins
      
      // Calculate minutes until task
      const minutesUntil = taskMinutes - currentMinutes
      
      // ALERT notification (X minutes before)
      if (notifyAtAlert && minutesUntil > 0 && minutesUntil <= notifyMinutesBefore) {
        // Check if we haven't already sent alert for this task
        const alertKey = `${task.id}-${today}`
        if (!notifiedRef.current.alertSent.has(alertKey) && !task.notifySent) {
          console.log(`Sending ALERT for task: ${task.title}, minutes until: ${minutesUntil}`)
          
          const success = await sendWebhookNotification(
            activeWebhook,
            task.title,
            task.startTime,
            task.endTime,
            'alert',
            minutesUntil
          )
          
          if (success) {
            notifiedRef.current.alertSent.add(alertKey)
            if (soundEnabled) {
              soundManager.play('notification')
            }
          }
        }
      }
      
      // START notification (at exact task start time)
      if (notifyAtStart && minutesUntil === 0) {
        // Allow a 1-minute window for the start notification
        const startKey = `${task.id}-${today}-start`
        if (!notifiedRef.current.startSent.has(startKey)) {
          console.log(`Sending START notification for task: ${task.title}`)
          
          const success = await sendWebhookNotification(
            activeWebhook,
            task.title,
            task.startTime,
            task.endTime,
            'start'
          )
          
          if (success) {
            notifiedRef.current.startSent.add(startKey)
            markNotified(task.id)
            if (soundEnabled) {
              soundManager.play('notification')
            }
          }
        }
      }
      
      // Also check if we're within 60 seconds of task start (more precise start detection)
      if (notifyAtStart && minutesUntil === 0 && currentSeconds < 30) {
        const startKey = `${task.id}-${today}-start`
        if (!notifiedRef.current.startSent.has(startKey)) {
          console.log(`Sending START notification for task: ${task.title}`)
          
          const success = await sendWebhookNotification(
            activeWebhook,
            task.title,
            task.startTime,
            task.endTime,
            'start'
          )
          
          if (success) {
            notifiedRef.current.startSent.add(startKey)
            markNotified(task.id)
            if (soundEnabled) {
              soundManager.play('notification')
            }
          }
        }
      }
    }
  }, [
    tasks, 
    notificationsEnabled, 
    activeWebhook, 
    notifyAtAlert, 
    notifyAtStart, 
    notifyMinutesBefore, 
    markNotified, 
    soundEnabled
  ])
  
  useEffect(() => {
    // Check immediately on mount
    checkAndNotify()
    
    // Check every 10 seconds for more precise timing
    const interval = setInterval(checkAndNotify, 10000)
    
    return () => clearInterval(interval)
  }, [checkAndNotify])
  
  return null
}
