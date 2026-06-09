/**
 * Playback Controls Component
 * PHASE 3: Speed control slider and playback management
 */

import React, { useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { useIDEStore } from '../store/ideStore'

interface Props {
  onPlay: () => void
  onPause: () => void
  onNextStep: () => void
  onPrevStep: () => void
  isPlaying: boolean
  currentStep: number
  totalSteps: number
}

export const PlaybackControls: React.FC<Props> = ({
  onPlay,
  onPause,
  onNextStep,
  onPrevStep,
  isPlaying,
  currentStep,
  totalSteps,
}) => {
  const { playbackSpeed, setPlaybackSpeed } = useIDEStore()
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.5, 2]

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    setShowSpeedMenu(false)
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
      {/* Step Counter */}
      <div className="text-xs text-gray-400 font-mono">
        {currentStep + 1} / {totalSteps}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-700" />

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevStep}
          disabled={currentStep === 0}
          className="p-1.5 hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous Step (←)"
        >
          <SkipBack size={16} className="text-cyan-400" />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          className="p-1.5 hover:bg-gray-800 rounded transition-colors"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause size={16} className="text-cyan-400" />
          ) : (
            <Play size={16} className="text-cyan-400" />
          )}
        </button>

        <button
          onClick={onNextStep}
          disabled={currentStep >= totalSteps - 1}
          className="p-1.5 hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next Step (→)"
        >
          <SkipForward size={16} className="text-cyan-400" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-700" />

      {/* Speed Control */}
      <div className="relative">
        <button
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-800 rounded transition-colors text-xs text-gray-300"
          title="Playback speed"
        >
          <Volume2 size={14} />
          <span className="font-mono">{playbackSpeed.toFixed(2)}x</span>
        </button>

        {/* Speed Menu */}
        {showSpeedMenu && (
          <div className="absolute bottom-full mb-2 left-0 bg-gray-950 border border-gray-700 rounded-lg shadow-lg z-50">
            {speedOptions.map(speed => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`w-full px-3 py-1.5 text-xs text-left hover:bg-gray-800 transition-colors font-mono ${
                  playbackSpeed === speed ? 'bg-cyan-900/50 text-cyan-300' : 'text-gray-300'
                }`}
              >
                {speed.toFixed(2)}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-[10px] text-gray-600 ml-2">
        Speed affects how fast steps play during auto-playback
      </div>
    </div>
  )
}
