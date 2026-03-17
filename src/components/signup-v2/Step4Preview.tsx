"use client"

import { useState, useRef } from "react"
import { BusinessDetails, AudioSamples } from "@/types/signup-v2"
import { Play, Pause, Volume2 } from "lucide-react"

interface Step4Props {
  business: BusinessDetails
  audioSamples: AudioSamples
  onClaimAgent: () => void
}

interface AudioPlayerProps {
  label: string
  description: string
  audioUrl: string
}

function AudioPlayer({ label, description, audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="p-4 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm text-gray-900 mb-0.5">{label}</h3>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
        <Volume2 className="h-4 w-4 text-purple-600" />
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={togglePlay}
          className="flex-shrink-0 w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>

        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
    </div>
  )
}

export default function Step4Preview({ business, audioSamples, onClaimAgent }: Step4Props) {
  return (
    <div className="w-full animate-slide-up">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          Preview{" "}
          <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            {business.name}'s
          </span>{" "}
          Jordyn Agent
        </h1>
        <p className="text-base text-gray-600">
          Listen to how Jordyn will answer calls
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="space-y-2 mb-6">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-700">Jordyn trained on your business data</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-700">Listen to examples below</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-700">Claim your agent and get started free</p>
          </div>
        </div>

        <div className="space-y-3">
          <AudioPlayer
            label="Greeting Sample"
            description="How Jordyn answers incoming calls"
            audioUrl={audioSamples.greeting}
          />

          <AudioPlayer
            label="Message Taking Sample"
            description="How Jordyn handles message requests"
            audioUrl={audioSamples.message}
          />

          <AudioPlayer
            label="FAQ Sample"
            description="How Jordyn answers common questions"
            audioUrl={audioSamples.faq}
          />
        </div>
      </div>

      <button
        onClick={onClaimAgent}
        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
      >
        <span className="text-base">Claim My Agent</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </button>
    </div>
  )
}
