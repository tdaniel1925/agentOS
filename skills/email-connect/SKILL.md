---
name: email-connect
description: Connects subscriber's Gmail or Outlook account via OAuth. Sends a one-time secure link.
---

# Email Connect Skill

## Process

1. Generate secure OAuth link (expires in 15 minutes)
2. Send link via SMS
3. On OAuth callback, store encrypted tokens in Supabase
4. Confirm connection: "Gmail connected! Daily summaries start tomorrow at 6am."

## Implementation

Uses OAuth 2.0 with PKCE for security
Tokens encrypted at rest using Supabase vault
Automatic token refresh when expired

## Security

- OAuth tokens encrypted with Supabase vault
- Never store passwords
- Read-only access to emails
- Tokens auto-expire after 90 days of inactivity
- User can revoke access anytime
