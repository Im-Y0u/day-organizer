'use client'

import { useState } from 'react'
import { useSettingsStore, testWebhookConnection } from '@/store/settingsStore'
import { useSyncStore } from '@/store/syncStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Send, CheckCircle2, XCircle, Loader2, Volume2, VolumeX, Play, Info, Webhook, MessageCircle, Clock, Cloud, Zap } from 'lucide-react'
import { soundManager } from '@/lib/sounds'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { 
    webhookUrl,
    setWebhookUrl,
    telegramWebhookUrl, 
    setTelegramWebhookUrl,
    notificationsEnabled,
    setNotificationsEnabled,
    notifyAtAlert,
    setNotifyAtAlert,
    notifyAtStart,
    setNotifyAtStart,
    notifyMinutesBefore,
    setNotifyMinutesBefore,
    soundEnabled,
    setSoundEnabled
  } = useSettingsStore()
  
  const { syncEnabled, storageKey } = useSyncStore()
  
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [testingUrl, setTestingUrl] = useState<string>('')
  
  const handleTestWebhook = async (url: string) => {
    if (!url) return
    
    setTestingUrl(url)
    setTestStatus('loading')
    setTestMessage('')
    
    const result = await testWebhookConnection(url)
    
    setTestStatus(result.success ? 'success' : 'error')
    setTestMessage(result.message)
    
    setTimeout(() => {
      setTestStatus('idle')
      setTestMessage('')
      setTestingUrl('')
    }, 5000)
  }
  
  const handleTestSound = () => {
    soundManager.play('notification')
  }
  
  const hasWebhook = webhookUrl || telegramWebhookUrl
  const canUseBackgroundNotifications = syncEnabled && storageKey && hasWebhook
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Background Notifications Status */}
          {hasWebhook && (
            <div className={`rounded-lg p-4 border ${
              canUseBackgroundNotifications 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {canUseBackgroundNotifications ? (
                  <Cloud className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  {canUseBackgroundNotifications ? (
                    <>
                      <p className="font-medium text-emerald-400">Background Notifications Active</p>
                      <p className="text-emerald-300/80 mt-1">
                        Webhooks will be sent automatically even when this site is closed.
                        The server checks for tasks every minute.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-amber-400">Enable 24/7 Notifications</p>
                      <p className="text-amber-300/80 mt-1">
                        Create a sync session to enable background notifications. 
                        The server will send webhooks even when this site is closed.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Sound Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              Sound Alerts
            </h3>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Enable Sounds</Label>
                <p className="text-xs text-slate-400">
                  Play sound when task notification triggers
                </p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={(enabled) => {
                  setSoundEnabled(enabled)
                  soundManager.setEnabled(enabled)
                }}
              />
            </div>
            
            {soundEnabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestSound}
                className="w-full border-slate-600 hover:bg-slate-800"
              >
                <Play className="w-4 h-4 mr-2" />
                Test Sound
              </Button>
            )}
          </div>
          
          {/* Divider */}
          <div className="border-t border-slate-700" />
          
          {/* Webhook Notifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-violet-400" />
              Webhook Notifications
            </h3>
            
            {/* Generic Webhook */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-indigo-400" />
                <Label className="text-sm font-medium">Webhook URL</Label>
              </div>
              <Input
                placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-slate-800 border-slate-600 font-mono text-xs"
              />
              <p className="text-xs text-slate-500">
                Works with Discord, Slack, or any custom webhook
              </p>
              
              {webhookUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestWebhook(webhookUrl)}
                  disabled={testStatus === 'loading'}
                  className="border-slate-600 hover:bg-slate-800"
                >
                  {testStatus === 'loading' && testingUrl === webhookUrl ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Test Webhook
                </Button>
              )}
            </div>
            
            {/* Telegram (Alternative) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                <Label className="text-sm font-medium">Telegram Webhook (Alternative)</Label>
              </div>
              
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 text-xs text-sky-300">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-2">How to get Telegram URL:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sky-200/80">
                      <li>Open Telegram, search @BotFather</li>
                      <li>Send /newbot, follow instructions</li>
                      <li>Copy bot token</li>
                      <li>Get chat ID from @userinfobot</li>
                      <li>Build: https://api.telegram.org/botTOKEN/sendMessage?chat_id=ID</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <Input
                placeholder="https://api.telegram.org/bot123456:ABC.../sendMessage?chat_id=123456789"
                value={telegramWebhookUrl}
                onChange={(e) => setTelegramWebhookUrl(e.target.value)}
                className="bg-slate-800 border-slate-600 font-mono text-xs"
              />
              
              {telegramWebhookUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestWebhook(telegramWebhookUrl)}
                  disabled={testStatus === 'loading'}
                  className="border-slate-600 hover:bg-slate-800"
                >
                  {testStatus === 'loading' && testingUrl === telegramWebhookUrl ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Test Telegram
                </Button>
              )}
            </div>
            
            {/* Test Result */}
            {testStatus !== 'idle' && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                testStatus === 'success' ? 'text-emerald-400 bg-emerald-500/10' :
                testStatus === 'error' ? 'text-rose-400 bg-rose-500/10' :
                'text-slate-400'
              }`}>
                {testStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {testStatus === 'error' && <XCircle className="w-4 h-4" />}
                {testStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                {testMessage}
              </div>
            )}
          </div>
          
          {/* Divider */}
          <div className="border-t border-slate-700" />
          
          {/* Notification Timing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              When to Notify
            </h3>
            
            {/* Enable Notifications */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Enable Notifications</Label>
                <p className="text-xs text-slate-400">
                  Send webhook notifications for tasks
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                disabled={!hasWebhook}
              />
            </div>
            
            {/* Alert Time Notification */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Before Task Starts</Label>
                <p className="text-xs text-slate-400">
                  Send notification X minutes before
                </p>
              </div>
              <Switch
                checked={notifyAtAlert}
                onCheckedChange={setNotifyAtAlert}
                disabled={!notificationsEnabled}
              />
            </div>
            
            {/* Alert Time Selector */}
            {notifyAtAlert && (
              <div className="pl-4">
                <Select 
                  value={notifyMinutesBefore.toString()} 
                  onValueChange={(v) => setNotifyMinutesBefore(parseInt(v))}
                  disabled={!notificationsEnabled}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minute before</SelectItem>
                    <SelectItem value="2">2 minutes before</SelectItem>
                    <SelectItem value="5">5 minutes before</SelectItem>
                    <SelectItem value="10">10 minutes before</SelectItem>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* At Start Notification */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">At Task Start</Label>
                <p className="text-xs text-slate-400">
                  Send notification when task begins
                </p>
              </div>
              <Switch
                checked={notifyAtStart}
                onCheckedChange={setNotifyAtStart}
                disabled={!notificationsEnabled}
              />
            </div>
          </div>
          
          {/* How it works */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-xs text-slate-400">
            <p className="font-medium text-slate-300 mb-2">🔔 How Notifications Work:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-violet-400">•</span>
                <span><strong>In-browser:</strong> Notifications work when the app is open</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span><strong>Background:</strong> Enable sync to get 24/7 notifications via Netlify Scheduled Functions (free)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span><strong>Check frequency:</strong> Server checks every minute for task notifications</span>
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full bg-violet-500 hover:bg-violet-600"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
