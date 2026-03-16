'use client'

/**
 * Provisioning Progress Component
 *
 * Displays animated progress while VAPI assistant is being created
 * Shows progress bar (0-100%) and status steps
 */

interface ProvisioningProgressProps {
  progress: number // 0-100
}

export function ProvisioningProgress({ progress }: ProvisioningProgressProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce">🤖</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Setting Up Jordan...
          </h1>
          <p className="text-gray-600">
            Creating your AI assistant. This takes about 30 seconds.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#1B3A7D] h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          {progress}% complete
        </div>

        {/* Status Messages */}
        <div className="mt-6 space-y-2">
          <StatusStep completed={progress >= 25} label="Creating AI model" />
          <StatusStep completed={progress >= 50} label="Configuring voice" />
          <StatusStep completed={progress >= 75} label="Setting up prompts" />
          <StatusStep completed={progress >= 100} label="Ready!" />
        </div>
      </div>
    </div>
  )
}

interface StatusStepProps {
  completed: boolean
  label: string
}

function StatusStep({ completed, label }: StatusStepProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {completed ? (
        <span className="text-green-600">✅</span>
      ) : (
        <span className="text-gray-400">⭕</span>
      )}
      <span className={completed ? 'text-gray-900' : 'text-gray-500'}>
        {label}
      </span>
    </div>
  )
}
