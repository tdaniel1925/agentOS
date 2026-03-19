/**
 * Setup Postmark Inbound Domain via API
 * Run with: node scripts/setup-postmark-inbound.js
 */

const POSTMARK_API_KEY = 'b7cb1c56-6c91-4cc0-b76f-50555532890d'
const POSTMARK_ACCOUNT_TOKEN = POSTMARK_API_KEY // Usually the same
const INBOUND_DOMAIN = 'mail.jordyn.app'
const WEBHOOK_URL = 'https://jordyn.app/api/webhooks/postmark-inbound'

async function setupInboundDomain() {
  console.log('🔧 Setting up Postmark inbound domain...\n')

  try {
    // Step 1: Get server ID
    console.log('1️⃣ Getting server info...')
    const serverResponse = await fetch('https://api.postmarkapp.com/servers', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Postmark-Account-Token': POSTMARK_ACCOUNT_TOKEN
      }
    })

    if (!serverResponse.ok) {
      const error = await serverResponse.text()
      throw new Error(`Failed to get servers: ${error}`)
    }

    const servers = await serverResponse.json()
    if (!servers.Servers || servers.Servers.length === 0) {
      throw new Error('No servers found')
    }

    const serverId = servers.Servers[0].ID
    console.log(`✅ Server ID: ${serverId}\n`)

    // Step 2: Create inbound domain
    console.log('2️⃣ Creating inbound domain:', INBOUND_DOMAIN)
    const domainResponse = await fetch(`https://api.postmarkapp.com/servers/${serverId}/domains`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': POSTMARK_API_KEY
      },
      body: JSON.stringify({
        Name: INBOUND_DOMAIN
      })
    })

    if (!domainResponse.ok) {
      const error = await domainResponse.json()
      if (error.Message && error.Message.includes('already exists')) {
        console.log('⚠️  Domain already exists, continuing...\n')
      } else {
        throw new Error(`Failed to create domain: ${JSON.stringify(error)}`)
      }
    } else {
      const domain = await domainResponse.json()
      console.log('✅ Domain created!')
      console.log('   ID:', domain.ID)
      console.log('   Name:', domain.Name)
      console.log('')
    }

    // Step 3: Set inbound webhook URL on server
    console.log('3️⃣ Setting inbound webhook URL...')
    const webhookResponse = await fetch(`https://api.postmarkapp.com/servers/${serverId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': POSTMARK_API_KEY
      },
      body: JSON.stringify({
        InboundHookUrl: WEBHOOK_URL
      })
    })

    if (!webhookResponse.ok) {
      const error = await webhookResponse.text()
      throw new Error(`Failed to set webhook: ${error}`)
    }

    console.log('✅ Webhook URL set to:', WEBHOOK_URL)
    console.log('')

    // Step 4: Get DNS instructions
    console.log('4️⃣ DNS Records Required:\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Add these records to your DNS provider (Cloudflare/GoDaddy/Namecheap):\n')

    console.log('📧 MX Record:')
    console.log('   Type:     MX')
    console.log('   Host:     mail')
    console.log('   Value:    inbound.postmarkapp.com')
    console.log('   Priority: 10')
    console.log('   TTL:      3600 (or Auto)\n')

    console.log('✉️  CNAME Record (for tracking):')
    console.log('   Type:  CNAME')
    console.log('   Host:  pm._domainkey.mail')
    console.log('   Value: pm.mtasv.net')
    console.log('   TTL:   3600 (or Auto)\n')

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('✅ Postmark inbound setup complete!')
    console.log('')
    console.log('⏳ Next steps:')
    console.log('   1. Add DNS records above (takes 5-30 minutes to propagate)')
    console.log('   2. Verify domain in Postmark dashboard')
    console.log('   3. Test by sending email to: u-test123@mail.jordyn.app')
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

setupInboundDomain()
