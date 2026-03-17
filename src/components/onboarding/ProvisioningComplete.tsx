'use client'

/**
 * Provisioning Complete Component
 *
 * Success screen shown after phone number is provisioned
 * Displays the new number and next steps
 */

interface ProvisioningCompleteProps {
  phoneNumber: string
  onContinue: () => void
}

export function ProvisioningComplete({ phoneNumber, onContinue }: ProvisioningCompleteProps) {
  function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^1?(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return phone
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-green-600">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You're All Set!
        </h1>

        <p className="text-gray-600 mb-6">
          Jordan is ready to handle your calls and messages
        </p>

        {/* Phone Number Display */}
        <div className="bg-[#1B3A7D] text-white rounded-lg p-6 mb-6">
          <div className="text-sm opacity-90 mb-1">Your New Business Number</div>
          <div className="text-3xl font-bold">
            {formatPhoneNumber(phoneNumber)}
          </div>
        </div>

        {/* What's Included */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
          <div className="font-semibold text-green-900 mb-2">Included This Month:</div>
          <ul className="text-sm text-green-800 space-y-2">
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-600 flex-shrink-0">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              200 voice minutes
            </li>
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-600 flex-shrink-0">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              500 SMS messages
            </li>
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-600 flex-shrink-0">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              Unlimited AI responses
            </li>
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-600 flex-shrink-0">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              Call transcripts & summaries
            </li>
          </ul>
        </div>

        {/* Next Steps */}
        <div className="text-left mb-6">
          <div className="font-semibold mb-2">Next Steps:</div>
          <ol className="text-sm text-gray-700 space-y-2">
            <li>1. Forward your existing number to {formatPhoneNumber(phoneNumber)}</li>
            <li>2. Text Jordan commands from your phone</li>
            <li>3. Connect your email for inbox checking</li>
          </ol>
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold hover:bg-[#152d63] transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
