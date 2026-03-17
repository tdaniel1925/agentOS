/**
 * AgentOS Landing Page - Simplified Above-The-Fold Design
 * Goal: Eliminate excessive scrolling, fit on one screen (1200-1400px viewport)
 * Structure: Hero + Benefits + Pricing + CTA + Footer
 */

export default function HomePage(): JSX.Element {
  return (
    <>
      {/* ============ NAV ============ */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-br from-[#1B3A7D] to-[#2A4A8D] rounded-lg flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12 8V4H8"></path>
                <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                <path d="M2 14h2"></path>
                <path d="M20 14h2"></path>
                <path d="M15 13v2"></path>
                <path d="M9 13v2"></path>
              </svg>
            </div>
            <span className="font-bold text-[#1B3A7D] text-lg tracking-tight">AgentOS</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#benefits" className="text-sm font-medium text-gray-600 hover:text-[#1B3A7D] transition-colors">Benefits</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-[#1B3A7D] transition-colors">Pricing</a>
          </div>
          <a href="/signup" className="bg-[#1B3A7D] hover:bg-[#2A4A8D] text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            Get Started
          </a>
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-20 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(27,58,125,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(27,58,125,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white border border-[#1B3A7D]/10 px-4 py-1.5 rounded-full text-[#1B3A7D] text-xs font-bold uppercase tracking-wider shadow-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live in 2 Minutes
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1B3A7D] mb-5 tracking-tight leading-[1.1]">
              Your AI Employee<br/>
              <span className="bg-gradient-to-r from-[#C7181F] to-[#E72833] bg-clip-text text-transparent">That Never Sleeps</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
              Automate client communication, scheduling, and follow-ups.<br className="hidden sm:block"/>
              Starting at <strong className="text-[#1B3A7D]">$97/month</strong>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <a href="/signup" className="w-full sm:w-auto bg-[#C7181F] hover:bg-[#A01419] text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg shadow-[#C7181F]/20 transition-all transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2 group">
                Get Started
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </a>
            </div>

            <div className="pt-6 border-t border-gray-200 max-w-2xl mx-auto">
              <p className="text-xs text-gray-500 font-medium mb-3">Trusted by professionals in</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-gray-400">
                <span>Insurance</span>
                <span className="text-gray-300">•</span>
                <span>Real Estate</span>
                <span className="text-gray-300">•</span>
                <span>Law</span>
                <span className="text-gray-300">•</span>
                <span>Accounting</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ KEY BENEFITS ============ */}
      <section id="benefits" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B3A7D] mb-3">Why Businesses Choose Jordan</h2>
            <p className="text-gray-500 text-lg">Everything you need to never miss a lead again</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Benefit 1 */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 hover:border-[#1B3A7D]/20 hover:shadow-lg transition-all group">
              <div className="w-16 h-16 bg-[#1B3A7D] rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 Availability</h3>
              <p className="text-gray-600 leading-relaxed">AI answers calls and texts instantly, day or night. Never miss a lead again.</p>
            </div>

            {/* Benefit 2 */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 hover:border-[#1B3A7D]/20 hover:shadow-lg transition-all group">
              <div className="w-16 h-16 bg-[#1B3A7D] rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Industry-Trained</h3>
              <p className="text-gray-600 leading-relaxed">Pre-configured for insurance, CPA, law, and real estate. Speaks your language.</p>
            </div>

            {/* Benefit 3 */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 hover:border-[#1B3A7D]/20 hover:shadow-lg transition-all group">
              <div className="w-16 h-16 bg-[#1B3A7D] rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Setup</h3>
              <p className="text-gray-600 leading-relaxed">Sign up, connect your calendar, go live. No training required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING SECTION ============ */}
      <section id="pricing" className="py-16 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B3A7D] mb-3">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-500">One price. Everything included.</p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C7181F] rounded-full blur-3xl opacity-10 -mr-10 -mt-10"></div>

              <div className="text-center mb-8 relative z-10">
                <div className="inline-block px-3 py-1 bg-[#C7181F]/10 text-[#C7181F] rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-[#1B3A7D] mb-2">AgentOS Base</h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-5xl md:text-6xl font-extrabold text-[#1B3A7D] tracking-tight">$97</span>
                  <span className="text-xl text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 font-medium">+ $15 one-time setup</p>
              </div>

              <div className="mb-8 relative z-10">
                <p className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">What's Included:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-green-600">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">200 call minutes/month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-green-600">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">500 SMS messages/month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-green-600">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Email & calendar integration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-green-600">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Industry-specific training</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-green-600">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Add-on skills available</span>
                  </li>
                </ul>
              </div>

              <a href="/signup" className="block w-full bg-[#C7181F] hover:bg-[#A01419] text-white font-bold text-center py-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative z-10">
                Get Started Now
              </a>

              <p className="text-center text-sm text-gray-500 mt-4 relative z-10">
                <strong className="text-gray-700">No contract.</strong> Cancel anytime with a text.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="py-16 bg-[#1B3A7D] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B3A7D]/50 to-[#1B3A7D]"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to hire your AI employee?</h2>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of professionals who never miss a lead.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/signup" className="w-full sm:w-auto bg-[#C7181F] hover:bg-[#A01419] text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg shadow-[#C7181F]/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
              Get Started
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </a>
          </div>

          <p className="text-sm text-blue-200 mt-6">
            Questions? <a href="mailto:support@theapexbots.com" className="underline hover:text-white transition-colors">Contact us</a>
          </p>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-white border-t border-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1B3A7D] rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-[#1B3A7D] text-lg tracking-tight">AgentOS</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="/privacy" className="hover:text-[#1B3A7D] transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-[#1B3A7D] transition-colors">Terms</a>
            <a href="mailto:support@theapexbots.com" className="hover:text-[#1B3A7D] transition-colors">Contact</a>
          </div>
          <div className="text-sm text-gray-500">
            © 2024 BotMakers Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}
