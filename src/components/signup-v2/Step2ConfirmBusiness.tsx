"use client"

import { BusinessDetails } from "@/types/signup-v2"
import { MapPin, Phone, Globe, Star, ArrowLeft } from "lucide-react"

interface Step2Props {
  business: BusinessDetails
  onConfirm: () => void
  onGoBack: () => void
}

export default function Step2ConfirmBusiness({ business, onConfirm, onGoBack }: Step2Props) {
  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          Is this your business profile?
        </h1>
        <p className="text-lg text-gray-600">
          We found this information from Google Business Profile
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-400 rounded-2xl flex items-center justify-center shadow-lg">
            <MapPin className="h-10 w-10 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{business.name}</h2>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{business.formatted_address || business.address}</p>
              </div>

              {business.phone && (
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{business.phone}</p>
                </div>
              )}

              {business.website && (
                <div className="flex items-start space-x-3">
                  <Globe className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 hover:underline"
                  >
                    {business.website}
                  </a>
                </div>
              )}

              {business.rating && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(business.rating || 0)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-700 font-medium">{business.rating.toFixed(1)}</span>
                  {business.review_count && (
                    <span className="text-gray-500">({business.review_count} reviews)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        <button
          onClick={onConfirm}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
        >
          <span>Yes, Train Jordyn</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>

        <button
          onClick={onGoBack}
          className="w-full py-4 px-6 text-purple-600 hover:text-purple-700 font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Search again</span>
        </button>
      </div>
    </div>
  )
}
