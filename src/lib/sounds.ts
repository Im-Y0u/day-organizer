// Sound alerts utility using Web Audio API

type SoundType = 'notification' | 'complete' | 'alert' | 'success'

class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return this.audioContext
  }
  
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }
  
  isEnabled() {
    return this.enabled
  }
  
  play(soundType: SoundType) {
    if (!this.enabled) return
    
    try {
      const ctx = this.getAudioContext()
      
      switch (soundType) {
        case 'notification':
          this.playNotification(ctx)
          break
        case 'complete':
          this.playComplete(ctx)
          break
        case 'alert':
          this.playAlert(ctx)
          break
        case 'success':
          this.playSuccess(ctx)
          break
      }
    } catch (e) {
      console.warn('Could not play sound:', e)
    }
  }
  
  private playNotification(ctx: AudioContext) {
    // Pleasant notification sound - two rising tones
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)
    
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1) // E5
    
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15) // E5
    osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.25) // G5
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.2)
    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.4)
  }
  
  private playComplete(ctx: AudioContext) {
    // Satisfying completion sound - quick ascending arpeggio
    const frequencies = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08)
      osc.type = 'sine'
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15)
      
      osc.start(ctx.currentTime + i * 0.08)
      osc.stop(ctx.currentTime + i * 0.08 + 0.15)
    })
  }
  
  private playAlert(ctx: AudioContext) {
    // Urgent alert sound - repeated beeps
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.frequency.setValueAtTime(880, ctx.currentTime + i * 0.15) // A5
      osc.type = 'square'
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.1)
      
      osc.start(ctx.currentTime + i * 0.15)
      osc.stop(ctx.currentTime + i * 0.15 + 0.1)
    }
  }
  
  private playSuccess(ctx: AudioContext) {
    // Celebratory success sound - major chord
    const frequencies = [523.25, 659.25, 783.99] // C major chord
    
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      osc.type = 'sine'
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    })
  }
}

// Singleton instance
export const soundManager = new SoundManager()

// Hook for using sound in components
import { useState, useEffect } from 'react'

export function useSound() {
  const [enabled, setEnabled] = useState(true)
  
  useEffect(() => {
    soundManager.setEnabled(enabled)
  }, [enabled])
  
  const playSound = (type: SoundType) => {
    soundManager.play(type)
  }
  
  return {
    soundEnabled: enabled,
    setSoundEnabled: setEnabled,
    playSound,
  }
}
