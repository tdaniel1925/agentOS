# AGENT 3: PHONE NUMBER PROVISIONING UI
**Status**: Ready to Build
**Priority**: P1 (Blocks onboarding)
**Estimated Time**: 4-5 hours
**Dependencies**: Phone provisioning API (already exists)

---

## MISSION
Build self-service UI for subscribers to choose and provision their business phone number during onboarding.

---

## SCOPE

### Files to CREATE
```
src/app/onboarding/[id]/page.tsx                    # Onboarding flow page
src/components/onboarding/ProvisioningProgress.tsx  # Progress indicator
src/components/onboarding/ZipCodeInput.tsx          # ZIP code form
src/components/onboarding/NumberPicker.tsx          # Phone number selection
src/components/onboarding/ProvisioningComplete.tsx  # Success screen
```

### Files to MODIFY
```
src/app/api/phone-numbers/search/route.ts           # CREATE - Search numbers API
```

---

## USER FLOW

```
1. Payment successful → Redirect to /onboarding/[subscriber_id]
2. Show "Setting up Jordan..." with progress bar
3. Poll /api/subscribers/[id] until vapi_assistant_id exists
4. When ready → Show "Get Your Business Number"
5. User enters ZIP code → Click "Search Numbers"
6. Call /api/phone-numbers/search?zipCode=94102
7. Display 10 available numbers
8. User selects number → Click "Continue"
9. Call /api/phone-numbers/provision (charges $15, provisions)
10. Show success screen with new number
11. Redirect to /dashboard
```

---

## API ENDPOINTS TO CREATE

### GET /api/phone-numbers/search
```typescript
// File: src/app/api/phone-numbers/search/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { searchAvailableNumbers, getAreaCodeFromZip } from '@/lib/phone-numbers/provision'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const zipCode = searchParams.get('zipCode')

  if (!zipCode || zipCode.length !== 5) {
    return NextResponse.json(
      { error: 'Valid 5-digit ZIP code required' },
      { status: 400 }
    )
  }

  try {
    // Convert ZIP to area code
    const areaCode = await getAreaCodeFromZip(zipCode)

    // Search Twilio
    const numbers = await searchAvailableNumbers(areaCode, 10)

    return NextResponse.json({
      success: true,
      areaCode,
      numbers
    })
  } catch (error) {
    console.error('Number search error:', error)
    return NextResponse.json(
      { error: 'Failed to search numbers', details: String(error) },
      { status: 500 }
    )
  }
}
```

---

## COMPONENT SPECS

### 1. Main Page: `src/app/onboarding/[id]/page.tsx`

**State Machine**:
```typescript
type OnboardingState =
  | 'loading'           // Checking subscriber status
  | 'provisioning'      // Creating assistant (automated)
  | 'choose_number'     // User selects ZIP & number
  | 'provisioning_number' // Purchasing number
  | 'complete'          // All done

const [state, setState] = useState<OnboardingState>('loading')
const [subscriber, setSubscriber] = useState<any>(null)
const [error, setError] = useState<string | null>(null)
```

**Polling Logic**:
```typescript
useEffect(() => {
  const pollInterval = setInterval(async () => {
    const res = await fetch(`/api/subscribers/${params.id}`)
    const data = await res.json()

    if (data.vapi_assistant_id) {
      setState('choose_number')
      clearInterval(pollInterval)
    }
  }, 3000) // Poll every 3 seconds

  // Timeout after 5 minutes
  setTimeout(() => {
    clearInterval(pollInterval)
    setError('Provisioning is taking longer than expected. Support has been notified.')
  }, 300000)

  return () => clearInterval(pollInterval)
}, [params.id])
```

**Render Logic**:
```tsx
{state === 'loading' && <LoadingScreen />}
{state === 'provisioning' && <ProvisioningProgress progress={progress} />}
{state === 'choose_number' && (
  <NumberChooser
    subscriberId={params.id}
    onComplete={() => setState('complete')}
  />
)}
{state === 'complete' && (
  <ProvisioningComplete
    phoneNumber={subscriber.vapi_phone_number}
    onContinue={() => router.push('/dashboard')}
  />
)}
{error && <ErrorScreen message={error} />}
```

---

### 2. Provisioning Progress: `src/components/onboarding/ProvisioningProgress.tsx`

```tsx
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
              className="bg-[#1B3A7D] h-full transition-all duration-500"
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

function StatusStep({ completed, label }: { completed: boolean; label: string }) {
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
```

---

### 3. Number Chooser: `src/components/onboarding/NumberChooser.tsx`

**State**:
```typescript
const [zipCode, setZipCode] = useState('')
const [numbers, setNumbers] = useState<AvailableNumber[]>([])
const [selectedNumber, setSelectedNumber] = useState<string | null>(null)
const [isSearching, setIsSearching] = useState(false)
const [isProvisioning, setIsProvisioning] = useState(false)
const [error, setError] = useState<string | null>(null)
```

