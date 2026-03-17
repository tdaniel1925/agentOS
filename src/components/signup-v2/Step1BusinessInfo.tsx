"use client"

import { useState } from "react"
import { BusinessDetails } from "@/types/signup-v2"
import { Building2, Phone, Globe, MapPin, FileText } from "lucide-react"

interface Step1Props {
  onBusinessSubmitted: (business: BusinessDetails) => void
}

export default function Step1BusinessInfo({ onBusinessSubmitted }: Step1Props) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    website: "",
    address: "",
    description: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Business name is required"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number"
    }

    if (!formData.address.trim()) {
      newErrors.address = "Business address is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Please tell us about your business"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Create BusinessDetails object
    const businessDetails: BusinessDetails = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      website: formData.website.trim() || null,
      address: formData.address.trim(),
      description: formData.description.trim(),
      formatted_address: formData.address.trim(),
    }

    onBusinessSubmitted(businessDetails)
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  return (
    <div className="w-full animate-slide-up">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          Tell us about your{" "}
          <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            business
          </span>
        </h1>
        <p className="text-base text-gray-600">
          We'll use this to train your custom AI receptionist
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">
              Business Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Joe's Pizza"
                className={`w-full pl-10 pr-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:border-purple-500 focus:ring-purple-200"
                }`}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">
              Business Phone Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="e.g., (555) 123-4567"
                className={`w-full pl-10 pr-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.phone
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:border-purple-500 focus:ring-purple-200"
                }`}
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>

          {/* Website (Optional) */}
          <div>
            <label htmlFor="website" className="block text-xs font-semibold text-gray-700 mb-1">
              Website <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="url"
                id="website"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="e.g., https://joespizza.com"
                className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-xs font-semibold text-gray-700 mb-1">
              Business Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="e.g., 123 Main St, New York, NY 10001"
                className={`w-full pl-10 pr-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.address
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:border-purple-500 focus:ring-purple-200"
                }`}
              />
            </div>
            {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-gray-700 mb-1">
              What does your business do? *
            </label>
            <div className="relative">
              <div className="absolute top-2 left-3 pointer-events-none">
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="e.g., We're a family-owned pizzeria serving authentic New York-style pizza since 1985."
                rows={3}
                className={`w-full pl-10 pr-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all resize-none ${
                  errors.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:border-purple-500 focus:ring-purple-200"
                }`}
              />
            </div>
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg hover:from-purple-700 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all shadow-lg hover:shadow-xl"
          >
            Continue to Training
          </button>
        </form>
      </div>

      <div className="mt-4 text-center">
        <div className="inline-flex items-center space-x-2 text-xs text-gray-500">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>7-day free trial • No credit card required</span>
        </div>
      </div>
    </div>
  )
}
