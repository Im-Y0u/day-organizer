'use client'

import { Progress } from '@/components/ui/progress'

interface ProgressBarProps {
  completed: number
  total: number
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-200">Today&apos;s Progress</span>
        <span className="text-slate-400 font-medium">
          {completed} of {total} tasks
        </span>
      </div>
      <Progress 
        value={percentage} 
        className="h-3 bg-slate-700/50 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-fuchsia-500"
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">
          {percentage}% complete
        </div>
        {percentage === 100 && total > 0 && (
          <div className="text-xs text-emerald-400 font-medium">
            🎉 All tasks done!
          </div>
        )}
      </div>
    </div>
  )
}
