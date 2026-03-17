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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1B3A7D]/10 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[#1B3A7D]">
              <path d="M12 8V4H8"></path>
              <rect width="16" height="12" x="4" y="8" rx="2"></rect>
              <path d="M2 14h2"></path>
              <path d="M20 14h2"></path>
              <path d="M15 13v2"></path>
              <path d="M9 13v2"></path>
            </svg>
          </div>
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
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600 flex-shrink-0">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="m9 12 2 2 4-4"></path>
        </svg>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex-shrink-0"></div>
      )}
      <span className={completed ? 'text-gray-900' : 'text-gray-500'}>
        {label}
      </span>
    </div>
  )
}
