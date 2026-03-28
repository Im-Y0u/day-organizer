'use client'

import { useState, useEffect, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTaskStore } from '@/store/taskStore'
import { useSyncStore, generateSyncCode } from '@/store/syncStore'
import { useAutoSync } from '@/hooks/useAutoSync'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Link2, Copy, Check, Cloud, CloudOff, 
  RefreshCw, Smartphone, Monitor, X, Loader2, 
  Wifi, WifiOff, Sync as SyncIcon
} from 'lucide-react'

interface SyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SyncDialog({ open, onOpenChange }: SyncDialogProps) {
  const { tasks } = useTaskStore()
  const {
    syncCode,
    storageKey,
    lastSyncTime,
    syncEnabled,
    autoSyncEnabled,
    isSyncing,
    error,
    setAutoSyncEnabled,
    clearSync,
    setError
  } = useSyncStore()
  
  const { createSync, joinSync, pushChanges, sync } = useAutoSync()
  
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinKey, setJoinKey] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mode, setMode] = useState<'menu' | 'join' | 'manage'>('menu')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  
  // Create sync URL for QR code
  const syncUrl = syncCode && storageKey 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/schedule?sync=${syncCode}&key=${storageKey}` 
    : ''
  
  // Check for sync params in URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const syncParam = urlParams.get('sync')
    const keyParam = urlParams.get('key')
    
    if (syncParam && keyParam) {
      // Auto-join from URL
      joinSync(syncParam, keyParam).then(result => {
        if (result.success) {
          setSuccess('Synced successfully!')
          setTimeout(() => setSuccess(null), 3000)
        }
        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname)
      })
    }
  }, [])
  
  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setLocalError(null)
      setSuccess(null)
      if (syncEnabled && syncCode) {
        setMode('manage')
      } else {
        setMode('menu')
      }
    }
  }, [open, syncEnabled, syncCode])
  
  // Create new sync session
  const handleCreateSync = async () => {
    setIsCreating(true)
    setLocalError(null)
    
    try {
      const result = await createSync()
      if (result.success) {
        setMode('manage')
        setSuccess('Sync created! Share the code with other devices.')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setLocalError('Failed to create sync. Please try again.')
      }
    } catch (err) {
      setLocalError('An error occurred. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }
  
  // Join existing sync
  const handleJoinSync = async () => {
    if (!joinKey.trim()) {
      setLocalError('Please enter a sync code')
      return
    }
    
    setIsJoining(true)
    setLocalError(null)
    
    try {
      const result = await joinSync(joinCode.trim() || generateSyncCode(), joinKey.trim())
      if (result.success) {
        setMode('manage')
        setSuccess('Connected to sync!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setLocalError('Failed to join. Check the code and try again.')
      }
    } catch (err) {
      setLocalError('An error occurred. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }
  
  // Manual sync
  const handleManualSync = async () => {
    await sync()
    setSuccess('Synced!')
    setTimeout(() => setSuccess(null), 2000)
  }
  
  // Leave sync
  const handleLeaveSync = () => {
    clearSync()
    setMode('menu')
    setJoinCode('')
    setJoinKey('')
    setSuccess('Sync disconnected')
    setTimeout(() => setSuccess(null), 2000)
  }
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  if (!open) return null
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      onClick={() => onOpenChange(false)}
    >
      <Card 
        className="bg-slate-900 border-slate-700 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cloud className="w-5 h-5 text-violet-400" />
            Sync Across Devices
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Success message */}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-400">
              {success}
            </div>
          )}
          
          {/* Error message */}
          {(error || localError) && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-400">
              {error || localError}
            </div>
          )}
          
          {/* Menu - Create or Join */}
          {mode === 'menu' && !syncEnabled && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400 text-center mb-4">
                Sync your tasks across all devices
              </p>
              
              <Button
                onClick={handleCreateSync}
                disabled={isCreating}
                className="w-full h-16 flex-col gap-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Monitor className="w-5 h-5" />
                    <span className="text-sm">Create New Sync</span>
                    <span className="text-xs opacity-75">Get an 8-character code</span>
                  </>
                )}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-2 text-slate-500">or</span>
                </div>
              </div>
              
              <Button
                onClick={() => setMode('join')}
                variant="outline"
                className="w-full h-16 flex-col gap-1 border-slate-600 hover:bg-slate-800"
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-sm">Join Existing Sync</span>
                <span className="text-xs opacity-75">Enter a sync key</span>
              </Button>
            </div>
          )}
          
          {/* Join mode - Enter key */}
          {mode === 'join' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Sync Key</Label>
                <Input
                  value={joinKey}
                  onChange={(e) => setJoinKey(e.target.value)}
                  placeholder="Paste the sync key here..."
                  className="text-sm bg-slate-800 border-slate-600 h-12 font-mono"
                />
                <p className="text-xs text-slate-500">
                  The key looks like: abc123def456
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setMode('menu')}
                  variant="ghost"
                  className="flex-1 text-slate-400"
                >
                  Back
                </Button>
                <Button
                  onClick={handleJoinSync}
                  disabled={isJoining || !joinKey.trim()}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600"
                >
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Join Sync
                </Button>
              </div>
            </div>
          )}
          
          {/* Manage - Show code and controls */}
          {mode === 'manage' && syncEnabled && syncCode && (
            <div className="space-y-4">
              {/* Sync Key */}
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-2">Your Sync Key (share this)</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-mono font-bold text-violet-400 bg-violet-500/10 px-4 py-2 rounded-lg break-all max-w-[280px]">
                    {storageKey}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(storageKey || '')}
                    className="h-10 w-10 shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              {/* QR Code */}
              {syncUrl && syncUrl.length < 2000 && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <QRCodeSVG 
                      value={syncUrl} 
                      size={160}
                      level="L"
                      includeMargin={false}
                    />
                  </div>
                </div>
              )}
              
              {/* Status */}
              <div className="flex items-center justify-center gap-2 text-sm">
                {autoSyncEnabled ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Wifi className="w-4 h-4" />
                    Auto-sync ON
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400">
                    <WifiOff className="w-4 h-4" />
                    Auto-sync OFF
                  </span>
                )}
              </div>
              
              {/* Auto-sync toggle */}
              <div className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg">
                <Label htmlFor="auto-sync" className="text-sm text-slate-300">
                  Auto-sync every 30 seconds
                </Label>
                <Switch
                  id="auto-sync"
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                />
              </div>
              
              {/* Last sync time */}
              {lastSyncTime && (
                <p className="text-xs text-slate-500 text-center">
                  Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
                </p>
              )}
              
              {/* Manual sync button */}
              <Button
                onClick={handleManualSync}
                disabled={isSyncing}
                variant="outline"
                className="w-full border-slate-600"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync Now
              </Button>
              
              {/* Leave sync */}
              <Button
                variant="ghost"
                onClick={handleLeaveSync}
                className="w-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
              >
                <CloudOff className="w-4 h-4 mr-2" />
                Disconnect Sync
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
