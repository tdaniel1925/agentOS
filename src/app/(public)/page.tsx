/**
 * AgentOS Landing Page - Modern Design
 */

export default function HomePage() {
  return (
    <>
      {/* ============ NAV ============ */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1B3A7D] to-[#2A4A8D] rounded-lg flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M12 8V4H8"></path>
                <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                <path d="M2 14h2"></path>
                <path d="M20 14h2"></path>
                <path d="M15 13v2"></path>
                <path d="M9 13v2"></path>
              </svg>
            </div>
            <span className="font-bold text-[#1B3A7D] text-xl tracking-tight">AgentOS</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-[#1B3A7D] transition-colors">Capabilities</a>
            <a href="#skills" className="text-sm font-medium text-gray-600 hover:text-[#1B3A7D] transition-colors">Skills</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-[#1B3A7D] transition-colors">Pricing</a>
          </div>
          <a href="/signup" className="bg-[#1B3A7D] hover:bg-[#2A4A8D] text-white text-sm font-bold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            Get Started
          </a>
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(27,58,125,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(27,58,125,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-b from-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-red-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* Hero Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white border border-[#1B3A7D]/10 px-4 py-1.5 rounded-full text-[#1B3A7D] text-xs font-bold uppercase tracking-wider shadow-sm mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Accepting New Businesses
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1B3A7D] mb-6 tracking-tight leading-[1.1]">
                Hire Your First<br/>
                <span className="bg-gradient-to-r from-[#C7181F] to-[#E72833] bg-clip-text text-transparent">AI Employee.</span>
              </h1>

              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Jordan answers your calls, manages your inbox, books appointments, and follows up on leads — automatically. Starting at <strong className="text-[#1B3A7D] bg-[#1B3A7D]/5 px-1 rounded"> $97/month.</strong>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a href="#demo" className="w-full sm:w-auto bg-[#C7181F] hover:bg-[#A01419] text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg shadow-[#C7181F]/20 transition-all transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2 group">
                  Start Your Free Demo
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </a>
                <a href="#video" className="w-full sm:w-auto bg-white border border-gray-200 hover:border-[#1B3A7D]/20 text-gray-700 hover:text-[#1B3A7D] font-semibold text-lg px-8 py-4 rounded-lg flex items-center justify-center gap-3 transition-all hover:bg-gray-50 hover:shadow-md group">
                  <div className="w-8 h-8 bg-[#1B3A7D]/5 rounded-full flex items-center justify-center group-hover:bg-[#1B3A7D]/10 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#1B3A7D] fill-current">
                      <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path>
                    </svg>
                  </div>
                  Watch Jordan Work
                </a>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-4">Trusted by modern businesses</p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                  <div className="flex items-center gap-2 font-bold text-xl text-[#1B3A7D]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fill-current">
                      <path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    </svg>
                    Apex
                  </div>
                  <div className="flex items-center gap-2 font-bold text-xl text-[#1B3A7D]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fill-current">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                    Linear
                  </div>
                  <div className="flex items-center gap-2 font-bold text-xl text-[#1B3A7D]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fill-current">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                    Sphere
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Visual / Floating UI */}
            <div className="flex-1 relative hidden lg:block animate-pulse">
              <div className="relative w-full max-w-md mx-auto">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden relative z-20">
                  {/* Header */}
                  <div className="bg-[#1B3A7D] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-[#1B3A7D]">J</div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1B3A7D] rounded-full"></div>
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">Jordan AI</div>
                        <div className="text-blue-200 text-xs">Active • Handling 3 tasks</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4 bg-gray-50/50">
                    {/* Message 1 */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-500">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-100 text-sm text-gray-600 max-w-[80%]">
                        Hi, I&apos;d like to get a quote for home insurance. Are you open?
                      </div>
                    </div>

                    {/* Message 2 (AI) */}
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-[#1B3A7D] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">J</div>
                      <div className="bg-[#1B3A7D] p-3 rounded-lg rounded-tr-none shadow-md text-sm text-white max-w-[80%]">
                        Absolutely! I can help with that right now. It takes about 2 minutes. Shall we start?
                      </div>
                    </div>

                    {/* Notification Toast */}
                    <div className="mt-4 bg-white p-3 rounded-lg border border-green-100 shadow-sm flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M8 2v4"></path>
                          <path d="M16 2v4"></path>
                          <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                          <path d="M3 10h18"></path>
                          <path d="m9 16 2 2 4-4"></path>
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">Appointment Booked</div>
                        <div className="text-xs text-gray-500">Tomorrow at 2:00 PM with Sarah</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements behind card */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#C7181F] rounded-2xl -z-10 opacity-10 rotate-12"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#1B3A7D] rounded-full -z-10 opacity-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ONE-LINER PROBLEM ============ */}
      <section className="py-24 bg-[#1B3A7D] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-12">
            You&apos;re losing leads to voicemail.<br/>
            Losing clients to slow follow-up.<br/>
            Losing time to email and admin.
          </h2>
          <div className="inline-block relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#C7181F] to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative px-8 py-6 bg-white rounded-lg leading-none flex items-center">
              <p className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#C7181F] to-[#E72833]">
                Jordan fixes all three. Automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHAT JORDAN DOES ============ */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-[#1B3A7D] mb-4">Core Capabilities</h2>
            <p className="text-gray-500 text-lg">Everything included in the base plan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#1B3A7D]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#1B3A7D] group-hover:text-white transition-all duration-300 text-[#1B3A7D] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#1B3A7D] transition-colors">Answers Every Call</h3>
              <p className="text-gray-600 leading-relaxed">Clients call your number. Jordan picks up, handles it, and sends you a summary in 60 seconds. No missed leads. Ever.</p>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#1B3A7D]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#1B3A7D] group-hover:text-white transition-all duration-300 text-[#1B3A7D] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#1B3A7D] transition-colors">Manages Your Inbox</h3>
              <p className="text-gray-600 leading-relaxed">Connect your Gmail or Outlook. Jordan reads, sorts, and responds to routine emails on your behalf.</p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#1B3A7D]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#1B3A7D] group-hover:text-white transition-all duration-300 text-[#1B3A7D] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="M8 2v4"></path>
                  <path d="M16 2v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#1B3A7D] transition-colors">Books Appointments</h3>
              <p className="text-gray-600 leading-relaxed">Jordan checks your calendar and books appointments automatically. No back-and-forth. No scheduling headaches.</p>
            </div>

            {/* Card 4 */}
            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#1B3A7D]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#1B3A7D] group-hover:text-white transition-all duration-300 text-[#1B3A7D] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                  <path d="M18 17V9"></path>
                  <path d="M13 17V5"></path>
                  <path d="M8 17v-3"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#1B3A7D] transition-colors">Follows Up On Leads</h3>
              <p className="text-gray-600 leading-relaxed">Every quote gets followed up. Every lead gets nurtured. Every renewal gets an alert. All automatic.</p>
            </div>

            {/* Card 5 */}
            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#1B3A7D]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#1B3A7D] group-hover:text-white transition-all duration-300 text-[#1B3A7D] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                  <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#1B3A7D] transition-colors">Posts To Social Media</h3>
              <p className="text-gray-600 leading-relaxed">Daily posts to Facebook and Instagram — written and scheduled automatically. Add-on skill. $49/month.</p>
            </div>

            {/* Card 6 */}
            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#1B3A7D]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#1B3A7D] group-hover:text-white transition-all duration-300 text-[#1B3A7D] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path>
                  <path d="M14 2v5a1 1 0 0 0 1 1h5"></path>
                  <path d="M10 9H8"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#1B3A7D] transition-colors">Sends Weekly Reports</h3>
              <p className="text-gray-600 leading-relaxed">Every Monday morning Jordan sends you a summary of everything it handled — calls, emails, leads, appointments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ THE MATRIX SECTION ============ */}
      <section id="skills" className="py-24 bg-white relative overflow-hidden">
        {/* Tech Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(27,58,125,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(27,58,125,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-[#1B3A7D]/5 text-[#1B3A7D] rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-[#1B3A7D]/10">
                Instant Upgrades
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight text-[#1B3A7D]">
                Jordan Learns New<br/><span className="bg-gradient-to-r from-[#C7181F] to-[#E72833] bg-clip-text text-transparent">Skills On Demand.</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 font-medium">
                Remember The Matrix? Neo downloads Kung Fu in seconds. Jordan works the same way.
              </p>
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p>
                  Start with the basics — calls, email, appointments. Then add skills whenever you need them. Each one downloads instantly and activates in minutes.
                </p>
                <div className="p-4 bg-[#1B3A7D]/5 rounded-lg border-l-4 border-[#1B3A7D]">
                  <p className="font-medium text-[#1B3A7D]">
                    &quot;Your competitor just added outbound calling. You just added lead generation. Neither of you lifted a finger.&quot;
                  </p>
                </div>
                <p className="text-[#1B3A7D] font-bold pt-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 w-5 h-5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                  Add what you need. Remove what you don&apos;t.
                </p>
              </div>
            </div>

            {/* Skill Grid UI */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xl relative">
              {/* Decorative glow behind */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#1B3A7D]/10 to-blue-50 rounded-3xl -z-10 blur-xl opacity-50"></div>

              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                <span className="font-bold text-xl text-[#1B3A7D]">Skill Store</span>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-bold uppercase tracking-wider">Live System</span>
              </div>

              <div className="space-y-3">
                {/* Base Plan */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#1B3A7D]/5 border border-[#1B3A7D]/10">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                    <div>
                      <span className="font-bold text-[#1B3A7D] block">Base Core</span>
                      <span className="text-xs text-[#1B3A7D]/70">Calls, Email, Calendar</span>
                    </div>
                  </div>
                  <span className="font-bold text-[#1B3A7D]">$97/mo</span>
                </div>

                {/* Toggle Items */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#1B3A7D]/20 hover:shadow-md transition-all bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                        <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                      </svg>
                    </div>
                    <span className="font-bold text-gray-700">Social Media</span>
                  </div>
                  <span className="text-sm font-medium text-gray-400">+$49</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#1B3A7D]/20 hover:shadow-md transition-all bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                    </div>
                    <span className="font-bold text-gray-700">Lead Generation</span>
                  </div>
                  <span className="text-sm font-medium text-gray-400">+$49</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#1B3A7D]/20 hover:shadow-md transition-all bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400">
                        <path d="m16 8 6-6"></path>
                        <path d="M22 8V2h-6"></path>
                        <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
                      </svg>
                    </div>
                    <span className="font-bold text-gray-700">Outbound Calling</span>
                  </div>
                  <span className="text-sm font-medium text-gray-400">+$49</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ DEMO SECTION ============ */}
      <section id="demo" className="py-24 bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#1B3A7D] mb-4">See Jordan In Action.</h2>
          <p className="text-xl text-gray-600 mb-12">Don&apos;t take our word for it. Let Jordan call you right now.</p>

          <div className="bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 max-w-lg mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1B3A7D] via-blue-500 to-[#C7181F]"></div>

            <div className="space-y-6">
              <div>
                <label className="block text-left text-sm font-bold text-[#1B3A7D] mb-2">Your Phone Number</label>
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-3.5 w-5 h-5 text-gray-400">
                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                    <path d="M12 18h.01"></path>
                  </svg>
                  <input type="tel" placeholder="(555) 123-4567" className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#1B3A7D] focus:ring-4 focus:ring-[#1B3A7D]/10 outline-none transition-all font-medium"/>
                </div>
              </div>
              <div>
                <label className="block text-left text-sm font-bold text-[#1B3A7D] mb-2">Business Type</label>
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-3.5 w-5 h-5 text-gray-400">
                    <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                  </svg>
                  <select className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#1B3A7D] focus:ring-4 focus:ring-[#1B3A7D]/10 outline-none transition-all bg-white font-medium appearance-none">
                    <option>Insurance Agency</option>
                    <option>Real Estate</option>
                    <option>Law Firm</option>
                    <option>Accounting / CPA</option>
                    <option>Other</option>
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none">
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </div>
              </div>
              <button className="w-full bg-[#C7181F] hover:bg-[#A01419] text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-[#C7181F]/30 flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 animate-pulse">
                  <path d="M13 2a9 9 0 0 1 9 9"></path>
                  <path d="M13 6a5 5 0 0 1 5 5"></path>
                  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
                </svg>
                Call Me Now
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-6 font-medium bg-gray-50 py-2 rounded">
              Jordan will call within 30 seconds. Real conversation. No scripts.
            </p>
          </div>

          <div className="mt-16">
            <p className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest">Or listen to a recording</p>
            <div className="bg-white border border-gray-200 rounded-full p-3 pr-8 inline-flex items-center gap-5 shadow-lg hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#1B3A7D] rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 ml-1 fill-current">
                  <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#1B3A7D]">Live Demo Call</div>
                <div className="text-xs text-gray-500 font-medium">Insurance Agent Inquiry (1:42)</div>
              </div>
              <div className="h-8 flex items-center gap-1">
                {/* Animated waveform */}
                <div className="w-1 h-3 bg-[#1B3A7D]/20 rounded-full group-hover:bg-[#1B3A7D]/40 transition-colors"></div>
                <div className="w-1 h-5 bg-[#1B3A7D]/40 rounded-full group-hover:bg-[#1B3A7D]/60 transition-colors"></div>
                <div className="w-1 h-8 bg-[#1B3A7D]/60 rounded-full group-hover:bg-[#1B3A7D]/80 transition-colors"></div>
                <div className="w-1 h-4 bg-[#1B3A7D]/40 rounded-full group-hover:bg-[#1B3A7D]/60 transition-colors"></div>
                <div className="w-1 h-6 bg-[#1B3A7D]/50 rounded-full group-hover:bg-[#1B3A7D]/70 transition-colors"></div>
                <div className="w-1 h-3 bg-[#1B3A7D]/30 rounded-full group-hover:bg-[#1B3A7D]/50 transition-colors"></div>
                <div className="w-1 h-2 bg-[#1B3A7D]/20 rounded-full group-hover:bg-[#1B3A7D]/40 transition-colors"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING SECTION ============ */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1B3A7D] mb-4">One Employee. One Price.</h2>
            <p className="text-xl text-gray-500">No surprises. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Base Plan */}
            <div className="lg:col-span-1 bg-[#1B3A7D] text-white rounded-2xl p-8 flex flex-col shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>

              <div className="mb-8 relative z-10">
                <h3 className="text-2xl font-bold text-white">Base Plan</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-6xl font-extrabold text-white tracking-tight">$97</span>
                  <span className="text-xl text-blue-200 ml-2">/month</span>
                </div>
              </div>

              <ul className="space-y-5 mb-10 flex-1 relative z-10">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-green-400">
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-blue-100 font-medium">Answers calls 24/7</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-green-400">
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-blue-100 font-medium">Manages email inbox</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-green-400">
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-blue-100 font-medium">Auto-booking</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-green-400">
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                  <span className="text-blue-100 font-medium">Weekly reports</span>
                </li>
              </ul>

              <a href="/signup" className="block w-full bg-white text-[#1B3A7D] hover:bg-gray-100 font-bold text-center py-4 rounded-lg transition-colors relative z-10 shadow-lg">
                Hire Jordan Now →
              </a>
              <p className="text-xs text-center text-blue-200 mt-4 relative z-10">No setup fee. Cancel anytime.</p>
            </div>

            {/* Add-ons */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1B3A7D]">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 12h8"></path>
                  <path d="M12 8v8"></path>
                </svg>
                Add Skills Anytime
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Skill Cards */}
                <div className="flex justify-between items-center p-5 border border-gray-200 rounded-xl bg-white hover:border-[#1B3A7D]/20 hover:shadow-md transition-all group">
                  <span className="font-bold text-gray-700 group-hover:text-[#1B3A7D]">Social Media</span>
                  <span className="font-bold text-[#1B3A7D] bg-[#1B3A7D]/5 px-2 py-1 rounded">+$49/mo</span>
                </div>
                <div className="flex justify-between items-center p-5 border border-gray-200 rounded-xl bg-white hover:border-[#1B3A7D]/20 hover:shadow-md transition-all group">
                  <span className="font-bold text-gray-700 group-hover:text-[#1B3A7D]">Lead Generation</span>
                  <span className="font-bold text-[#1B3A7D] bg-[#1B3A7D]/5 px-2 py-1 rounded">+$49/mo</span>
                </div>
                <div className="flex justify-between items-center p-5 border border-gray-200 rounded-xl bg-white hover:border-[#1B3A7D]/20 hover:shadow-md transition-all group">
                  <span className="font-bold text-gray-700 group-hover:text-[#1B3A7D]">Campaigns</span>
                  <span className="font-bold text-[#1B3A7D] bg-[#1B3A7D]/5 px-2 py-1 rounded">+$49/mo</span>
                </div>
                <div className="flex justify-between items-center p-5 border border-gray-200 rounded-xl bg-white hover:border-[#1B3A7D]/20 hover:shadow-md transition-all group">
                  <span className="font-bold text-gray-700 group-hover:text-[#1B3A7D]">Outbound Calling</span>
                  <span className="font-bold text-[#1B3A7D] bg-[#1B3A7D]/5 px-2 py-1 rounded">+$49/mo</span>
                </div>
                <div className="flex justify-between items-center p-5 border border-gray-200 rounded-xl bg-white hover:border-[#1B3A7D]/20 hover:shadow-md transition-all group">
                  <span className="font-bold text-gray-700 group-hover:text-[#1B3A7D]">Quote Follow-Up</span>
                  <span className="font-bold text-[#1B3A7D] bg-[#1B3A7D]/5 px-2 py-1 rounded">+$29/mo</span>
                </div>
                <div className="flex justify-between items-center p-5 border border-gray-200 rounded-xl bg-white hover:border-[#1B3A7D]/20 hover:shadow-md transition-all group">
                  <span className="font-bold text-gray-700 group-hover:text-[#1B3A7D]">Renewal Alerts</span>
                  <span className="font-bold text-[#1B3A7D] bg-[#1B3A7D]/5 px-2 py-1 rounded">+$29/mo</span>
                </div>
                <div className="flex justify-between items-center p-5 border border-gray-200 rounded-xl bg-white hover:border-[#1B3A7D]/20 hover:shadow-md transition-all group">
                  <span className="font-bold text-gray-700 group-hover:text-[#1B3A7D]">Review Requests</span>
                  <span className="font-bold text-[#1B3A7D] bg-[#1B3A7D]/5 px-2 py-1 rounded">+$19/mo</span>
                </div>
                <div className="flex justify-between items-center p-5 border border-gray-200 rounded-xl bg-white hover:border-[#1B3A7D]/20 hover:shadow-md transition-all group">
                  <span className="font-bold text-gray-700 group-hover:text-[#1B3A7D]">Team (5 users)</span>
                  <span className="font-bold text-[#1B3A7D] bg-[#1B3A7D]/5 px-2 py-1 rounded">+$99/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="py-24 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#1B3A7D]">Up and running in 5 minutes.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-200 -z-10"></div>

            {/* Step 1 */}
            <div className="text-center group">
              <div className="w-24 h-24 bg-white border-2 border-[#1B3A7D]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-3xl font-bold text-[#1B3A7D] group-hover:scale-110 group-hover:border-[#1B3A7D] transition-all duration-300">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sign up</h3>
              <p className="text-gray-600">Enter your business info. Choose your industry. Jordan configures itself for you.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="w-24 h-24 bg-white border-2 border-[#1B3A7D]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-3xl font-bold text-[#1B3A7D] group-hover:scale-110 group-hover:border-[#1B3A7D] transition-all duration-300">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Connect your number</h3>
              <p className="text-gray-600">We give Jordan a real local phone number. Forward your existing number or share Jordan&apos;s number directly.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="w-24 h-24 bg-white border-2 border-[#1B3A7D]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-3xl font-bold text-[#1B3A7D] group-hover:scale-110 group-hover:border-[#1B3A7D] transition-all duration-300">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Go live</h3>
              <p className="text-gray-600">That&apos;s it. Jordan starts working immediately. Text it a command to see it in action.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ INDUSTRIES ============ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#1B3A7D]">Built for your industry.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all group">
              <h3 className="text-xl font-bold text-[#1B3A7D] mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C7181F]/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#C7181F]">
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                  </svg>
                </div>
                Insurance Agents
              </h3>
              <p className="text-gray-600 leading-relaxed">Jordan answers after-hours calls, follows up on every quote automatically, and alerts you 90 days before every renewal. Most agents close 30% more just from the follow-up system alone.</p>
            </div>

            <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all group">
              <h3 className="text-xl font-bold text-[#1B3A7D] mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C7181F]/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#C7181F]">
                    <rect width="16" height="20" x="4" y="2" rx="2"></rect>
                    <line x1="8" x2="16" y1="6" y2="6"></line>
                    <line x1="16" x2="16" y1="14" y2="18"></line>
                    <path d="M16 10h.01"></path>
                    <path d="M12 10h.01"></path>
                    <path d="M8 10h.01"></path>
                    <path d="M12 14h.01"></path>
                    <path d="M8 14h.01"></path>
                    <path d="M12 18h.01"></path>
                    <path d="M8 18h.01"></path>
                  </svg>
                </div>
                CPAs & Accountants
              </h3>
              <p className="text-gray-600 leading-relaxed">Jordan handles client calls during tax season, books appointments, manages document requests, and sends weekly summaries of everything that came in while you were heads-down.</p>
            </div>

            <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all group">
              <h3 className="text-xl font-bold text-[#1B3A7D] mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C7181F]/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#C7181F]">
                    <path d="M12 3v18"></path>
                    <path d="m19 8 3 8a5 5 0 0 1-6 0zV7"></path>
                    <path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"></path>
                    <path d="m5 8 3 8a5 5 0 0 1-6 0zV7"></path>
                    <path d="M7 21h10"></path>
                  </svg>
                </div>
                Law Firms
              </h3>
              <p className="text-gray-600 leading-relaxed">Jordan screens new client inquiries, books consultations, handles after-hours calls, and follows up on every intake automatically. Every potential client gets a response within 60 seconds.</p>
            </div>

            <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all group">
              <h3 className="text-xl font-bold text-[#1B3A7D] mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C7181F]/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#C7181F]">
                    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                    <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  </svg>
                </div>
                Real Estate Agents
              </h3>
              <p className="text-gray-600 leading-relaxed">Jordan answers every property inquiry — even during showings. Qualifies leads, books walkthroughs, and follows up until they respond.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ OBJECTIONS / FAQ ============ */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#1B3A7D] mb-12 text-center">Common Questions</h2>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-[#1B3A7D] mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#1B3A7D]/40">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <path d="M12 17h.01"></path>
                </svg>
                Is Jordan actually AI or is it a real person?
              </h3>
              <p className="text-gray-600 leading-relaxed pl-7">Jordan is AI — powered by the same technology behind Claude, one of the world&apos;s most advanced AI systems. It sounds human because it&apos;s been trained specifically for business conversations.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-[#1B3A7D] mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#1B3A7D]/40">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="8" y2="12"></line>
                  <line x1="12" x2="12.01" y1="16" y2="16"></line>
                </svg>
                What if Jordan makes a mistake?
              </h3>
              <p className="text-gray-600 leading-relaxed pl-7">Jordan handles the routine 80% automatically and escalates anything unusual to you via SMS immediately. You&apos;re always in control.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-[#1B3A7D] mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#1B3A7D]/40">
                  <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                  <line x1="2" x2="22" y1="10" y2="10"></line>
                </svg>
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 leading-relaxed pl-7">Yes. No contracts. No cancellation fees. Cancel with a text message. &quot;Jordan, cancel my subscription.&quot; Done.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="py-24 bg-[#1B3A7D] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B3A7D]/50 to-[#1B3A7D]"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Your competitor might already have one.</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            AI employees are the fastest-growing business tool of 2026. The agents who adopt early win the clients who can&apos;t reach the agents who don&apos;t.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/signup" className="w-full sm:w-auto bg-[#C7181F] hover:bg-[#A01419] text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg shadow-[#C7181F]/20 transition-all transform hover:-translate-y-1">
              Hire Jordan for $97/month →
            </a>
            <a href="#demo" className="w-full sm:w-auto bg-transparent border border-[#1B3A7D]/60 hover:bg-[#2A4A8D] text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all">
              Or start with a free demo call
            </a>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-white border-t border-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1B3A7D] rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-[#1B3A7D] text-lg tracking-tight">AgentOS</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-[#1B3A7D] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#1B3A7D] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#1B3A7D] transition-colors">Contact</a>
          </div>
          <div className="text-sm text-gray-500">
            © 2024 AgentOS. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}
