'use client'

interface UsageOverviewProps {
  usage: {
    voice_minutes_included: number
    voice_minutes_used: number
    voice_minutes_remaining: number
    voice_overage_minutes: number
    sms_messages_included: number
    sms_messages_used: number
    sms_messages_remaining: number
    sms_overage_count: number
    monthly_base_fee: number
    voice_overage_charges: number
    sms_overage_charges: number
    total_charges: number
  } | null
}

export function UsageOverview({ usage }: UsageOverviewProps) {
  if (!usage) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No usage data available yet.</p>
      </div>
    )
  }

  const voicePercentUsed = (usage.voice_minutes_used / usage.voice_minutes_included) * 100
  const smsPercentUsed = (usage.sms_messages_used / usage.sms_messages_included) * 100

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Voice Minutes Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Voice Minutes</h3>
          <span className="text-3xl">📞</span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Used</span>
              <span className="font-semibold text-gray-900">
                {usage.voice_minutes_used.toFixed(0)} / {usage.voice_minutes_included}
              </span>
            </div>
            <ProgressBar percent={voicePercentUsed} />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining</span>
            <span className="font-semibold text-gray-900">
              {usage.voice_minutes_remaining.toFixed(0)} min
            </span>
          </div>

          {usage.voice_overage_minutes > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-red-800">
                <span>⚠️</span>
                <div>
                  <div className="font-semibold">Overage: {usage.voice_overage_minutes.toFixed(0)} min</div>
                  <div className="text-xs">+${usage.voice_overage_charges.toFixed(2)} this month</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SMS Messages Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">SMS Messages</h3>
          <span className="text-3xl">💬</span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Used</span>
              <span className="font-semibold text-gray-900">
                {usage.sms_messages_used} / {usage.sms_messages_included}
              </span>
            </div>
            <ProgressBar percent={smsPercentUsed} />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining</span>
            <span className="font-semibold text-gray-900">
              {usage.sms_messages_remaining} messages
            </span>
          </div>

          {usage.sms_overage_count > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-red-800">
                <span>⚠️</span>
                <div>
                  <div className="font-semibold">Overage: {usage.sms_overage_count} msgs</div>
                  <div className="text-xs">+${usage.sms_overage_charges.toFixed(2)} this month</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Total Charges Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Bill</h3>
          <span className="text-3xl">💳</span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Subscription</span>
            <span className="text-gray-900">${usage.monthly_base_fee.toFixed(2)}</span>
          </div>

          {usage.voice_overage_charges > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Voice Overage</span>
              <span className="text-red-600">+${usage.voice_overage_charges.toFixed(2)}</span>
            </div>
          )}

          {usage.sms_overage_charges > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">SMS Overage</span>
              <span className="text-red-600">+${usage.sms_overage_charges.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-[#1B3A7D]">
                ${usage.total_charges.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Charges on next billing date
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  const color =
    percent >= 100 ? 'bg-red-500' :
    percent >= 80 ? 'bg-yellow-500' :
    'bg-green-500'

  return (
    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  )
}
