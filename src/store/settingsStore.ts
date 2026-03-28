import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  // Webhook URLs
  webhookUrl: string  // Generic webhook (Discord, Slack, custom)
  telegramWebhookUrl: string  // Telegram-specific
  
  // Notification settings
  notificationsEnabled: boolean
  notifyAtAlert: boolean  // Send at alert time (X minutes before)
  notifyAtStart: boolean  // Send at task start time
  notifyMinutesBefore: number
  
  // Sound
  soundEnabled: boolean
  soundVolume: number
  
  // Actions
  setWebhookUrl: (url: string) => void
  setTelegramWebhookUrl: (url: string) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setNotifyAtAlert: (enabled: boolean) => void
  setNotifyAtStart: (enabled: boolean) => void
  setNotifyMinutesBefore: (minutes: number) => void
  setSoundEnabled: (enabled: boolean) => void
  setSoundVolume: (volume: number) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      webhookUrl: '',
      telegramWebhookUrl: '',
      notificationsEnabled: false,
      notifyAtAlert: true,  // Default: send at alert time
      notifyAtStart: true,  // Default: send at task start
      notifyMinutesBefore: 5,
      soundEnabled: true,
      soundVolume: 0.5,
      
      setWebhookUrl: (url) => set({ webhookUrl: url }),
      setTelegramWebhookUrl: (url) => set({ telegramWebhookUrl: url }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setNotifyAtAlert: (enabled) => set({ notifyAtAlert: enabled }),
      setNotifyAtStart: (enabled) => set({ notifyAtStart: enabled }),
      setNotifyMinutesBefore: (minutes) => set({ notifyMinutesBefore: minutes }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setSoundVolume: (volume) => set({ soundVolume: volume }),
    }),
    {
      name: 'day-organizer-settings',
    }
  )
)

// Send webhook notification (supports multiple formats)
export async function sendWebhookNotification(
  webhookUrl: string,
  taskTitle: string,
  startTime: string,
  endTime: string,
  notificationType: 'alert' | 'start',
  minutesBefore?: number
): Promise<boolean> {
  if (!webhookUrl) return false
  
  try {
    const isTelegram = webhookUrl.includes('api.telegram.org')
    const isDiscord = webhookUrl.includes('discord.com/api/webhooks') || webhookUrl.includes('discordapp.com/api/webhooks')
    const isSlack = webhookUrl.includes('hooks.slack.com')
    
    let body: Record<string, unknown>
    
    if (isTelegram) {
      // Telegram format
      const emoji = notificationType === 'alert' ? '⏰' : '🚀'
      const timeText = notificationType === 'alert' 
        ? `Starting in ${minutesBefore} minutes!`
        : 'Starting NOW!'
      
      body = {
        text: `${emoji} *Task ${timeText}*\n\n📌 **${taskTitle}**\n🕐 Time: ${startTime} - ${endTime}`,
        parse_mode: 'Markdown',
      }
    } else if (isDiscord) {
      // Discord format
      const color = notificationType === 'alert' ? 0xFFA500 : 0x00FF00
      const title = notificationType === 'alert' 
        ? `⏰ Task Starting in ${minutesBefore} Minutes`
        : '🚀 Task Starting NOW!'
      
      body = {
        embeds: [{
          title,
          description: `**${taskTitle}**`,
          color,
          fields: [
            { name: 'Time', value: `${startTime} - ${endTime}`, inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      }
    } else if (isSlack) {
      // Slack format
      const emoji = notificationType === 'alert' ? ':alarm_clock:' : ':rocket:'
      const timeText = notificationType === 'alert' 
        ? `starting in ${minutesBefore} minutes`
        : 'starting NOW'
      
      body = {
        text: `${emoji} Task ${timeText}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${taskTitle}*\n_${startTime} - ${endTime}_`
            }
          }
        ]
      }
    } else {
      // Generic webhook format
      body = {
        title: taskTitle,
        startTime,
        endTime,
        notificationType,
        minutesBefore: notificationType === 'alert' ? minutesBefore : 0,
        timestamp: new Date().toISOString(),
        message: notificationType === 'alert' 
          ? `Task "${taskTitle}" starts in ${minutesBefore} minutes`
          : `Task "${taskTitle}" is starting now!`
      }
    }
    
    console.log(`Sending ${notificationType} webhook to:`, webhookUrl.substring(0, 50) + '...')
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Webhook error:', response.status, errorText)
      return false
    }
    
    console.log('Webhook sent successfully')
    return true
  } catch (error) {
    console.error('Failed to send webhook:', error)
    return false
  }
}

// Test webhook connection
export async function testWebhookConnection(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl) {
    return { success: false, message: 'No webhook URL provided' }
  }
  
  try {
    const isTelegram = webhookUrl.includes('api.telegram.org')
    const isDiscord = webhookUrl.includes('discord.com/api/webhooks') || webhookUrl.includes('discordapp.com/api/webhooks')
    const isSlack = webhookUrl.includes('hooks.slack.com')
    
    let body: Record<string, unknown>
    
    if (isTelegram) {
      body = {
        text: '✅ Day Organizer connected successfully!\n\nYou will receive task reminders here.',
        parse_mode: 'Markdown'
      }
    } else if (isDiscord) {
      body = {
        embeds: [{
          title: '✅ Day Organizer Connected',
          description: 'You will receive task reminders here.',
          color: 0x00FF00,
          timestamp: new Date().toISOString()
        }]
      }
    } else if (isSlack) {
      body = {
        text: '✅ Day Organizer connected successfully!',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '✅ *Day Organizer Connected*\nYou will receive task reminders here.'
            }
          }
        ]
      }
    } else {
      body = {
        test: true,
        message: 'Day Organizer connected successfully!',
        timestamp: new Date().toISOString()
      }
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (response.ok) {
      const platform = isTelegram ? 'Telegram' : isDiscord ? 'Discord' : isSlack ? 'Slack' : 'webhook'
      return { success: true, message: `Check your ${platform} for a test message!` }
    } else {
      return { success: false, message: `Error: ${response.status}. Check your webhook URL.` }
    }
  } catch (error) {
    return { success: false, message: 'Network error. Check your connection.' }
  }
}
