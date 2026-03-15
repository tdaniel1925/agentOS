/**
 * AgentOS Landing Page - Clean, No-Build-Tool Version
 */

export default function HomePage() {
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333'
    }}>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1B3A7D 0%, #2A4A8D 50%, #1B3A7D 100%)',
        color: 'white',
        padding: '100px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '8px 20px',
            borderRadius: '25px',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            AgentOS by Apex Affinity Group
          </div>

          <h1 style={{
            fontSize: '56px',
            fontWeight: 'bold',
            marginBottom: '20px',
            lineHeight: '1.2'
          }}>
            Your Business Deserves<br />
            A Dedicated AI Employee
          </h1>

          <p style={{
            fontSize: '24px',
            marginBottom: '30px',
            color: '#E5E7EB',
            maxWidth: '800px',
            margin: '0 auto 30px'
          }}>
            Stop wasting hours on calls, texts, and follow-ups.<br />
            AgentOS handles it all 24/7 for just $97/month.
          </p>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signup" style={{
              display: 'inline-block',
              padding: '16px 32px',
              backgroundColor: '#C7181F',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              Get Your AI Employee
            </a>

            <a href="#demo" style={{
              display: 'inline-block',
              padding: '16px 32px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              See It In Action →
            </a>
          </div>

          <p style={{ marginTop: '20px', fontSize: '14px', color: '#D1D5DB' }}>
            No credit card required • Setup in under 5 minutes • Cancel anytime
          </p>

          {/* SMS Demo CTA */}
          <div style={{
            marginTop: '40px',
            padding: '20px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.2)',
            maxWidth: '600px',
            margin: '40px auto 0'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '10px', fontWeight: '600' }}>
              💬 Want an instant demo?
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
              Text <span style={{
                backgroundColor: 'rgba(199,24,31,0.2)',
                padding: '4px 12px',
                borderRadius: '6px',
                color: '#FFD1D3'
              }}>DEMO</span> to <span style={{ color: '#FFD1D3' }}>(651) 728-7626</span>
            </div>
            <div style={{ fontSize: '14px', color: '#D1D5DB' }}>
              Jordan will call you back in seconds to show you how it works
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section style={{ padding: '80px 20px', backgroundColor: '#F9FAFB' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '50px', color: '#1B3A7D' }}>
            Running A Business Shouldn't Mean Working 24/7
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
            textAlign: 'left'
          }}>
            <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '12px', borderLeft: '4px solid #C7181F' }}>
              <div style={{ fontSize: '32px', marginBottom: '15px' }}>📞</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Missed Calls = Lost Money</h3>
              <p style={{ color: '#6B7280' }}>Every unanswered call is a customer going to your competitor.</p>
            </div>

            <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '12px', borderLeft: '4px solid #C7181F' }}>
              <div style={{ fontSize: '32px', marginBottom: '15px' }}>⏰</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>After-Hours Nightmare</h3>
              <p style={{ color: '#6B7280' }}>Your customers need help at 8pm. You're trying to have dinner.</p>
            </div>

            <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '12px', borderLeft: '4px solid #C7181F' }}>
              <div style={{ fontSize: '32px', marginBottom: '15px' }}>🔄</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Follow-Up Black Hole</h3>
              <p style={{ color: '#6B7280' }}>Leads slip through the cracks. Appointments get forgotten.</p>
            </div>

            <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '12px', borderLeft: '4px solid #C7181F' }}>
              <div style={{ fontSize: '32px', marginBottom: '15px' }}>💸</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Hiring Is Expensive</h3>
              <p style={{ color: '#6B7280' }}>A full-time receptionist costs $35k+ per year. Plus benefits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section style={{ padding: '80px 20px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '20px', color: '#1B3A7D' }}>
              Meet Jordan — Your AI Employee
            </h2>
            <p style={{ fontSize: '20px', color: '#6B7280', maxWidth: '700px', margin: '0 auto' }}>
              Jordan answers calls, sends texts, books appointments, and follows up with leads.
              All day, every day. Never takes a break. Never asks for a raise.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px'
          }}>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#1B3A7D' }}>
                🎯 24/7 Availability
              </h3>
              <p style={{ color: '#6B7280', marginBottom: '15px' }}>
                Never miss a call again. Jordan picks up instantly, day or night, weekends and holidays.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, color: '#6B7280' }}>
                <li style={{ marginBottom: '8px' }}>✓ Instant response time</li>
                <li style={{ marginBottom: '8px' }}>✓ No hold music</li>
                <li style={{ marginBottom: '8px' }}>✓ Unlimited capacity</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#1B3A7D' }}>
                💬 Smart Conversations
              </h3>
              <p style={{ color: '#6B7280', marginBottom: '15px' }}>
                Jordan understands your business and answers questions naturally, like a real employee.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, color: '#6B7280' }}>
                <li style={{ marginBottom: '8px' }}>✓ Learns your services</li>
                <li style={{ marginBottom: '8px' }}>✓ Handles objections</li>
                <li style={{ marginBottom: '8px' }}>✓ Books appointments</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#1B3A7D' }}>
                📊 Never Forget
              </h3>
              <p style={{ color: '#6B7280', marginBottom: '15px' }}>
                Every interaction is logged. Jordan follows up automatically so no lead falls through the cracks.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, color: '#6B7280' }}>
                <li style={{ marginBottom: '8px' }}>✓ Automatic reminders</li>
                <li style={{ marginBottom: '8px' }}>✓ Complete transcripts</li>
                <li style={{ marginBottom: '8px' }}>✓ Activity reports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ padding: '80px 20px', backgroundColor: '#1B3A7D', color: 'white', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '20px' }}>
            Simple, Transparent Pricing
          </h2>
          <p style={{ fontSize: '20px', color: '#E5E7EB', marginBottom: '40px' }}>
            No contracts. No setup fees. Cancel anytime.
          </p>

          <div style={{
            backgroundColor: 'white',
            color: '#333',
            padding: '50px',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1B3A7D', marginBottom: '10px' }}>
              $97<span style={{ fontSize: '24px', fontWeight: 'normal', color: '#6B7280' }}>/month</span>
            </div>
            <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '30px' }}>
              Everything included. Add skills as you grow.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '30px' }}>
              <li style={{ marginBottom: '12px', fontSize: '16px' }}>✓ Unlimited calls & texts</li>
              <li style={{ marginBottom: '12px', fontSize: '16px' }}>✓ Appointment scheduling</li>
              <li style={{ marginBottom: '12px', fontSize: '16px' }}>✓ Lead follow-up automation</li>
              <li style={{ marginBottom: '12px', fontSize: '16px' }}>✓ Email campaigns</li>
              <li style={{ marginBottom: '12px', fontSize: '16px' }}>✓ Activity reports</li>
              <li style={{ marginBottom: '12px', fontSize: '16px' }}>✓ Custom training for your business</li>
            </ul>

            <a href="/signup" style={{
              display: 'inline-block',
              padding: '16px 48px',
              backgroundColor: '#C7181F',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              Start Your Free Trial
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 20px', backgroundColor: '#F9FAFB', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '20px', color: '#1B3A7D' }}>
            Ready To Stop Missing Calls?
          </h2>
          <p style={{ fontSize: '20px', color: '#6B7280', marginBottom: '30px' }}>
            Join hundreds of businesses using AgentOS to capture every opportunity.
          </p>
          <a href="/signup" style={{
            display: 'inline-block',
            padding: '16px 48px',
            backgroundColor: '#C7181F',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            Get Started Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 20px', backgroundColor: '#1B3A7D', color: 'white', textAlign: 'center' }}>
        <p style={{ marginBottom: '10px' }}>© 2024 AgentOS - The Apex Bots</p>
        <p style={{ fontSize: '14px', color: '#E5E7EB' }}>
          Built by BotMakers Inc. • Distributed through Apex Affinity Group
        </p>
      </footer>
    </div>
  )
}
