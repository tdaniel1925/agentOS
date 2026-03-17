"use client"

import { ReactNode } from "react"
import { CheckCircle2, Phone, Zap, Shield, Clock } from "lucide-react"

interface SignupLayoutProps {
  children: ReactNode
}

export default function SignupLayout({ children }: SignupLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Sidebar - Benefits Checklist */}
        <aside className="lg:w-1/3 bg-gradient-to-br from-purple-900 to-purple-700 text-white p-8 lg:p-12">
          <div className="sticky top-8">
            {/* Logo/Brand */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-2">Jordyn AI</h2>
              <p className="text-purple-200">Your 24/7 AI Phone Agent</p>
            </div>

            {/* Benefits List */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Never Miss a Call</h3>
                  <p className="text-purple-200 text-sm">
                    Jordyn answers every call instantly, 24/7, even when you're busy
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Setup in Minutes</h3>
                  <p className="text-purple-200 text-sm">
                    Auto-trained on your business data. No complex configuration needed
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Risk-Free Trial</h3>
                  <p className="text-purple-200 text-sm">
                    7 days free. No credit card required. Cancel anytime
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Save 20+ Hours/Week</h3>
                  <p className="text-purple-200 text-sm">
                    Let Jordyn handle routine calls while you focus on what matters
                  </p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="flex items-center space-x-2 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white font-semibold mb-1">Trusted by 500+ businesses</p>
              <p className="text-purple-200 text-sm">
                "Jordyn transformed how we handle customer calls. Best investment we've made!"
              </p>
              <p className="text-purple-300 text-sm mt-2">— Sarah M., Dental Practice Owner</p>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
