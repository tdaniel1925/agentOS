"use client"

import { useState, useEffect, useCallback } from "react"
import { BusinessDetails, BusinessPrediction } from "@/types/signup-v2"
import { Search, MapPin, ExternalLink } from "lucide-react"

interface Step1Props {
  onBusinessSelected: (business: BusinessDetails) => void
}

export default function Step1GoogleLookup({ onBusinessSelected }: Step1Props) {
  const [query, setQuery] = useState<string>("")
  const [predictions, setPredictions] = useState<BusinessPrediction[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    if (query.length < 3) {
      setPredictions([])
      return
    }

    const timer = setTimeout(() => {
      searchBusinesses(query)
    }, 500)

    return () => clearTimeout(timer)
  }, [query])

  const searchBusinesses = async (searchQuery: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/signup/google-business-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (!response.ok) {
        throw new Error("Failed to search businesses")
      }

      const data = await response.json()
      setPredictions(data.predictions || [])
    } catch (err) {
      setError("Failed to search. Please try again.")
      setPredictions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBusiness = async (prediction: BusinessPrediction) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/signup/google-business-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_id: prediction.place_id }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch business details")
      }

      const businessDetails: BusinessDetails = await response.json()
      onBusinessSelected(businessDetails)
    } catch (err) {
      setError("Failed to load business details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          Train Jordyn with your{" "}
          <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            Google Business Profile
          </span>
        </h1>
        <p className="text-lg text-gray-600">
          We'll automatically pull your business information to create your custom AI agent
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        <div className="space-y-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-gray-700">Find your profile by entering your business name</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-gray-700">Your AI agent trained on your Google profile</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-gray-700">Takes less than a minute</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your business name..."
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
          />
        </div>

        {loading && (
          <div className="mt-4 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {predictions.length > 0 && (
          <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                onClick={() => handleSelectBusiness(prediction)}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-purple-700">
                      {prediction.name}
                    </p>
                    <p className="text-sm text-gray-600">{prediction.address}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <a
          href="/signup/manual"
          className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Use my website instead</span>
        </a>
      </div>
    </div>
  )
}
