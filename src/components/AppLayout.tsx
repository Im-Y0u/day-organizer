'use client'

import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { useStatsStore } from '@/store/statsStore'
import { useHistoryStore } from '@/store/historyStore'
import { useTaskStore } from '@/store/taskStore'
import { useNotifications } from '@/hooks/useNotifications'
import { useAutoSync } from '@/hooks/useAutoSync'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, BarChart3, Undo2, Redo2, Flame, LayoutList, Clock, Grid3X3, Cloud, Download, Check, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSyncStore } from '@/store/syncStore'

interface AppLayoutProps {
  children: React.ReactNode
  onOpenSettings?: () => void
  onOpenStats?: () => void
  onOpenSync?: () => void
}

export function AppLayout({ children, onOpenSettings, onOpenStats, onOpenSync }: AppLayoutProps) {
  const pathname = usePathname()
  const { soundEnabled } = useSettingsStore()
  const { currentStreak } = useStatsStore()
  const { canUndo, canRedo, undo, redo } = useHistoryStore()
  const restoreTasks = useTaskStore(state => state.restoreTasks)
  const { syncEnabled, isSyncing, lastSyncTime } = useSyncStore()
  const { pullFromServer } = useAutoSync()
  const mountedRef = useRef(false)
  const [justPulled, setJustPulled] = useState(false)

  useNotifications()
  useAutoSync() // Initialize auto-sync

  useEffect(() => {
    mountedRef.current = true
  }, [])

  // Handle pull (download from server)
  const handlePull = async () => {
    if (isSyncing || !syncEnabled) return
    
    setJustPulled(false)
    const result = await pullFromServer()
    
    if (result.success && result.data) {
      restoreTasks(result.data.tasks.filter(t => !t.deletedAt))
      setJustPulled(true)
      setTimeout(() => setJustPulled(false), 2000)
    }
  }

  const navItems = [
    { href: '/schedule', icon: LayoutList, label: 'Schedule' },
    { href: '/timeline', icon: Clock, label: 'Timeline' },
    { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
    { href: '/matrix', icon: Grid3X3, label: 'Matrix' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/schedule">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent cursor-pointer">
                Day Organizer
              </h1>
            </Link>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => undo()}
                disabled={!canUndo()}
                className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30"
                title="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => redo()}
                disabled={!canRedo()}
                className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30"
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>

              {currentStreak > 0 && (
                <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/20 gap-1 ml-2">
                  <Flame className="w-3.5 h-3.5" />
                  {currentStreak}
                </Badge>
              )}

              {/* Download button - only show when sync is enabled */}
              {syncEnabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePull}
                  disabled={isSyncing}
                  className={cn(
                    "h-8 w-8",
                    justPulled 
                      ? "text-emerald-400 hover:text-emerald-300" 
                      : "text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
                  )}
                  title="Download - Get latest data from server"
                >
                  {justPulled ? (
                    <Check className="h-4 w-4" />
                  ) : isSyncing ? (
                    <Download className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* Sync settings button */}
              {onOpenSync && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenSync}
                  className={cn(
                    "h-8 w-8",
                    syncEnabled 
                      ? "text-violet-400 hover:text-violet-300 hover:bg-violet-500/10" 
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                  )}
                  title="Sync settings"
                >
                  <Cloud className="h-4 w-4" />
                </Button>
              )}

              {onOpenStats && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenStats}
                  className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/5"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              )}

              {onOpenSettings && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenSettings}
                  className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/5"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 bg-slate-800/30 p-1 rounded-xl">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full gap-1 h-9 text-xs font-medium transition-all",
                      isActive
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
          
          {/* Sync status indicator */}
          {syncEnabled && lastSyncTime && (
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Synced {new Date(lastSyncTime).toLocaleTimeString()}
              </span>
            </div>
          )}
        </header>

        {children}

        <footer className="text-center text-xs text-slate-600 mt-8 py-4">
          <p>Data saved locally in your browser</p>
          <p className="mt-1 text-slate-700">Undo: Ctrl+Z • Redo: Ctrl+Y</p>
        </footer>
      </div>
    </div>
  )
}
