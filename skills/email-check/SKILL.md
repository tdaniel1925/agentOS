---
name: email-check
description: Reads subscriber's connected email inbox. Summarizes unread emails. Flags urgent items.
---

# Email Check Skill

## Process

1. Load OAuth tokens from Supabase
2. If tokens expired: send reconnection link
3. Fetch unread emails from last 24 hours (max 50)
4. Categorize each email:
   - URGENT: legal, IRS, regulator, urgent, emergency
   - CLIENT: from known contacts
   - LEAD: potential new business
   - ADMIN: billing, subscriptions
   - JUNK: promotional, spam
5. Generate summary
6. Respond via SMS (short) + email (full)

## SMS Response Format

```
Inbox summary (last 24hrs):
🔴 2 urgent (reply URGENT to see)
👤 5 client emails
🎯 1 potential lead
📋 8 admin emails

Want me to draft replies to any?
```

## PII Handling

Never store email body content longer than 24 hours.
Summaries stored without PII.

## Implementation

- Uses Claude Haiku for email categorization
- Gmail API / Microsoft Graph API for reading emails
- Encrypted OAuth token storage
- Auto-reconnect on token expiry
