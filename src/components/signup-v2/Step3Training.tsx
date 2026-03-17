"use client"

import { useState, useEffect } from "react"
import { BusinessDetails, AudioSamples } from "@/types/signup-v2"
import { CheckCircle2, Loader2 } from "lucide-react"

interface Step3Props {
  business: BusinessDetails
  onTrainingComplete: (assistant_id: string, audio: AudioSamples) => void
}

interface TrainingStep {
  label: string
  duration: number // milliseconds
}

const TRAINING_STEPS: TrainingStep[] = [
  { label: "Analyzing your website for data", duration: 5000 },
  { label: "Processing your business information", duration: 4000 },
  { label: "Optimizing your data for AI", duration: 4000 },
  { label: "Generating your custom Jordyn agent", duration: 5000 },
]

export default function Step3Training({ business, onTrainingComplete }: Step3Props) {
  const [progress, setProgress] = useState<number>(0)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Start training immediately
    startTraining()
  }, [])

  const startTraining = async () => {
    // Animate progress through steps
    let accumulatedTime = 0
    const totalDuration = TRAINING_STEPS.reduce((sum, step) => sum + step.duration, 0)

    // Animate progress
    const progressInterval = setInterval(() => {
      accumulatedTime += 100
      const newProgress = Math.min((accumulatedTime / totalDuration) * 100, 100)
      setProgress(newProgress)

      // Update current step
      let stepTime = 0
      for (let i = 0; i < TRAINING_STEPS.length; i++) {
        stepTime += TRAINING_STEPS[i].duration
        if (accumulatedTime < stepTime) {
          setCurrentStepIndex(i)
          break
        }
      }

      if (accumulatedTime >= totalDuration) {
        clearInterval(progressInterval)
        setCurrentStepIndex(TRAINING_STEPS.length)
      }
    }, 100)

    // Call backend API to actually train the agent
    try {
      const response = await fetch("/api/signup/train-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business }),
      })

      if (!response.ok) {
        throw new Error("Failed to train agent")
      }

      const data = await response.json()

      // Wait for animation to complete before proceeding
      setTimeout(
        () => {
          onTrainingComplete(data.assistant_id, data.audio_samples)
        },
        Math.max(0, totalDuration - accumulatedTime)
      )
    } catch (err) {
      clearInterval(progressInterval)
      setError("Training failed. Please try again.")
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          Building your{" "}
          <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            Jordyn Agent
          </span>
        </h1>
        <p className="text-lg text-gray-600">
          This will only take a few seconds. We're training Jordyn on your business data...
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Training Progress</span>
            <span className="text-sm font-semibold text-purple-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse-slow"></div>
            </div>
          </div>
        </div>

        {/* Training steps */}
        <div className="space-y-4">
          {TRAINING_STEPS.map((step, index) => {
            const isComplete = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            const isPending = index > currentStepIndex

            return (
              <div
                key={index}
                className={`flex items-start space-x-3 transition-all duration-300 ${
                  isCurrent ? "scale-105" : ""
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isComplete ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : isCurrent ? (
                    <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
                  ) : (
                    <div className="h-6 w-6 border-2 border-gray-300 rounded-full"></div>
                  )}
                </div>
                <p
                  className={`text-lg font-medium transition-colors ${
                    isComplete
                      ? "text-green-700"
                      : isCurrent
                        ? "text-purple-700"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          Please don't close this window. This process typically takes 15-20 seconds.
        </p>
      </div>
    </div>
  )
}
