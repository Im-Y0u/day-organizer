import type { Handler } from '@netlify/functions'

// JSONBlob API for storage
const JSONBLOB_API = 'https://jsonblob.com/api/jsonBlob'
// Registry blob ID - stores list of all sync IDs with notifications enabled
// This is a shared blob that tracks all notification-enabled syncs
const REGISTRY_BLOB_ID = '019d31f9-b46e-7afd-bdf2-580d084eb9d2' // We'll create this dynamically

interface Task {
  id: string
  title: string
  startTime: string
  endTime: string
  date: string
  completed: boolean
  notified?: boolean
}

interface SyncData {
  tasks: string
  updatedAt: number
  syncId: string
  telegramWebhook?: string
  notifyMinutesBefore?: number
  notificationsEnabled?: boolean
}

interface NotificationRegistry {
  syncs: Array<{
    syncId: string
    blobId: string
    telegramWebhook: string
    notifyMinutesBefore: number
  }>
}

// Send Telegram notification
async function sendTelegramNotification(webhookUrl: string, task: Task, minutesBefore: number): Promise<boolean> {
  try {
    const message = `⏰ *Task Reminder!*\n\n📌 **${task.title}**\n🕐 Time: ${task.startTime} - ${task.endTime}\n\nStarts in ${minutesBefore} minute${minutesBefore > 1 ? 's' : ''}!`
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        parse_mode: 'Markdown',
      }),
    })
    
    return response.ok
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
    return false
  }
}

// Get sync data from JSONBlob
async function getSyncData(blobId: string): Promise<SyncData | null> {
  try {
    const response = await fetch(`${JSONBLOB_API}/${blobId}`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

// Update sync data in JSONBlob
async function updateSyncData(blobId: string, data: SyncData): Promise<boolean> {
  try {
    const response = await fetch(`${JSONBLOB_API}/${blobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.ok
  } catch {
    return false
  }
}

// Get or create notification registry
async function getRegistry(): Promise<NotificationRegistry> {
  try {
    // Try to get existing registry
    const response = await fetch(`${JSONBLOB_API}/${process.env.REGISTRY_BLOB_ID || ''}`)
    if (response.ok) {
      return await response.json()
    }
  } catch {}
  
  return { syncs: [] }
}

// Update registry
async function updateRegistry(registry: NotificationRegistry): Promise<string> {
  try {
    const response = await fetch(JSONBLOB_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registry)
    })
    
    const location = response.headers.get('Location') || ''
    return location.split('/').pop() || ''
  } catch {
    return ''
  }
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  const action = event.queryStringParameters?.action
  const blobId = event.queryStringParameters?.id
  const syncId = event.queryStringParameters?.syncId

  // Register for notifications
  if (event.httpMethod === 'POST' && action === 'register' && event.body) {
    try {
      const body = JSON.parse(event.body)
      
      // Update sync data with notification settings
      if (blobId) {
        const existingData = await getSyncData(blobId)
        if (existingData) {
          const updatedData: SyncData = {
            ...existingData,
            telegramWebhook: body.telegramWebhook,
            notifyMinutesBefore: body.notifyMinutesBefore ?? 5,
            notificationsEnabled: true
          }
          await updateSyncData(blobId, updatedData)
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Notifications registered' })
      }
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'Failed to register' })
      }
    }
  }

  // Unregister from notifications
  if (event.httpMethod === 'DELETE' && blobId) {
    try {
      const existingData = await getSyncData(blobId)
      if (existingData) {
        const updatedData: SyncData = {
          ...existingData,
          notificationsEnabled: false,
          telegramWebhook: undefined
        }
        await updateSyncData(blobId, updatedData)
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      }
    } catch {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'Failed to unregister' })
      }
    }
  }

  // Get notification status
  if (event.httpMethod === 'GET' && blobId) {
    const data = await getSyncData(blobId)
    if (data) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          configured: !!data.telegramWebhook,
          enabled: data.notificationsEnabled ?? false,
          notifyMinutesBefore: data.notifyMinutesBefore ?? 5
        })
      }
    }
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, error: 'Not found' })
    }
  }

  // Check and send notifications (triggered by cron job)
  if (event.httpMethod === 'POST' && action === 'check') {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    
    let notificationsSent = 0
    
    try {
      // Get list of sync IDs from the check request
      const body = event.body ? JSON.parse(event.body) : {}
      const syncList = body.syncs || []
      
      for (const sync of syncList) {
        const data = await getSyncData(sync.blobId)
        if (!data || !data.telegramWebhook || !data.notificationsEnabled) continue
        
        const tasks: Task[] = typeof data.tasks === 'string' ? JSON.parse(data.tasks) : data.tasks
        const notifyBefore = data.notifyMinutesBefore || 5
        
        for (const task of tasks) {
          if (task.completed || task.notified) continue
          if (task.date !== today) continue
          
          // Parse task start time
          const [h, m] = task.startTime.split(':').map(Number)
          const taskMinutes = h * 60 + m
          
          // Check if we should notify
          const minutesUntilTask = taskMinutes - currentMinutes
          
          if (minutesUntilTask <= notifyBefore && minutesUntilTask > 0) {
            const sent = await sendTelegramNotification(data.telegramWebhook, task, minutesUntilTask)
            if (sent) {
              task.notified = true
              notificationsSent++
            }
          }
        }
        
        // Update tasks with notified flags
        const updatedData: SyncData = {
          ...data,
          tasks: JSON.stringify(tasks)
        }
        await updateSyncData(sync.blobId, updatedData)
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          checkedAt: now.toISOString(),
          notificationsSent 
        })
      }
    } catch (error) {
      console.error('Notification check error:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'Check failed' })
      }
    }
  }

  return {
    statusCode: 400,
    headers,
    body: JSON.stringify({ success: false, error: 'Invalid request' })
  }
}
