/**
 * Feature Grid
 * Displays all AgentOS features in a grid layout
 */

const features = [
  {
    icon: '📞',
    title: '24/7 Call Answering',
    description: 'Never miss a call again. Jordan picks up every time, qualifies leads, and schedules appointments.'
  },
  {
    icon: '💬',
    title: 'SMS Automation',
    description: 'Instant text responses. Follow-ups. Reminders. All handled automatically.'
  },
  {
    icon: '✉️',
    title: 'Email Campaigns',
    description: 'AI-generated email sequences that nurture leads and keep clients engaged.'
  },
  {
    icon: '📅',
    title: 'Smart Scheduling',
    description: 'Coordinate appointments, send reminders, and manage your calendar automatically.'
  },
  {
    icon: '🎯',
    title: 'Lead Qualification',
    description: 'Jordan asks the right questions, scores leads, and routes hot prospects to you immediately.'
  },
  {
    icon: '📊',
    title: 'Activity Reports',
    description: 'See every call, text, and interaction. Know exactly what Jordan is doing for you.'
  },
  {
    icon: '🔄',
    title: 'Follow-Up Automation',
    description: 'Automatic follow-ups with every lead. No opportunity slips through the cracks.'
  },
  {
    icon: '🎨',
    title: 'Add Skills On Demand',
    description: 'Social media posting, lead generation, review requests - add what you need when you need it.'
  }
]

export function FeatureGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, index) => (
        <div
          key={index}
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-[#1B3A7D] hover:shadow-lg transition-all"
        >
          <div className="text-4xl mb-3">{feature.icon}</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
          <p className="text-sm text-gray-600">{feature.description}</p>
        </div>
      ))}
    </div>
  )
}
