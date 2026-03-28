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
import { format, addYears, addDays, addWeeks, addMonths, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isPast, isFuture } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

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
  
  // Update form when editTask changes
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
        // Reset to defaults for new task
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

  // Generate week view dates (next 14 days)
  const weekDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{editTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          {editTask && (
            <p className="text-sm text-slate-400">Editing: {editTask.title}</p>
          )}
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input
              id="title"
              placeholder="What do you need to do?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="bg-slate-800 border-slate-600 focus:border-violet-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description <span className="text-slate-500">(optional)</span></Label>
            <Input
              id="description"
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-800 border-slate-600 focus:border-violet-500"
            />
          </div>

          {/* Date Picker - Simplified */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date</Label>
            
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
                    "text-xs border-slate-600 transition-all",
                    isSameDay(selectedDate, qd.date) 
                      ? "bg-violet-500/20 border-violet-500 text-violet-300" 
                      : "hover:bg-slate-800"
                  )}
                >
                  {qd.label}
                </Button>
              ))}
            </div>

            {/* Week strip - easy visual selection */}
            <div className="grid grid-cols-7 gap-1 mt-2">
              {weekDates.slice(0, 7).map((date) => (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date)
                    setShowFullCalendar(false)
                  }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg transition-all text-center",
                    isSameDay(selectedDate, date)
                      ? "bg-violet-500/30 border border-violet-500 text-violet-200"
                      : isToday(date)
                        ? "bg-slate-700/50 border border-slate-600 text-white hover:bg-slate-700"
                        : "bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                  )}
                >
                  <span className="text-[10px] uppercase opacity-70">
                    {format(date, 'EEE')}
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    isSameDay(selectedDate, date) && "text-violet-200"
                  )}>
                    {format(date, 'd')}
                  </span>
                </button>
              ))}
            </div>

            {/* Second week strip */}
            <div className="grid grid-cols-7 gap-1">
              {weekDates.slice(7, 14).map((date) => (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date)
                    setShowFullCalendar(false)
                  }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg transition-all text-center",
                    isSameDay(selectedDate, date)
                      ? "bg-violet-500/30 border border-violet-500 text-violet-200"
                      : "bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                  )}
                >
                  <span className="text-[10px] uppercase opacity-70">
                    {format(date, 'EEE')}
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    isSameDay(selectedDate, date) && "text-violet-200"
                  )}>
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
                    "w-full justify-between text-left font-normal bg-slate-800 border-slate-600 mt-2",
                    !selectedDate && "text-slate-400"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Pick a date'}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date)
                      setShowFullCalendar(false)
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="bg-slate-800 text-white rounded-lg"
                  classNames={{
                    day_selected: "bg-violet-500 text-white hover:bg-violet-600",
                    day_today: "bg-slate-700 text-white ring-2 ring-violet-500/50",
                    day_disabled: "text-slate-600 opacity-50",
                    day: "text-slate-300 hover:bg-slate-700 rounded-md",
                    nav_button: "text-slate-300 hover:text-white hover:bg-slate-700",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    caption: "text-slate-200 flex justify-center py-2 relative",
                  }}
                  fromDate={new Date()}
                  toDate={addYears(new Date(), 10)}
                />
              </PopoverContent>
            </Popover>
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
          <Button onClick={handleSubmit} disabled={!title.trim()} className="flex-1 bg-violet-500 hover:bg-violet-600">
            {editTask ? 'Save Changes' : 'Add Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
