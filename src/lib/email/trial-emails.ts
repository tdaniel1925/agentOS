/**
 * Trial Email Templates
 * Email notifications for trial reminders and expiration
 */

interface TrialReminderParams {
  name: string
  businessName: string
  botName: string
  daysLeft: number
  trialEndsAt: string
}

interface TrialExpirationParams {
  name: string
  businessName: string
  botName: string
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/**
 * Day 5 Reminder Email - 2 days left in trial
 */
export function trialDay5Reminder(params: TrialReminderParams): EmailTemplate {
  const { name, businessName, botName, daysLeft, trialEndsAt } = params

  const subject = `Your ${botName} trial ends in ${daysLeft} days`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1B3A7D 0%, #2A4A8D 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">AgentOS</h1>
  </div>

  <div style="background: #FFF8E1; border-left: 4px solid #FFC107; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
    <p style="margin: 0; font-size: 16px; color: #856404;">
      <strong>Your trial ends in ${daysLeft} days</strong>
    </p>
  </div>

  <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Your <strong>${botName}</strong> trial for <strong>${businessName}</strong> ends on <strong>${trialEndsAt}</strong>.
  </p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Don't lose access to:
  </p>

  <ul style="font-size: 16px; margin-bottom: 30px; padding-left: 20px;">
    <li style="margin-bottom: 10px;">24/7 AI phone answering for your business</li>
    <li style="margin-bottom: 10px;">Automated appointment scheduling</li>
    <li style="margin-bottom: 10px;">Lead capture and follow-ups</li>
    <li style="margin-bottom: 10px;">Email and SMS campaign management</li>
  </ul>

  <div style="text-align: center; margin: 40px 0;">
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/app/billing"
       style="display: inline-block; background: #C7181F; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Upgrade Now
    </a>
  </div>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Choose from our flexible plans starting at just <strong>$97/month</strong>.
  </p>

  <div style="background: #F5F5F5; padding: 20px; border-radius: 8px; margin-top: 30px;">
    <p style="margin: 0; font-size: 14px; color: #666;">
      Questions? Reply to this email or visit your dashboard to learn more.
    </p>
  </div>

  <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E0E0E0;">
    <p style="font-size: 12px; color: #999; margin: 0;">
      AgentOS by BotMakers Inc.<br>
      Professional AI digital employees for your business
    </p>
  </div>
</body>
</html>
`

  const text = `
Hi ${name},

Your ${botName} trial for ${businessName} ends on ${trialEndsAt}.

Don't lose access to:
- 24/7 AI phone answering for your business
- Automated appointment scheduling
- Lead capture and follow-ups
- Email and SMS campaign management

Upgrade now to continue: ${process.env.NEXT_PUBLIC_APP_URL}/app/billing

Choose from our flexible plans starting at just $97/month.

Questions? Reply to this email or visit your dashboard to learn more.

---
AgentOS by BotMakers Inc.
Professional AI digital employees for your business
`

  return { subject, html, text }
}

/**
 * Day 7 Expiration Email - Trial has ended
 */
export function trialDay7Expiration(params: TrialExpirationParams): EmailTemplate {
  const { name, businessName, botName } = params

  const subject = `Your ${botName} trial has ended`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1B3A7D 0%, #2A4A8D 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">AgentOS</h1>
  </div>

  <div style="background: #FFEBEE; border-left: 4px solid #C7181F; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
    <p style="margin: 0; font-size: 16px; color: #C62828;">
      <strong>Your trial has ended</strong>
    </p>
  </div>

  <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Your 7-day trial of <strong>${botName}</strong> for <strong>${businessName}</strong> has ended.
  </p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Your AI agent has been <strong>paused</strong> until you upgrade to a paid plan.
  </p>

  <div style="background: #F5F5F5; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1B3A7D;">What happens now?</h3>
    <ul style="margin: 0; padding-left: 20px;">
      <li style="margin-bottom: 10px;">Your AI agent is no longer answering calls</li>
      <li style="margin-bottom: 10px;">Scheduled campaigns have been paused</li>
      <li style="margin-bottom: 10px;">You can still log in to view your data</li>
      <li style="margin-bottom: 10px;">All your settings and history are saved</li>
    </ul>
  </div>

  <p style="font-size: 16px; margin-bottom: 20px;">
    <strong>Ready to reactivate ${botName}?</strong>
  </p>

  <div style="text-align: center; margin: 40px 0;">
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/app/billing"
       style="display: inline-block; background: #C7181F; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Upgrade to Reactivate
    </a>
  </div>

  <div style="background: #E8F5E9; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #2E7D32;">Flexible Plans Starting at $97/month</h3>
    <ul style="margin: 0; padding-left: 20px;">
      <li style="margin-bottom: 10px;"><strong>Basic Plan ($97/mo):</strong> Essential features for small businesses</li>
      <li style="margin-bottom: 10px;"><strong>Pro Plan ($197/mo):</strong> Advanced automation and integrations</li>
      <li style="margin-bottom: 10px;"><strong>Enterprise:</strong> Custom solutions for growing teams</li>
    </ul>
  </div>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Questions about pricing or need help choosing a plan? Reply to this email and we'll help you find the right fit.
  </p>

  <div style="background: #F5F5F5; padding: 20px; border-radius: 8px; margin-top: 30px;">
    <p style="margin: 0; font-size: 14px; color: #666;">
      <strong>Not ready to upgrade?</strong><br>
      Your account will remain accessible for 30 days. After that, your data will be archived.
    </p>
  </div>

  <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E0E0E0;">
    <p style="font-size: 12px; color: #999; margin: 0;">
      AgentOS by BotMakers Inc.<br>
      Professional AI digital employees for your business
    </p>
  </div>
</body>
</html>
`

  const text = `
Hi ${name},

Your 7-day trial of ${botName} for ${businessName} has ended.

Your AI agent has been PAUSED until you upgrade to a paid plan.

WHAT HAPPENS NOW?
- Your AI agent is no longer answering calls
- Scheduled campaigns have been paused
- You can still log in to view your data
- All your settings and history are saved

READY TO REACTIVATE ${botName.toUpperCase()}?

Upgrade now: ${process.env.NEXT_PUBLIC_APP_URL}/app/billing

FLEXIBLE PLANS STARTING AT $97/MONTH:
- Basic Plan ($97/mo): Essential features for small businesses
- Pro Plan ($197/mo): Advanced automation and integrations
- Enterprise: Custom solutions for growing teams

Questions about pricing or need help choosing a plan? Reply to this email and we'll help you find the right fit.

NOT READY TO UPGRADE?
Your account will remain accessible for 30 days. After that, your data will be archived.

---
AgentOS by BotMakers Inc.
Professional AI digital employees for your business
`

  return { subject, html, text }
}

/**
 * Trial Expired Email - Alias for trialDay7Expiration
 * Sent when trial has ended (same as day 7 expiration)
 */
export function sendTrialExpired(params: TrialExpirationParams): EmailTemplate {
  return trialDay7Expiration(params)
}
