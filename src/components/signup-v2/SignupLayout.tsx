"use client"

import { ReactNode } from "react"
import { CheckCircle2, Phone, Zap, Shield, Clock } from "lucide-react"

interface SignupLayoutProps {
  children: ReactNode
}

export default function SignupLayout({ children }: SignupLayoutProps) {
  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-hidden">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Left Sidebar - Benefits Checklist */}
        <aside className="lg:w-1/3 bg-gradient-to-br from-purple-900 to-purple-700 text-white p-6 lg:p-8 overflow-y-auto">
          <div className="h-full flex flex-col justify-center">
            {/* Logo/Brand */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Jordyn AI</h2>
              <p className="text-purple-200 text-sm">Your 24/7 AI Phone Agent</p>
            </div>

            {/* Benefits List */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-0.5">Never Miss a Call</h3>
                  <p className="text-purple-200 text-xs">
                    Jordyn answers every call instantly, 24/7
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-0.5">Setup in Minutes</h3>
                  <p className="text-purple-200 text-xs">
                    Auto-trained on your business data
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-0.5">Risk-Free Trial</h3>
                  <p className="text-purple-200 text-xs">
                    7 days free. No credit card required
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-0.5">Save 20+ Hours/Week</h3>
                  <p className="text-purple-200 text-xs">
                    Let Jordyn handle routine calls
                  </p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="flex items-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-yellow-400"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white font-semibold text-sm mb-1">Trusted by 500+ businesses</p>
              <p className="text-purple-200 text-xs">
                "Jordyn transformed how we handle calls. Best investment!"
              </p>
              <p className="text-purple-300 text-xs mt-1">— Sarah M., Dental Practice Owner</p>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto flex items-center">
          <div className="w-full max-w-3xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
