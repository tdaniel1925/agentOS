'use client'

/**
 * FAQ Component
 * Collapsible FAQ section
 */

import { useState } from 'react'

const faqs = [
  {
    question: 'How does Jordan know my business?',
    answer: 'During setup, you tell us about your business type, services, and common client questions. Jordan is trained specifically for your industry (insurance, CPA, law, real estate) and learns your specific business details. You can update Jordan\'s knowledge anytime via text.'
  },
  {
    question: 'What if Jordan doesn\'t know the answer?',
    answer: 'Jordan is smart enough to know when to ask you. If a client asks something Jordan can\'t handle, you\'ll get a text immediately with the question and client\'s contact info. You can respond and Jordan will relay your answer, or you can call the client directly.'
  },
  {
    question: 'Can I pause Jordan?',
    answer: 'Absolutely! Text "PAUSE" anytime and Jordan stops all outbound activity. Incoming calls still get answered, but Jordan won\'t make calls or send messages. Text "RESUME" when you\'re ready. Perfect for vacations or busy days.'
  },
  {
    question: 'Do I get my own phone number?',
    answer: 'Yes! We provision a dedicated phone number just for your business. You can forward your existing number to it, or give clients both numbers. All calls and texts to that number are handled by Jordan 24/7.'
  },
  {
    question: 'What about add-on skills?',
    answer: 'The $97/month base gives you call answering, text handling, and basic automation. Want more? Add skills on demand: Social Media Posting ($49/mo), Lead Generation ($49/mo), Email Campaigns ($49/mo), and more. Add or remove skills anytime via text.'
  },
  {
    question: 'How do I cancel?',
    answer: 'No contracts. No commitment. Text "CANCEL" and you\'re done at the end of your billing period. We\'ll send you all your data (call logs, contacts, transcripts) and your number can be ported if you want it.'
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
            <svg
              className={`w-5 h-5 text-[#1B3A7D] flex-shrink-0 transition-transform ${
                openIndex === index ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === index && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-gray-700">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
