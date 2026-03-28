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
  
  // Update form when editTask changes
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
        // Reset to defaults for new task
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
      <DialogContent className="sm:max-w-[420px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">{editTask ? 'Edit Daily Task' : 'Add Daily Task'}</DialogTitle>
          {editTask && (
            <p className="text-sm text-slate-400">Editing: {editTask.title}</p>
          )}
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          <div className="bg-emerald-500/10 rounded-lg p-3 text-sm border border-emerald-500/20">
            <p className="font-medium text-emerald-400">Daily Task</p>
            <p className="text-slate-400 mt-1">This task will automatically appear on your schedule every day.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input
              id="title"
              placeholder="What do you do every day?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="bg-slate-800 border-slate-600 focus:border-emerald-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description <span className="text-slate-500">(optional)</span></Label>
            <Input
              id="description"
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-800 border-slate-600 focus:border-emerald-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Time</Label>
              <div className="flex gap-2">
                <Select value={startHour} onValueChange={setStartHour}>
                  <SelectTrigger className="flex-1 bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={h.toString()} className="hover:bg-slate-700">
                        {formatHour(h.toString())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={startMinute} onValueChange={setStartMinute}>
                  <SelectTrigger className="w-[70px] bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={m.toString().padStart(2, '0')} className="hover:bg-slate-700">
                        :{m.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Time</Label>
              <div className="flex gap-2">
                <Select value={endHour} onValueChange={setEndHour}>
                  <SelectTrigger className="flex-1 bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={h.toString()} className="hover:bg-slate-700">
                        {formatHour(h.toString())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={endMinute} onValueChange={setEndMinute}>
                  <SelectTrigger className="w-[70px] bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={m.toString().padStart(2, '0')} className="hover:bg-slate-700">
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
            <Label className="text-sm font-medium">Urgency Level</Label>
            <Select value={urgency} onValueChange={(v) => setUrgency(v as UrgencyLevel)}>
              <SelectTrigger className="bg-slate-800 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {(Object.keys(URGENCY_LABELS) as UrgencyLevel[]).map((level) => (
                  <SelectItem key={level} value={level} className="hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", URGENCY_COLORS_SELECT[level])} />
                      {URGENCY_LABELS[level]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-500">How time-sensitive is this task?</p>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Quick Task</Label>
              <p className="text-xs text-slate-500">Mark as a quick, easy-to-complete task</p>
            </div>
            <Switch
              checked={isQuick}
              onCheckedChange={setIsQuick}
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-slate-600 hover:bg-slate-800">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
            {editTask ? 'Save Changes' : 'Add Daily Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