**Search Handler**:
```typescript
async function handleSearch() {
  if (zipCode.length !== 5) {
    setError('Please enter a valid 5-digit ZIP code')
    return
  }

  setIsSearching(true)
  setError(null)

  try {
    const res = await fetch(`/api/phone-numbers/search?zipCode=${zipCode}`)
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to search numbers')
    }

    setNumbers(data.numbers)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Search failed')
  } finally {
    setIsSearching(false)
  }
}
```

**Provision Handler**:
```typescript
async function handleProvision() {
  if (!selectedNumber) return

  setIsProvisioning(true)
  setError(null)

  try {
    const res = await fetch('/api/phone-numbers/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriberId: props.subscriberId,
        phoneNumber: selectedNumber,
        areaCode: numbers[0].areaCode
      })
    })

    const data = await res.json()

    if (!res.ok) {
      if (res.status === 402) {
        throw new Error('Payment failed. Please update your payment method.')
      }
      throw new Error(data.error || 'Provisioning failed')
    }

    // Success!
    props.onComplete()
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Provisioning failed')
  } finally {
    setIsProvisioning(false)
  }
}
```

**Layout**:
```tsx
<div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
  <div className="max-w-2xl w-full">
    {/* Step 1: ZIP Code Input */}
    {numbers.length === 0 && (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2">Get Your Business Number</h1>
        <p className="text-gray-600 mb-6">
          Choose a local phone number for your business. We'll find available numbers in your area.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your ZIP Code
          </label>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="94102"
            maxLength={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={zipCode.length !== 5 || isSearching}
          className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search Available Numbers'}
        </button>

        <div className="mt-4 text-sm text-gray-600">
          💡 One-time setup fee: $15 • Includes 200 minutes and 500 SMS/month
        </div>
      </div>
    )}

    {/* Step 2: Number Selection */}
    {numbers.length > 0 && (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <button
          onClick={() => setNumbers([])}
          className="text-[#1B3A7D] text-sm mb-4"
        >
          ← Change ZIP Code
        </button>

        <h2 className="text-xl font-bold mb-4">
          Choose Your Number (Area Code {numbers[0].areaCode})
        </h2>

        <div className="space-y-2 mb-6">
          {numbers.map((number) => (
            <label
              key={number.phoneNumber}
              className={`
                block border-2 rounded-lg p-4 cursor-pointer transition
                ${selectedNumber === number.phoneNumber
                  ? 'border-[#1B3A7D] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <input
                type="radio"
                name="phone"
                value={number.phoneNumber}
                checked={selectedNumber === number.phoneNumber}
                onChange={() => setSelectedNumber(number.phoneNumber)}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">
                    {formatPhoneNumber(number.phoneNumber)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {number.locality}, {number.region}
                  </div>
                </div>
                {selectedNumber === number.phoneNumber && (
                  <span className="text-2xl">✅</span>
                )}
              </div>
            </label>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          onClick={handleProvision}
          disabled={!selectedNumber || isProvisioning}
          className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {isProvisioning ? 'Provisioning...' : 'Continue'}
        </button>

        <div className="mt-4 text-sm text-gray-600 text-center">
          💳 $15 setup fee will be charged to your card on file
        </div>
      </div>
    )}
  </div>
</div>
```

---

### 4. Provisioning Complete: `src/components/onboarding/ProvisioningComplete.tsx`

```tsx
interface ProvisioningCompleteProps {
  phoneNumber: string
  onContinue: () => void
}

export function ProvisioningComplete({ phoneNumber, onContinue }: ProvisioningCompleteProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>

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
          <ul className="text-sm text-green-800 space-y-1">
            <li>✅ 200 voice minutes</li>
            <li>✅ 500 SMS messages</li>
            <li>✅ Unlimited AI responses</li>
            <li>✅ Call transcripts & summaries</li>
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
          className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
```

---

## TESTING CHECKLIST

- [ ] Page loads after payment
- [ ] Progress bar animates during provisioning
- [ ] Poll detects when assistant is ready
- [ ] ZIP code input only accepts 5 digits
- [ ] Search returns 10 numbers
- [ ] Invalid ZIP shows error
- [ ] Number selection UI works
- [ ] Provision charges $15
- [ ] Provision failure shows error
- [ ] Success screen shows correct number
- [ ] "Go to Dashboard" redirects correctly
- [ ] Payment failure handled gracefully

---

## SUCCESS CRITERIA

1. User can choose their number without support help
2. Process completes in < 2 minutes
3. Clear error messages if something fails
4. Mobile-friendly UI

---

## FILES SUMMARY

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/onboarding/[id]/page.tsx` | ~200 | Main onboarding flow |
| `src/components/onboarding/ProvisioningProgress.tsx` | ~80 | Progress indicator |
| `src/components/onboarding/NumberChooser.tsx` | ~200 | ZIP & number selection |
| `src/components/onboarding/ProvisioningComplete.tsx` | ~80 | Success screen |
| `src/app/api/phone-numbers/search/route.ts` | ~40 | Number search API |

**Total**: ~600 lines of code
