'use client'

/**
 * Industry Demo Widget
 * Let visitors choose their industry and hear a demo call recording
 */

import { useState } from 'react'

const industries = [
  {
    id: 'insurance',
    name: 'Insurance Agent',
    icon: '🛡️',
    description: 'Hear how Jordan handles policy renewals and quote follow-ups',
    audioUrl: '/demos/insurance-demo.mp3' // Placeholder - can be recorded later
  },
  {
    id: 'cpa',
    name: 'CPA / Tax Pro',
    icon: '📊',
    description: 'Hear how Jordan manages tax season and document requests',
    audioUrl: '/demos/cpa-demo.mp3'
  },
  {
    id: 'law',
    name: 'Attorney',
    icon: '⚖️',
    description: 'Hear how Jordan handles client intake and consultations',
    audioUrl: '/demos/law-demo.mp3'
  },
  {
    id: 'realestate',
    name: 'Real Estate Agent',
    icon: '🏡',
    description: 'Hear how Jordan nurtures leads and schedules showings',
    audioUrl: '/demos/realestate-demo.mp3'
  }
]

export function IndustryDemoWidget() {
  const [selectedIndustry, setSelectedIndustry] = useState(industries[0])
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = () => {
    // For now, show a message since we don't have recordings yet
    // In production, this would play the actual audio file
    alert(`Demo audio for ${selectedIndustry.name} will be added soon!\n\nFor now, call (651) 728-7626 to hear Jordan live!`)
    setIsPlaying(true)
    setTimeout(() => setIsPlaying(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Industry Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {industries.map((industry) => (
          <button
            key={industry.id}
            onClick={() => setSelectedIndustry(industry)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedIndustry.id === industry.id
                ? 'border-[#1B3A7D] bg-[#1B3A7D] text-white shadow-lg'
                : 'border-gray-200 bg-white hover:border-[#1B3A7D] text-gray-900'
            }`}
          >
            <div className="text-3xl mb-2">{industry.icon}</div>
            <div className="text-sm font-semibold">{industry.name}</div>
          </button>
        ))}
      </div>

      {/* Demo Player */}
      <div className="bg-gradient-to-br from-[#1B3A7D] to-[#2A4A8D] rounded-2xl p-8 md:p-12 text-white shadow-xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{selectedIndustry.icon}</div>
          <h3 className="text-2xl font-bold mb-2">{selectedIndustry.name}</h3>
          <p className="text-gray-200">{selectedIndustry.description}</p>
        </div>

        {/* Play Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="group relative w-24 h-24 bg-[#C7181F] hover:bg-[#A01419] rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg disabled:opacity-50"
          >
            {isPlaying ? (
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Call to Action */}
        <div className="text-center border-t border-white/20 pt-6">
          <p className="text-sm text-gray-200 mb-4">
            Or call now to hear Jordan live:
          </p>
          <a
            href="tel:+16517287626"
            className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg transition-all border border-white/20"
          >
            📞 (651) 728-7626
          </a>
        </div>
      </div>

      {/* Alternative: Text Demo Number */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-2">
          Prefer to text? Send <span className="font-mono bg-gray-100 px-2 py-1 rounded">DEMO</span> to:
        </p>
        <a
          href="sms:+16517287626?body=DEMO"
          className="inline-block px-6 py-3 border-2 border-[#1B3A7D] text-[#1B3A7D] font-semibold rounded-lg hover:bg-[#1B3A7D] hover:text-white transition-all"
        >
          💬 (651) 728-7626
        </a>
      </div>
    </div>
  )
}
