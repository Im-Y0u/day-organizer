import type { Handler, ScheduledEvent } from '@netlify/functions'

// This function runs on a schedule (every minute) via Netlify Scheduled Functions
// It checks all sync sessions and sends webhook notifications for tasks

interface Task {
  id: string
  title: string
  startTime: string
  endTime: string
  completed: boolean
  date: string
  isDaily: boolean
  notifySent?: boolean
  alertSent?: boolean
  startSent?: boolean
}

interface SyncData {
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

interface NotificationTracker {
  [syncKey: string]: {
    [taskId: string]: {
      alertSent?: number
      startSent?: number
    }
  }
}

// In-memory tracker for this function instance
const notificationTracker: NotificationTracker = {}

// JSONBlob API
const JSONBLOB_API = 'https://jsonblob.com/api/jsonBlob'

// Get sync data from JSONBlob
async function getSyncData(key: string): Promise<SyncData | null> {
  try {
    const response = await fetch(`${JSONBLOB_API}/${key}`, {
      headers: { 'Accept': 'application/json' }
    })
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error(`Failed to get sync data for ${key}:`, error)
    return null
  }
}

// Send webhook notification
async function sendWebhook(
  webhookUrl: string,
  task: Task,
  type: 'alert' | 'start',
  minutesBefore?: number
): Promise<boolean> {
  if (!webhookUrl) return false
  
  try {
    const isTelegram = webhookUrl.includes('api.telegram.org')
    const isDiscord = webhookUrl.includes('discord.com/api/webhooks') || webhookUrl.includes('discordapp.com/api/webhooks')
    const isSlack = webhookUrl.includes('hooks.slack.com')
    
    let body: Record<string, unknown>
    
    if (isTelegram) {
      const emoji = type === 'alert' ? '⏰' : '🚀'
      const timeText = type === 'alert' 
        ? `Starting in ${minutesBefore} minutes!`
        : 'Starting NOW!'
      
      body = {
        text: `${emoji} *Task ${timeText}*\n\n📌 **${task.title}**\n🕐 Time: ${task.startTime} - ${task.endTime}`,
        parse_mode: 'Markdown',
      }
    } else if (isDiscord) {
      const color = type === 'alert' ? 0xFFA500 : 0x00FF00
      const title = type === 'alert' 
        ? `⏰ Task Starting in ${minutesBefore} Minutes`
        : '🚀 Task Starting NOW!'
      
      body = {
        embeds: [{
          title,
          description: `**${task.title}**`,
          color,
          fields: [
            { name: 'Time', value: `${task.startTime} - ${task.endTime}`, inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      }
    } else if (isSlack) {
      const emoji = type === 'alert' ? ':alarm_clock:' : ':rocket:'
      const timeText = type === 'alert' 
        ? `starting in ${minutesBefore} minutes`
        : 'starting NOW'
      
      body = {
        text: `${emoji} Task ${timeText}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${task.title}*\n_${task.startTime} - ${task.endTime}_`
            }
          }
        ]
      }
    } else {
      // Generic webhook
      body = {
        title: task.title,
        startTime: task.startTime,
        endTime: task.endTime,
        notificationType: type,
        minutesBefore: type === 'alert' ? minutesBefore : 0,
        timestamp: new Date().toISOString(),
        message: type === 'alert' 
          ? `Task "${task.title}" starts in ${minutesBefore} minutes`
          : `Task "${task.title}" is starting now!`
      }
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    return response.ok
  } catch (error) {
    console.error('Webhook error:', error)
    return false
  }
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export const handler: Handler = async (event: ScheduledEvent) => {
  console.log('Scheduled notification check started at:', new Date().toISOString())
  
  const now = new Date()
  const today = getTodayDate()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  // Known sync keys - in production, these would be stored in a database
  // For now, we'll check a list of keys stored in environment or we can
  // maintain a registry
  const syncKeys = process.env.SYNC_KEYS?.split(',').filter(Boolean) || []
  
  // If no keys configured, try to check a registry
  // For this implementation, we'll use a simple approach:
  // Check if there's a registry blob
  const registryKey = process.env.SYNC_REGISTRY_KEY
  
  if (registryKey) {
    try {
      const registry = await getSyncData(registryKey)
      if (registry && Array.isArray((registry as unknown as { keys: string[] }).keys)) {
        syncKeys.push(...(registry as unknown as { keys: string[] }).keys)
      }
    } catch (e) {
      console.log('No registry found')
    }
  }
  
  // Deduplicate keys
  const uniqueKeys = [...new Set(syncKeys)]
  
  console.log(`Checking ${uniqueKeys.length} sync sessions`)
  
  let notificationsSent = 0
  
  for (const key of uniqueKeys) {
    const data = await getSyncData(key)
    
    if (!data || !data.settings) continue
    
    const { tasks, settings } = data
    const webhookUrl = settings.webhookUrl || settings.telegramWebhookUrl
    
    if (!webhookUrl) continue
    
    const notifyMinutesBefore = settings.notifyMinutesBefore || 5
    const notifyAtAlert = settings.notifyAtAlert !== false
    const notifyAtStart = settings.notifyAtStart !== false
    
    // Initialize tracker for this sync
    if (!notificationTracker[key]) {
      notificationTracker[key] = {}
    }
    
    // Get today's tasks
    const todayTasks = tasks.filter(task => {
      if (task.completed) return false
      if (task.isDaily) return true
      return task.date === today
    })
    
    for (const task of todayTasks) {
      const [hours, mins] = task.startTime.split(':').map(Number)
      const taskMinutes = hours * 60 + mins
      const minutesUntil = taskMinutes - currentMinutes
      
      // Initialize task tracker
      if (!notificationTracker[key][task.id]) {
        notificationTracker[key][task.id] = {}
      }
      
      const tracker = notificationTracker[key][task.id]
      const todayStr = today
      
      // ALERT notification (X minutes before)
      if (notifyAtAlert && minutesUntil > 0 && minutesUntil <= notifyMinutesBefore) {
        const alertKey = `${todayStr}-alert`
        
        if (!tracker.alertSent || tracker.alertSent < Date.now() - 3600000) {
          console.log(`Sending ALERT for task: ${task.title}`)
          
          const success = await sendWebhook(webhookUrl, task, 'alert', minutesUntil)
          
          if (success) {
            tracker.alertSent = Date.now()
            notificationsSent++
          }
        }
      }
      
      // START notification (at task start time, with 2 minute window)
      if (notifyAtStart && minutesUntil >= 0 && minutesUntil <= 2) {
        const startKey = `${todayStr}-start`
        
        if (!tracker.startSent || tracker.startSent < Date.now() - 3600000) {
          console.log(`Sending START for task: ${task.title}`)
          
          const success = await sendWebhook(webhookUrl, task, 'start')
          
          if (success) {
            tracker.startSent = Date.now()
            notificationsSent++
          }
        }
      }
    }
  }
  
  console.log(`Scheduled check complete. Notifications sent: ${notificationsSent}`)
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      checkedAt: new Date().toISOString(),
      sessionsChecked: uniqueKeys.length,
      notificationsSent
    })
  }
}
