'use client'

import { useState, useEffect } from 'react'
import { Task, useTaskStore, UrgencyLevel, URGENCY_LABELS } from '@/store/taskStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { Repeat, Sparkles } from 'lucide-react'

interface DailyTaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTask?: Task | null
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

const URGENCY_COLORS_SELECT: Record<UrgencyLevel, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-sky-500',
  high: 'bg-amber-500',
  urgent: 'bg-rose-500',
}

const URGENCY_DESCRIPTIONS: Record<UrgencyLevel, string> = {
  low: 'Flexible, can be done anytime',
  medium: 'Normal priority task',
  high: 'Important, needs attention soon',
  urgent: 'Critical, requires immediate action',
}

export function DailyTaskForm({ open, onOpenChange, editTask }: DailyTaskFormProps) {
  const { addDailyTask, updateDailyTask } = useTaskStore()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startHour, setStartHour] = useState('9')
  const [startMinute, setStartMinute] = useState('00')
  const [endHour, setEndHour] = useState('10')
  const [endMinute, setEndMinute] = useState('00')
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium')
  const [isQuick, setIsQuick] = useState(false)
  
  useEffect(() => {
    if (open) {
      if (editTask) {
        setTitle(editTask.title)
        setDescription(editTask.description || '')
        setStartHour(editTask.startTime.split(':')[0])
        setStartMinute(editTask.startTime.split(':')[1])
        setEndHour(editTask.endTime.split(':')[0])
        setEndMinute(editTask.endTime.split(':')[1])
        setUrgency(editTask.urgency || 'medium')
        setIsQuick(editTask.isQuick || false)
      } else {
        setTitle('')
        setDescription('')
        setStartHour('9')
        setStartMinute('00')
        setEndHour('10')
        setEndMinute('00')
        setUrgency('medium')
        setIsQuick(false)
      }
    }
  }, [open, editTask])
  
  const handleSubmit = () => {
    if (!title.trim()) return
    
    const startTime = `${startHour.padStart(2, '0')}:${startMinute.padStart(2, '0')}`
    const endTime = `${endHour.padStart(2, '0')}:${endMinute.padStart(2, '0')}`
    
    if (editTask) {
      updateDailyTask(editTask.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        startTime,
        endTime,
        urgency,
        isQuick,
      })
    } else {
      addDailyTask({
        title: title.trim(),
        description: description.trim() || undefined,
        startTime,
        endTime,
        urgency,
        isQuick,
      })
    }
    
    onOpenChange(false)
  }
  
  const formatHour = (h: string) => {
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${h12} ${ampm}`
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-gradient-to-br from-[oklch(0.16_0.018_265)] to-[oklch(0.14_0.015_265)] border-white/10 text-white max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Repeat className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">{editTask ? 'Edit Daily Task' : 'Add Daily Task'}</DialogTitle>
              {editTask && (
                <p className="text-sm text-[oklch(0.5_0_0)] mt-0.5">Editing: {editTask.title}</p>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-4 text-sm border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="w-4 h-4 text-emerald-400" />
              <p className="font-medium text-emerald-400">Daily Task</p>
            </div>
            <p className="text-[oklch(0.5_0_0)]">This task will automatically appear on your schedule every day.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-[oklch(0.8_0_0)]">Title</Label>
            <Input
              id="title"
              placeholder="What do you do every day?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="bg-white/5 border-white/10 focus:border-emerald-500 focus:ring-emerald-500/20 text-white placeholder:text-[oklch(0.4_0_0)] rounded-xl h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-[oklch(0.8_0_0)]">Description <span className="text-[oklch(0.4_0_0)]">(optional)</span></Label>
            <Input
              id="description"
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-emerald-500 focus:ring-emerald-500/20 text-white placeholder:text-[oklch(0.4_0_0)] rounded-xl h-11"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[oklch(0.8_0_0)]">Start Time</Label>
              <div className="flex gap-2">
                <Select value={startHour} onValueChange={setStartHour}>
                  <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[oklch(0.16_0.018_265)] border-white/10 rounded-xl">
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={h.toString()} className="hover:bg-white/10 text-[oklch(0.9_0_0)] rounded-lg">
                        {formatHour(h.toString())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={startMinute} onValueChange={setStartMinute}>
                  <SelectTrigger className="w-[70px] bg-white/5 border-white/10 text-white rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[oklch(0.16_0.018_265)] border-white/10 rounded-xl">
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={m.toString().padStart(2, '0')} className="hover:bg-white/10 text-[oklch(0.9_0_0)] rounded-lg">
                        :{m.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[oklch(0.8_0_0)]">End Time</Label>
              <div className="flex gap-2">
                <Select value={endHour} onValueChange={setEndHour}>
                  <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[oklch(0.16_0.018_265)] border-white/10 rounded-xl">
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={h.toString()} className="hover:bg-white/10 text-[oklch(0.9_0_0)] rounded-lg">
                        {formatHour(h.toString())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={endMinute} onValueChange={setEndMinute}>
                  <SelectTrigger className="w-[70px] bg-white/5 border-white/10 text-white rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[oklch(0.16_0.018_265)] border-white/10 rounded-xl">
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={m.toString().padStart(2, '0')} className="hover:bg-white/10 text-[oklch(0.9_0_0)] rounded-lg">
                        :{m.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Urgency Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[oklch(0.8_0_0)]">Urgency Level</Label>
            <Select value={urgency} onValueChange={(v) => setUrgency(v as UrgencyLevel)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[oklch(0.16_0.018_265)] border-white/10 rounded-xl">
                {(Object.keys(URGENCY_LABELS) as UrgencyLevel[]).map((level) => (
                  <SelectItem key={level} value={level} className="hover:bg-white/10 rounded-lg py-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2.5 h-2.5 rounded-full", URGENCY_COLORS_SELECT[level])} />
                      <span className="text-[oklch(0.9_0_0)]">{URGENCY_LABELS[level]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-[oklch(0.5_0_0)]">{URGENCY_DESCRIPTIONS[urgency]}</p>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-[oklch(0.8_0_0)]">Quick Task</Label>
              <p className="text-xs text-[oklch(0.5_0_0)]">Mark as a quick, easy-to-complete task</p>
            </div>
            <Switch
              checked={isQuick}
              onCheckedChange={setIsQuick}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2 pt-2 border-t border-white/5">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-white/10 hover:bg-white/5 rounded-xl h-11">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl h-11 shadow-lg shadow-emerald-500/20">
            {editTask ? 'Save Changes' : 'Add Daily Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
