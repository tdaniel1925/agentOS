"use client"

/**
 * Jordyn Landing Page - Professional Design
 * Converted from UXMagic Copilot export
 */

export default function HomePage() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        :root {
          --font-heading-name: 'Sora';
          --font-body-name: 'Inter';
          --font-heading: 'Sora', sans-serif;
          --font-body: 'Inter', sans-serif;
          --letter-spacing-heading: -0.5px;
          --letter-spacing-body: 0px;
          --space-base: 1rem;
          --radius-small: 10px;
          --radius-large: 20px;
          --border-width: 1px;
          --shadow-color: 168 85 247;
          --shadow-offset-x: 0px;
          --shadow-offset-y: 8px;
          --shadow-blur: 32px;
          --shadow-spread: 0px;
          --shadow-opacity: 0.15;
          --shadow-custom: 0px 8px 32px rgba(168, 85, 247, 0.15);
          --shadow-custom-hover: 0px 16px 48px rgba(168, 85, 247, 0.25);
        }

        .gradient-text {
          background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-gradient {
          background: radial-gradient(ellipse at top left, #f3e8ff 0%, #fdf2f8 40%, #faf5ff 100%);
        }

        .card-gradient {
          background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);
        }

        .cta-gradient {
          background: linear-gradient(135deg, #7e22ce 0%, #9333ea 50%, #db2777 100%);
        }

        .bubble-user {
          background: linear-gradient(135deg, #9333ea, #a855f7);
        }

        .bubble-jordyn {
          background: #ffffff;
          border: 1px solid #e9d5ff;
        }

        .nav-blur {
          backdrop-filter: blur(20px);
          background: rgba(250, 245, 255, 0.85);
        }

        .feature-icon-bg {
          background: linear-gradient(135deg, #f3e8ff, #fce7f3);
        }

        .pricing-card-featured {
          background: linear-gradient(135deg, #7e22ce 0%, #9333ea 50%, #c026d3 100%);
        }

        .testimonial-card {
          background: linear-gradient(135deg, #ffffff, #faf5ff);
          border: 1px solid #e9d5ff;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .float-animation {
          animation: float 5s ease-in-out infinite;
        }

        .glow-purple {
          box-shadow: 0 0 60px rgba(147, 51, 234, 0.25);
        }

        .chat-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(147, 51, 234, 0.1);
          border-radius: 20px;
        }
      `}</style>

      <div className="min-h-screen bg-white">
        {/* NAVIGATION */}
        <nav className="nav-blur sticky top-0 z-50 border-b border-purple-100" style={{ maxHeight: '80px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-large flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white"></path>
                  </svg>
                </div>
                <span className="font-heading font-bold text-xl text-gray-900">Jordyn.</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700">AI Receptionist</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">How It Works</a>
                <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Pricing</a>
                <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Reviews</a>
              </div>
              <div className="flex items-center gap-3">
                <a href="/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Sign In</a>
                <a href="/signup-v2" className="inline-flex items-center gap-2 px-4 py-2 rounded-small text-sm font-semibold text-white transition-all hover:shadow-custom-hover" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                  Start Free Trial
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* HERO SECTION */}
        <section className="hero-gradient relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #c084fc, transparent)' }}></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #f472b6, transparent)' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #9333ea, transparent)' }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-0 relative">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left z-10 pb-16 lg:pb-24">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 border-2 border-green-700 shadow-custom mb-6">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span className="text-sm font-bold text-white">Privacy-First AI Assistant</span>
                </div>

                <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-gray-900 leading-tight mb-6" style={{ letterSpacing: 'var(--letter-spacing-heading)' }}>
                  The safest AI for
                  <span className="gradient-text block">calls, email & calendar.</span>
                </h1>

                <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                  <span className="font-semibold text-brand-700">Jordyn.</span> manages your calls, emails, and calendar with <strong className="text-green-600">privacy-first design</strong>. Ephemeral email processing (deleted in 60 seconds), read-only calendar access (no OAuth), and secure SMS commands. Your data stays private. All for just <strong className="text-brand-700">$97/month</strong>.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                  <a href="/signup-v2" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-small font-semibold text-white text-base transition-all hover:shadow-custom-hover hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"></path></svg>
                    Start 7-Day Free Trial
                  </a>
                  <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-small font-semibold text-brand-700 text-base bg-white border-2 border-brand-200 hover:border-brand-400 transition-all">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    See How It Works
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-sm text-gray-600">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-sm text-gray-600">2-minute setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-sm text-gray-600">Cancel anytime</span>
                  </div>
                </div>
              </div>

              {/* Right: Phone Mockup */}
              <div className="flex justify-center lg:justify-end relative z-10 h-[700px] lg:h-[800px] w-full items-end overflow-hidden">
                <div className="relative w-full max-w-[480px] lg:max-w-[520px] transform translate-y-12 lg:translate-y-16 transition-transform duration-700 hover:-translate-y-2">
                  {/* Phone Frame */}
                  <div className="relative w-full rounded-t-[3rem] lg:rounded-[3.5rem] overflow-hidden shadow-2xl glow-purple border-[12px] border-gray-900 bg-gray-900" style={{ boxShadow: '0 30px 80px rgba(147, 51, 234, 0.35)' }}>
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-3xl z-20"></div>

                    {/* Screen Content */}
                    <div className="bg-gray-50 flex flex-col h-[750px] w-full relative overflow-hidden rounded-t-[2.5rem]">
                      {/* Status Bar */}
                      <div className="h-14 bg-white w-full shrink-0 z-10 border-b border-gray-100 flex items-end pb-3 px-8 justify-between">
                        <span className="text-gray-900 font-bold text-sm">9:41</span>
                        <div className="flex gap-1.5">
                          <div className="w-4 h-4 bg-gray-900 rounded-full opacity-20"></div>
                          <div className="w-4 h-4 bg-gray-900 rounded-full opacity-20"></div>
                        </div>
                      </div>

                      {/* Chat Header */}
                      <div className="bg-white px-6 py-4 flex items-center gap-4 shrink-0 border-b border-gray-100 shadow-sm z-10">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path></svg>
                        </div>
                        <div>
                          <p className="text-gray-900 font-bold text-xl">Jordyn.</p>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                            <p className="text-green-600 text-sm font-medium">Active now</p>
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="bg-gray-50 px-5 py-6 space-y-6 flex-1 overflow-y-auto chat-scroll pb-32">
                        {/* Jordyn intro */}
                        <div className="flex items-end gap-3">
                          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path></svg>
                          </div>
                          <div className="bubble-jordyn rounded-2xl rounded-bl-none px-5 py-4 max-w-[85%] shadow-sm">
                            <p className="text-gray-800 text-lg leading-relaxed">Hey! I'm Jordyn. 👋 Your AI receptionist is ready.</p>
                            <p className="text-gray-400 text-xs mt-2 font-medium">9:32 AM</p>
                          </div>
                        </div>

                        {/* User message */}
                        <div className="flex justify-end">
                          <div className="bubble-user rounded-2xl rounded-br-none px-5 py-4 max-w-[85%] shadow-md">
                            <p className="text-white text-lg leading-relaxed font-medium">Call John and check if he can make it to dinner tomorrow evening</p>
                            <div className="flex justify-end items-center gap-1 mt-2">
                              <p className="text-purple-200 text-xs font-medium">9:33 AM</p>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e9d5ff" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                          </div>
                        </div>

                        {/* Jordyn response */}
                        <div className="flex items-end gap-3">
                          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path></svg>
                          </div>
                          <div className="bubble-jordyn rounded-2xl rounded-bl-none px-5 py-4 max-w-[85%] shadow-sm">
                            <p className="text-gray-800 text-lg leading-relaxed">On it! 📞 Calling John now...</p>
                            <p className="text-gray-400 text-xs mt-2 font-medium">9:33 AM</p>
                          </div>
                        </div>

                        {/* Call indicator */}
                        <div className="flex justify-center py-2">
                          <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-green-50 border border-green-200 shadow-sm">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-green-700 text-sm font-semibold">Call in progress · 0:47</span>
                          </div>
                        </div>

                        {/* Jordyn confirmation */}
                        <div className="flex items-end gap-3">
                          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path></svg>
                          </div>
                          <div className="bubble-jordyn rounded-2xl rounded-bl-none px-5 py-4 max-w-[90%] shadow-sm border-l-4 border-l-green-400">
                            <p className="text-gray-800 text-lg leading-relaxed">✅ <strong>Done!</strong> Spoke with John. He confirmed he <strong>can make it</strong> to dinner tomorrow evening! He said 7 PM works great for him 🎉</p>
                            <p className="text-gray-400 text-xs mt-2 font-medium">9:34 AM</p>
                          </div>
                        </div>

                        {/* User reaction */}
                        <div className="flex justify-end">
                          <div className="bubble-user rounded-2xl rounded-br-none px-5 py-4 max-w-[85%] shadow-md">
                            <p className="text-white text-lg font-medium">Perfect, thanks Jordyn! 🙌</p>
                            <div className="flex justify-end items-center gap-1 mt-2">
                              <p className="text-purple-200 text-xs font-medium">9:34 AM</p>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e9d5ff" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Input Bar */}
                      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-5 flex items-center gap-4 z-20">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"></path></svg>
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full px-5 py-3.5 border border-transparent focus-within:border-brand-300 focus-within:bg-white transition-all">
                          <p className="text-gray-400 text-base">Message Jordyn....</p>
                        </div>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="py-12 bg-white border-y border-brand-100" style={{ maxHeight: '200px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="font-heading font-bold text-3xl lg:text-4xl gradient-text">24/7</p>
                <p className="text-sm text-gray-500 mt-1">Always Available</p>
              </div>
              <div>
                <p className="font-heading font-bold text-3xl lg:text-4xl gradient-text">2 min</p>
                <p className="text-sm text-gray-500 mt-1">Setup Time</p>
              </div>
              <div>
                <p className="font-heading font-bold text-3xl lg:text-4xl gradient-text">$97</p>
                <p className="text-sm text-gray-500 mt-1">Per Month</p>
              </div>
              <div>
                <p className="font-heading font-bold text-3xl lg:text-4xl gradient-text">500+</p>
                <p className="text-sm text-gray-500 mt-1">Businesses Served</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-20 bg-brand-50" style={{ maxHeight: '1100px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 rounded-full bg-green-600 text-white text-sm font-semibold mb-4 border-2 border-green-700">Everything You Need</span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-gray-900 mb-4" style={{ letterSpacing: 'var(--letter-spacing-heading)' }}>
                Your Receptionist,
                <span className="gradient-text"> Supercharged</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto"><span className="font-semibold">Jordyn.</span> handles everything a human receptionist would — and more — without the $3,000/month salary.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card-gradient rounded-large p-6 border border-brand-200 shadow-custom hover:shadow-custom-hover transition-all hover:-translate-y-1">
                <div className="feature-icon-bg w-12 h-12 rounded-large flex items-center justify-center mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"></path></svg>
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Answers Calls 24/7</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Never miss a customer call again. <span className="font-semibold">Jordyn.</span> picks up every call instantly — nights, weekends, holidays — with a natural, friendly voice.</p>
              </div>

              <div className="card-gradient rounded-large p-6 border border-brand-200 shadow-custom hover:shadow-custom-hover transition-all hover:-translate-y-1">
                <div className="feature-icon-bg w-12 h-12 rounded-large flex items-center justify-center mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Smart Calendar Booking</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3"><span className="font-semibold">Jordyn.</span> connects to any calendar (Google, Outlook, iCloud), checks for conflicts, and books appointments automatically. Email invites sent to both parties instantly.</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-600 border border-green-700">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span className="text-white text-xs font-semibold">Privacy-First: Read-only access, no OAuth</span>
                </div>
              </div>

              <div className="card-gradient rounded-large p-6 border border-green-200 shadow-custom hover:shadow-custom-hover transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-large flex items-center justify-center mb-4 bg-green-100">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m2 7 10 7 10-7"></path></svg>
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Ephemeral Email Processing</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">Forward emails to your unique Jordyn address. AI analyzes and texts you summaries. <strong className="text-green-600">Full content deleted in 60 seconds</strong>. Only metadata stored.</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-600 border border-green-700">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span className="text-white text-xs font-semibold">Industry-first: 60-second deletion</span>
                </div>
              </div>

              <div className="card-gradient rounded-large p-6 border border-brand-200 shadow-custom hover:shadow-custom-hover transition-all hover:-translate-y-1">
                <div className="feature-icon-bg w-12 h-12 rounded-large flex items-center justify-center mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Trained on Your Business</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Feed <span className="font-semibold">Jordyn.</span> your website, FAQs, and service info. She'll answer customer questions accurately, just like a trained staff member would.</p>
              </div>

              <div className="card-gradient rounded-large p-6 border border-brand-200 shadow-custom hover:shadow-custom-hover transition-all hover:-translate-y-1">
                <div className="feature-icon-bg w-12 h-12 rounded-large flex items-center justify-center mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Text-to-Action Control</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Just text <span className="font-semibold">Jordyn.</span> a command — "Call John and confirm dinner tomorrow" — and she handles the entire call for you instantly.</p>
              </div>

              <div className="card-gradient rounded-large p-6 border border-brand-200 shadow-custom hover:shadow-custom-hover transition-all hover:-translate-y-1">
                <div className="feature-icon-bg w-12 h-12 rounded-large flex items-center justify-center mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Natural Voice (ElevenLabs)</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Powered by ElevenLabs TTS, <span className="font-semibold">Jordyn.</span> sounds completely human. Customers won't even know they're talking to an AI.</p>
              </div>

              <div className="card-gradient rounded-large p-6 border border-brand-200 shadow-custom hover:shadow-custom-hover transition-all hover:-translate-y-1">
                <div className="feature-icon-bg w-12 h-12 rounded-large flex items-center justify-center mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Powered by Claude AI</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Built on Anthropic's Claude — one of the most advanced AI models — ensuring intelligent, context-aware conversations every time.</p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 bg-white" style={{ maxHeight: '900px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 rounded-full bg-green-600 text-white text-sm font-semibold mb-4 border-2 border-green-700">Simple Setup</span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-gray-900 mb-4" style={{ letterSpacing: 'var(--letter-spacing-heading)' }}>
                Up &amp; Running in
                <span className="gradient-text"> 2 Minutes</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">No technical knowledge required. No complex configuration. Just three simple steps.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5" style={{ background: 'linear-gradient(90deg, #d8b4fe, #f9a8d4)' }}></div>

              <div className="text-center relative">
                <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-white font-heading font-bold text-xl relative z-10" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>1</div>
                <div className="card-gradient rounded-large p-6 border border-brand-200 shadow-custom">
                  <div className="w-10 h-10 feature-icon-bg rounded-large flex items-center justify-center mx-auto mb-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path></svg>
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Connect Your Business</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Share your website URL, FAQs, and calendar link. <span className="font-semibold">Jordyn.</span> learns your business and checks availability automatically — no OAuth needed, just a read-only calendar feed.</p>
                </div>
              </div>

              <div className="text-center relative">
                <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-white font-heading font-bold text-xl relative z-10" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>2</div>
                <div className="card-gradient rounded-large p-6 border border-brand-200 shadow-custom">
                  <div className="w-10 h-10 feature-icon-bg rounded-large flex items-center justify-center mx-auto mb-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"></path></svg>
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Forward Your Number</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Forward your business calls to <span className="font-semibold">Jordyn.</span>'s number. Takes 30 seconds with any phone carrier — no new hardware needed.</p>
                </div>
              </div>

              <div className="text-center relative">
                <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-white font-heading font-bold text-xl relative z-10" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>3</div>
                <div className="card-gradient rounded-large p-6 border border-brand-200 shadow-custom">
                  <div className="w-10 h-10 feature-icon-bg rounded-large flex items-center justify-center mx-auto mb-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2"><span className="font-semibold">Jordyn.</span> Takes Over</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">That's it! <span className="font-semibold">Jordyn.</span> starts answering calls immediately. You get real-time summaries of every call and booking via text.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRIVACY-FIRST SECTION */}
        <section className="py-20" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', maxHeight: '800px' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 border-2 border-green-700 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <span className="text-white text-sm font-bold">Privacy-First by Design</span>
              </div>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 mb-4" style={{ letterSpacing: 'var(--letter-spacing-heading)' }}>
                Why <span className="text-green-600">Jordyn</span> is Safer Than Other AI Assistants
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">Most AI assistants require full access to your accounts. <strong>Not Jordyn.</strong> We built privacy and security into every feature.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Email Privacy */}
              <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-lg">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4 mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m2 7 10 7 10-7"></path></svg>
                </div>
                <h3 className="font-heading font-bold text-lg text-gray-900 mb-3 text-center">Ephemeral Email</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-sm text-gray-700"><strong className="text-green-600">60-second deletion</strong> - Content never stored</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-sm text-gray-700">Only metadata saved (sender, subject, category)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-sm text-gray-700">You control what we see (forward only what you want)</span>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700"><strong>Other AI:</strong> Stores full email content, requires OAuth write access to your inbox</p>
                </div>
              </div>

              {/* Calendar Privacy */}
              <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-lg">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4 mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <h3 className="font-heading font-bold text-lg text-gray-900 mb-3 text-center">Read-Only Calendar</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-sm text-gray-700"><strong className="text-green-600">No OAuth</strong> - Simple iCal feed</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-sm text-gray-700">Read-only access (Jordyn can't modify events)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-sm text-gray-700">Works with any provider (Google, Outlook, iCloud)</span>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700"><strong>Other AI:</strong> Requires OAuth with write permissions to create/edit events in your calendar</p>
                </div>
              </div>

              {/* SMS Privacy */}
              <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-lg">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4 mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>
                </div>
                <h3 className="font-heading font-bold text-lg text-gray-900 mb-3 text-center">Secure Commands</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-sm text-gray-700"><strong className="text-green-600">Encrypted SMS</strong> commands</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-sm text-gray-700">You review email drafts before sending</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-sm text-gray-700">Jordyn never sends emails on your behalf</span>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700"><strong>Other AI:</strong> Auto-sends emails without your review, exposing your reputation</p>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center">
              <div className="inline-block bg-white border-2 border-green-300 rounded-xl p-6 shadow-lg max-w-3xl">
                <h3 className="font-heading font-bold text-xl text-gray-900 mb-3">The Only AI Assistant Built for Privacy</h3>
                <p className="text-gray-700 leading-relaxed">
                  While other AI assistants demand full access to your accounts, Jordyn is designed to <strong className="text-green-600">minimize data exposure</strong>, <strong className="text-green-600">delete sensitive content</strong>, and <strong className="text-green-600">keep you in control</strong>. Your business data deserves better than "trust us with everything."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON SECTION */}
        <section className="py-20" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%)', maxHeight: '800px' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 mb-4" style={{ letterSpacing: 'var(--letter-spacing-heading)' }}>
                <span className="text-brand-700">Jordyn.</span> vs. Human Receptionist
              </h2>
              <p className="text-gray-600 text-lg">Why pay $3,000+/month when <span className="font-semibold">Jordyn.</span> does more for $97?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Human Receptionist */}
              <div className="bg-white rounded-large p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-large bg-gray-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-gray-900">Human Receptionist</h3>
                    <p className="text-red-500 font-bold text-lg">$3,000+/month</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg><span className="text-gray-600 text-sm">Only available 9-5, Mon-Fri</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg><span className="text-gray-600 text-sm">Sick days, vacations, turnover</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg><span className="text-gray-600 text-sm">Weeks to hire and train</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg><span className="text-gray-600 text-sm">Can only handle one call at a time</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg><span className="text-gray-600 text-sm">Benefits, taxes, HR overhead</span></div>
                </div>
              </div>

              {/* Jordyn */}
              <div className="rounded-large p-6 border-2 border-brand-300 shadow-custom-hover relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #faf5ff, #fdf2f8)' }}>
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>RECOMMENDED</div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-large flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path></svg>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-gray-900">Jordyn.</h3>
                    <p className="gradient-text font-bold text-lg">$97/month</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-gray-700 text-sm font-medium">Available 24/7, 365 days a year</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-gray-700 text-sm font-medium">Never calls in sick or takes vacation</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-gray-700 text-sm font-medium">Ready in 2 minutes flat</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-gray-700 text-sm font-medium">Handles unlimited simultaneous calls</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-gray-700 text-sm font-medium">Flat rate — no hidden costs</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="py-20 bg-white" style={{ maxHeight: '900px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-green-600 text-white text-sm font-semibold mb-4 border-2 border-green-700">Real Results</span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 mb-4" style={{ letterSpacing: 'var(--letter-spacing-heading)' }}>
                Small Businesses
                <span className="gradient-text"> Love Jordyn.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="testimonial-card rounded-large p-6 shadow-custom">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"I was losing 5-6 calls a day while working with clients. <span className="font-semibold">Jordyn.</span> now handles all of them. I've booked 3x more appointments this month alone. Absolute game changer."</p>
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face" alt="Sarah M." className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Sarah M.</p>
                    <p className="text-gray-500 text-xs">Hair Salon Owner, Austin TX</p>
                  </div>
                </div>
              </div>

              <div className="testimonial-card rounded-large p-6 shadow-custom">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"Setup took literally 90 seconds. <span className="font-semibold">Jordyn.</span> answered her first call 2 minutes later. My customers can't tell it's AI — they always comment on how helpful and friendly she is."</p>
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" alt="Marcus T." className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Marcus T.</p>
                    <p className="text-gray-500 text-xs">HVAC Business, Denver CO</p>
                  </div>
                </div>
              </div>

              <div className="testimonial-card rounded-large p-6 shadow-custom">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"I used to dread missing calls on weekends. Now <span className="font-semibold">Jordyn.</span> handles everything — books appointments, answers questions, even follows up. Worth every penny of $97."</p>
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face" alt="Lisa K." className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Lisa K.</p>
                    <p className="text-gray-500 text-xs">Dental Practice, Chicago IL</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-20" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%)', maxHeight: '900px' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-green-600 text-white text-sm font-semibold mb-4 border-2 border-green-700">Simple Pricing</span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 mb-4" style={{ letterSpacing: 'var(--letter-spacing-heading)' }}>
                One Plan.
                <span className="gradient-text"> Everything Included.</span>
              </h2>
              <p className="text-gray-600 text-lg">No hidden fees. No per-call charges. Just one flat rate.</p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="pricing-card-featured rounded-large p-8 text-center shadow-custom-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%, -30%)' }}></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(-30%, 30%)' }}></div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-600 border-2 border-green-700 mb-6">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  <span className="text-white text-xs font-semibold">Most Popular</span>
                </div>

                <div className="mb-2">
                  <span className="text-white text-5xl font-heading font-bold">$97</span>
                  <span className="text-purple-200 text-lg">/month</span>
                </div>
                <p className="text-purple-200 text-sm mb-8">7-day free trial · Cancel anytime</p>

                <div className="space-y-3 mb-8 text-left">
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-white text-sm">Unlimited calls answered 24/7</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-white text-sm">Automatic appointment booking</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-white text-sm">Connects to any calendar (Google, Outlook, etc.)</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-white text-sm">Email invites sent automatically</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-white text-sm">Custom business training</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-white text-sm">Text-to-action commands</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-white text-sm">ElevenLabs natural voice</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-white text-sm">Claude AI-powered intelligence</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-white text-sm">Real-time call summaries via SMS</span></div>
                  <div className="flex items-center gap-3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-white text-sm">2-minute setup, no tech skills needed</span></div>
                </div>

                <a href="/signup-v2" className="block w-full py-4 rounded-small bg-white font-heading font-bold text-brand-700 text-center hover:bg-brand-50 transition-colors shadow-sm">
                  Start Your Free 7-Day Trial →
                </a>
                <p className="text-purple-200 text-xs mt-3">No credit card required to start</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-20 cta-gradient relative overflow-hidden" style={{ maxHeight: '600px' }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: 'white' }}></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-10" style={{ background: 'white' }}></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 border-2 border-green-700 mb-6">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              <span className="text-white text-sm font-medium"><span className="font-semibold">Jordyn.</span> is ready to answer your calls right now</span>
            </div>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6" style={{ letterSpacing: 'var(--letter-spacing-heading)' }}>
              Stop Losing Customers<br />to Missed Calls
            </h2>
            <p className="text-purple-100 text-lg mb-10 max-w-2xl mx-auto">
              Join 500+ small businesses who never miss a call. Start your 7-day free trial today — no credit card, no commitment, no complex setup.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/signup-v2" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-small bg-white font-heading font-bold text-brand-700 text-base hover:bg-brand-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"></path></svg>
                Start Free Trial — 7 Days Free
              </a>
              <a href="/signup-v2" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-small border-2 border-white border-opacity-50 font-semibold text-white text-base hover:bg-white hover:bg-opacity-10 transition-all">
                Schedule a Demo
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span className="text-purple-100 text-sm">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span className="text-purple-100 text-sm">Setup in 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span className="text-purple-100 text-sm">Cancel anytime</span>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-gray-900 py-12" style={{ maxHeight: '400px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-10">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-large flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white"></path>
                    </svg>
                  </div>
                  <span className="font-heading font-bold text-xl text-white">Jordyn.</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs">Your AI-powered phone receptionist. Answers calls 24/7, books appointments, and handles customer inquiries — all for $97/month.</p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-gray-500 text-xs">Powered by</span>
                  <span className="text-gray-300 text-xs font-semibold">ElevenLabs</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-300 text-xs font-semibold">Claude AI</span>
                </div>
              </div>
              <div>
                <h4 className="font-heading font-semibold text-white text-sm mb-4">Product</h4>
                <div className="space-y-2">
                  <a href="#features" className="block text-gray-400 text-sm hover:text-white transition-colors">Features</a>
                  <a href="#how-it-works" className="block text-gray-400 text-sm hover:text-white transition-colors">How It Works</a>
                  <a href="#pricing" className="block text-gray-400 text-sm hover:text-white transition-colors">Pricing</a>
                  <a href="/signup-v2" className="block text-gray-400 text-sm hover:text-white transition-colors">Integrations</a>
                </div>
              </div>
              <div>
                <h4 className="font-heading font-semibold text-white text-sm mb-4">Company</h4>
                <div className="space-y-2">
                  <a href="/signup-v2" className="block text-gray-400 text-sm hover:text-white transition-colors">About</a>
                  <a href="/signup-v2" className="block text-gray-400 text-sm hover:text-white transition-colors">Blog</a>
                  <a href="/signup-v2" className="block text-gray-400 text-sm hover:text-white transition-colors">Privacy Policy</a>
                  <a href="/signup-v2" className="block text-gray-400 text-sm hover:text-white transition-colors">Terms of Service</a>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">© 2024 Jordyn. All rights reserved.</p>
              <p className="text-gray-500 text-sm">Built for small businesses who can't afford to miss a call.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
