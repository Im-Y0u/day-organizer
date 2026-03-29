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
import { Settings, BarChart3, Undo2, Redo2, Flame, LayoutList, Clock, Grid3X3, Cloud, Download, Check, CalendarDays, Sparkles } from 'lucide-react'
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
  useAutoSync()

  useEffect(() => {
    mountedRef.current = true
  }, [])

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
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.12_0.015_265)] via-[oklch(0.14_0.02_280)] to-[oklch(0.12_0.015_265)] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/schedule" className="group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight gradient-text">
                    Day Organizer
                  </h1>
                  <p className="text-xs text-[oklch(0.5_0_0)]">Plan your day beautifully</p>
                </div>
              </div>
            </Link>
            
            <div className="flex items-center gap-1">
              {/* Undo/Redo */}
              <div className="flex items-center bg-[oklch(0.2_0.015_265)] rounded-lg p-0.5 mr-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => undo()}
                  disabled={!canUndo()}
                  className="h-8 w-8 text-[oklch(0.5_0_0)] hover:text-white hover:bg-white/5 disabled:opacity-30"
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => redo()}
                  disabled={!canRedo()}
                  className="h-8 w-8 text-[oklch(0.5_0_0)] hover:text-white hover:bg-white/5 disabled:opacity-30"
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </div>

              {currentStreak > 0 && (
                <Badge className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30 gap-1.5 px-3 py-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span className="font-semibold">{currentStreak}</span>
                </Badge>
              )}

              {syncEnabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePull}
                  disabled={isSyncing}
                  className={cn(
                    "h-9 w-9 rounded-lg",
                    justPulled 
                      ? "text-emerald-400 hover:text-emerald-300 bg-emerald-500/10" 
                      : "text-[oklch(0.5_0_0)] hover:text-sky-400 hover:bg-sky-500/10"
                  )}
                  title="Download from server"
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

              {onOpenSync && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenSync}
                  className={cn(
                    "h-9 w-9 rounded-lg",
                    syncEnabled 
                      ? "text-[oklch(0.72_0.2_280)] hover:text-[oklch(0.75_0.2_280)] bg-[oklch(0.72_0.2_280_/_0.1)]" 
                      : "text-[oklch(0.5_0_0)] hover:text-white hover:bg-white/5"
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
                  className="h-9 w-9 text-[oklch(0.5_0_0)] hover:text-white hover:bg-white/5 rounded-lg"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              )}

              {onOpenSettings && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenSettings}
                  className="h-9 w-9 text-[oklch(0.5_0_0)] hover:text-white hover:bg-white/5 rounded-lg"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="relative">
            <div className="flex items-center gap-1 bg-[oklch(0.18_0.018_265)]/80 backdrop-blur-sm p-1.5 rounded-2xl border border-white/5 shadow-lg">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} className="flex-1">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full gap-2 h-10 text-sm font-medium transition-all rounded-xl",
                        isActive
                          ? "bg-gradient-to-r from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] text-white shadow-lg shadow-purple-500/20"
                          : "text-[oklch(0.6_0_0)] hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </nav>
          
          {/* Sync status indicator */}
          {syncEnabled && lastSyncTime && (
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[oklch(0.5_0_0)]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Synced {new Date(lastSyncTime).toLocaleTimeString()}
              </span>
            </div>
          )}
        </header>

        <main className="animate-fade-in">
          {children}
        </main>

        <footer className="text-center text-xs text-[oklch(0.4_0_0)] mt-12 py-6 border-t border-white/5">
          <p className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
            Data saved locally in your browser
          </p>
          <p className="mt-1.5 text-[oklch(0.35_0_0)]">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[oklch(0.5_0_0)] text-[10px]">Ctrl+Z</kbd>
            <span className="mx-1">Undo</span>
            <span className="mx-2 text-[oklch(0.3_0_0)]">|</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[oklch(0.5_0_0)] text-[10px]">Ctrl+Y</kbd>
            <span className="mx-1">Redo</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
