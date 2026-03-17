"use client"

interface ProgressIndicatorProps {
  current: number
  total: number
}

export default function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  const percentage = (current / total) * 100

  return (
    <div className="w-full">
      {/* Step counter */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-purple-600">
          Step {current} of {total}
        </span>
        <span className="text-sm font-medium text-gray-500">{Math.round(percentage)}% Complete</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        >
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse-slow"></div>
        </div>
      </div>

      {/* Step dots (optional visual) */}
      <div className="flex items-center justify-center mt-6 space-x-3">
        {Array.from({ length: total }).map((_, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < current
          const isCurrent = stepNumber === current
          const isPending = stepNumber > current

          return (
            <div
              key={stepNumber}
              className={`flex items-center ${index < total - 1 ? "flex-1" : ""}`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  isComplete
                    ? "bg-green-500 text-white scale-100"
                    : isCurrent
                      ? "bg-purple-600 text-white scale-110 shadow-lg"
                      : "bg-gray-300 text-gray-600 scale-90"
                }`}
              >
                {isComplete ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-sm">{stepNumber}</span>
                )}
              </div>

              {index < total - 1 && (
                <div className="flex-1 h-1 mx-2 bg-gray-300 rounded">
                  <div
                    className={`h-full rounded transition-all duration-500 ${
                      stepNumber < current ? "bg-green-500 w-full" : "bg-transparent w-0"
                    }`}
                  ></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
