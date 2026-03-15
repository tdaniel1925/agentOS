/**
 * Email Templates
 * Reusable email HTML templates
 */

interface WelcomeEmailParams {
  name: string
  botName: string
  vapiNumber: string
  controlNumber: string
  dashboardUrl: string
}

/**
 * Welcome email after successful onboarding
 */
export function welcomeEmail(params: WelcomeEmailParams): {
  subject: string
  html: string
  text: string
} {
  return {
    subject: `Welcome to AgentOS! Meet ${params.botName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1B3A7D; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Welcome to AgentOS!</h1>
          </div>

          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 18px;">Hi ${params.name},</p>

            <p>${params.botName} is ready to start working for you!</p>

            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1B3A7D; margin-top: 0;">Your New Business Number</h2>
              <p style="font-size: 24px; font-weight: bold; color: #C7181F; margin: 10px 0;">${params.vapiNumber}</p>
              <p>Share this number with clients or forward your existing number to it. ${params.botName} will answer every call professionally.</p>
            </div>

            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1B3A7D; margin-top: 0;">Control ${params.botName} via SMS</h2>
              <p>Text commands to: <strong>${params.controlNumber}</strong></p>
              <p style="margin: 10px 0;">Try sending:</p>
              <ul style="margin: 10px 0;">
                <li>"What can you do?"</li>
                <li>"How many calls today?"</li>
                <li>"Schedule a post"</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${params.dashboardUrl}" style="display: inline-block; background-color: #C7181F; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
            </div>

            <p style="margin-top: 30px;">Your first weekly report will arrive Monday morning.</p>

            <p style="margin-top: 20px;">Questions? Just reply to this email.</p>

            <p style="margin-top: 30px;">
              — The AgentOS Team<br>
              <a href="https://theapexbots.com" style="color: #1B3A7D;">theapexbots.com</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to AgentOS!

Hi ${params.name},

${params.botName} is ready to start working for you!

Your New Business Number: ${params.vapiNumber}
Share this number with clients or forward your existing number to it. ${params.botName} will answer every call professionally.

Control ${params.botName} via SMS: ${params.controlNumber}
Try sending: "What can you do?" or "How many calls today?"

Dashboard: ${params.dashboardUrl}

Your first weekly report will arrive Monday morning.

Questions? Just reply to this email.

— The AgentOS Team
theapexbots.com`,
  }
}

interface WeeklyReportParams {
  name: string
  botName: string
  weekStart: string
  weekEnd: string
  callsHandled: number
  appointmentsBooked: number
  leadsGenerated: number
  emailsSent: number
  dashboardUrl: string
}

/**
 * Weekly scorecard email
 */
export function weeklyReportEmail(params: WeeklyReportParams): {
  subject: string
  html: string
  text: string
} {
  return {
    subject: `${params.botName}'s Weekly Report: ${params.weekStart} - ${params.weekEnd}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1B3A7D; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">${params.botName}'s Weekly Report</h1>
            <p style="margin: 10px 0 0 0;">${params.weekStart} - ${params.weekEnd}</p>
          </div>

          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 18px;">Hi ${params.name},</p>

            <p>Here's what ${params.botName} accomplished this week:</p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
              <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #1B3A7D;">${params.callsHandled}</div>
                <div style="color: #666;">Calls Handled</div>
              </div>

              <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #C7181F;">${params.appointmentsBooked}</div>
                <div style="color: #666;">Appointments Booked</div>
              </div>

              <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #1B3A7D;">${params.leadsGenerated}</div>
                <div style="color: #666;">Leads Generated</div>
              </div>

              <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #C7181F;">${params.emailsSent}</div>
                <div style="color: #666;">Emails Sent</div>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${params.dashboardUrl}" style="display: inline-block; background-color: #1B3A7D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Full Report</a>
            </div>

            <p style="margin-top: 30px;">
              — ${params.botName} 🤖
            </p>
          </div>
        </body>
      </html>
    `,
    text: `${params.botName}'s Weekly Report
${params.weekStart} - ${params.weekEnd}

Hi ${params.name},

Here's what ${params.botName} accomplished this week:

Calls Handled: ${params.callsHandled}
Appointments Booked: ${params.appointmentsBooked}
Leads Generated: ${params.leadsGenerated}
Emails Sent: ${params.emailsSent}

View Full Report: ${params.dashboardUrl}

— ${params.botName} 🤖`,
  }
}
