'use client'

interface UsageAlertsProps {
  subscriberId: string
}

export function UsageAlerts({ subscriberId }: UsageAlertsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Alert Settings</h2>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          You'll receive email alerts when you reach the following thresholds of your spending limit:
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-semibold">
                50%
              </div>
              <div>
                <div className="font-medium text-gray-900">Early Warning</div>
                <div className="text-xs text-gray-600">Alert at 50% of spending limit</div>
              </div>
            </div>
            <div className="text-green-600 font-semibold">✓ Active</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                80%
              </div>
              <div>
                <div className="font-medium text-gray-900">Approaching Limit</div>
                <div className="text-xs text-gray-600">Alert at 80% of spending limit</div>
              </div>
            </div>
            <div className="text-green-600 font-semibold">✓ Active</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                100%
              </div>
              <div>
                <div className="font-medium text-gray-900">Limit Reached</div>
                <div className="text-xs text-gray-600">Alert when spending limit is reached</div>
              </div>
            </div>
            <div className="text-green-600 font-semibold">✓ Active</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="text-sm text-blue-800">
              <div className="font-semibold mb-1">Automatic Protection</div>
              <p>
                When you reach 100% of your spending limit, all services will automatically pause
                to prevent unexpected charges. You can raise your limit anytime to resume services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
