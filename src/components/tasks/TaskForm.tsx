'use client'

import { useState, useEffect } from 'react'
import { Task, useTaskStore, getTodayDate, UrgencyLevel, URGENCY_LABELS } from '@/store/taskStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format, addYears, addDays, addWeeks, addMonths, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isPast, isFuture, subDays } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Sparkles } from 'lucide-react'

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTask?: Task | null
  defaultDate?: string
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

export function TaskForm({ open, onOpenChange, editTask, defaultDate }: TaskFormProps) {
  const { addTask, updateTask } = useTaskStore()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [startHour, setStartHour] = useState('9')
  const [startMinute, setStartMinute] = useState('00')
  const [endHour, setEndHour] = useState('10')
  const [endMinute, setEndMinute] = useState('00')
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium')
  const [isQuick, setIsQuick] = useState(false)
  const [showFullCalendar, setShowFullCalendar] = useState(false)
  
  useEffect(() => {
    if (open) {
      if (editTask) {
        setTitle(editTask.title)
        setDescription(editTask.description || '')
        setSelectedDate(new Date(editTask.date + 'T00:00:00'))
        setStartHour(editTask.startTime.split(':')[0])
        setStartMinute(editTask.startTime.split(':')[1])
        setEndHour(editTask.endTime.split(':')[0])
        setEndMinute(editTask.endTime.split(':')[1])
        setUrgency(editTask.urgency || 'medium')
        setIsQuick(editTask.isQuick || false)
      } else {
        setTitle('')
        setDescription('')
        const date = defaultDate ? new Date(defaultDate + 'T00:00:00') : new Date()
        setSelectedDate(date)
        setStartHour('9')
        setStartMinute('00')
        setEndHour('10')
        setEndMinute('00')
        setUrgency('medium')
        setIsQuick(false)
      }
      setShowFullCalendar(false)
    }
  }, [open, editTask, defaultDate])
  
  const handleSubmit = () => {
    if (!title.trim()) return
    
    const startTime = `${startHour.padStart(2, '0')}:${startMinute.padStart(2, '0')}`
    const endTime = `${endHour.padStart(2, '0')}:${endMinute.padStart(2, '0')}`
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    
    if (editTask) {
      updateTask(editTask.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        date: dateStr,
        startTime,
        endTime,
        urgency,
        isQuick,
      })
    } else {
      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        startTime,
        endTime,
        date: dateStr,
        isDaily: false,
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

  // Generate quick date buttons
  const quickDates = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: '+1 Week', date: addWeeks(new Date(), 1) },
    { label: '+1 Month', date: addMonths(new Date(), 1) },
    { label: '+3 Months', date: addMonths(new Date(), 3) },
  ]

  // Generate week view dates (14 days around selected)
  const getWeekDates = () => {
    const dates = []
    for (let i = -3; i <= 10; i++) {
      dates.push(addDays(selectedDate, i))
    }
    return dates
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-gradient-to-br from-[oklch(0.16_0.018_265)] to-[oklch(0.14_0.015_265)] border-white/10 text-white max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">{editTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
              {editTask && (
                <p className="text-sm text-[oklch(0.5_0_0)] mt-0.5">Editing: {editTask.title}</p>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-[oklch(0.8_0_0)]">Title</Label>
            <Input
              id="title"
              placeholder="What do you need to do?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="bg-white/5 border-white/10 focus:border-[oklch(0.72_0.2_280)] focus:ring-[oklch(0.72_0.2_280_/_0.2)] text-white placeholder:text-[oklch(0.4_0_0)] rounded-xl h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-[oklch(0.8_0_0)]">Description <span className="text-[oklch(0.4_0_0)]">(optional)</span></Label>
            <Input
              id="description"
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-[oklch(0.72_0.2_280)] focus:ring-[oklch(0.72_0.2_280_/_0.2)] text-white placeholder:text-[oklch(0.4_0_0)] rounded-xl h-11"
            />
          </div>

          {/* Date Picker */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[oklch(0.8_0_0)]">Date</Label>
            
            {/* Quick date buttons */}
            <div className="flex gap-2 flex-wrap">
              {quickDates.map((qd) => (
                <Button
                  key={qd.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(qd.date)
                    setShowFullCalendar(false)
                  }}
                  className={cn(
                    "text-xs rounded-lg border-white/10 transition-all",
                    isSameDay(selectedDate, qd.date) 
                      ? "bg-gradient-to-r from-[oklch(0.72_0.2_280_/_0.2)] to-[oklch(0.7_0.22_320_/_0.2)] border-[oklch(0.72_0.2_280_/_0.3)] text-[oklch(0.72_0.2_280)]" 
                      : "bg-white/5 hover:bg-white/10 text-[oklch(0.7_0_0)]"
                  )}
                >
                  {qd.label}
                </Button>
              ))}
            </div>

            {/* Week strip */}
            <div className="grid grid-cols-7 gap-1">
              {getWeekDates().slice(0, 7).map((date) => (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date)
                    setShowFullCalendar(false)
                  }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-xl transition-all text-center",
                    isSameDay(selectedDate, date)
                      ? "bg-gradient-to-b from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] text-white shadow-lg shadow-purple-500/20"
                      : isToday(date)
                        ? "bg-white/10 text-white hover:bg-white/15"
                        : "bg-white/5 text-[oklch(0.6_0_0)] hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className="text-[10px] uppercase font-medium opacity-80">
                    {format(date, 'EEE')}
                  </span>
                  <span className="text-sm font-semibold mt-0.5">
                    {format(date, 'd')}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {getWeekDates().slice(7, 14).map((date) => (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date)
                    setShowFullCalendar(false)
                  }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-xl transition-all text-center",
                    isSameDay(selectedDate, date)
                      ? "bg-gradient-to-b from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] text-white shadow-lg shadow-purple-500/20"
                      : "bg-white/5 text-[oklch(0.6_0_0)] hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className="text-[10px] uppercase font-medium opacity-80">
                    {format(date, 'EEE')}
                  </span>
                  <span className="text-sm font-semibold mt-0.5">
                    {format(date, 'd')}
                  </span>
                </button>
              ))}
            </div>

            {/* Full calendar toggle */}
            <Popover open={showFullCalendar} onOpenChange={setShowFullCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between text-left font-normal bg-white/5 border-white/10 rounded-xl h-11",
                    !selectedDate && "text-[oklch(0.4_0_0)]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-[oklch(0.6_0_0)]" />
                    <span className="text-[oklch(0.8_0_0)]">{selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Pick a date'}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[oklch(0.5_0_0)]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[oklch(0.16_0.018_265)] border-white/10 rounded-xl" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date)
                      setShowFullCalendar(false)
                    }
                  }}
                  className="bg-transparent text-white rounded-xl"
                  classNames={{
                    day_selected: "bg-gradient-to-r from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] text-white hover:opacity-90 rounded-lg",
                    day_today: "bg-white/10 text-white ring-2 ring-[oklch(0.72_0.2_280_/_0.5)] rounded-lg",
                    day: "text-[oklch(0.7_0_0)] hover:bg-white/10 rounded-lg",
                    nav_button: "text-[oklch(0.7_0_0)] hover:text-white hover:bg-white/10 rounded-lg",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    caption: "text-[oklch(0.9_0_0)] flex justify-center py-2 relative",
                  }}
                />
              </PopoverContent>
            </Popover>
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
              className="data-[state=checked]:bg-[oklch(0.72_0.2_280)]"
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2 pt-2 border-t border-white/5">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-white/10 hover:bg-white/5 rounded-xl h-11">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()} className="flex-1 bg-gradient-to-r from-[oklch(0.72_0.2_280)] to-[oklch(0.7_0.22_320)] hover:from-[oklch(0.75_0.2_280)] hover:to-[oklch(0.73_0.22_320)] text-white rounded-xl h-11 shadow-lg shadow-purple-500/20">
            {editTask ? 'Save Changes' : 'Add Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
