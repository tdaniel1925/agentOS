---
name: fallback-handler
description: Handles commands the bot cannot execute yet. Never says "I can't" — always offers alternative or upgrade path. Logs everything to unknown_requests.
---

# Fallback Handler

## Purpose

When the bot receives a command it cannot execute, this skill:
1. Logs the request to `unknown_requests` table
2. Checks if the feature maps to an available add-on skill
3. Provides a helpful response with alternatives
4. Offers upgrade path if applicable

## Response Template

```
I may need my programming updated to [do what they asked].

What I CAN do right now:
[list 2-3 most relevant things the bot can do]

Want me to request the upgrade?
[UPGRADE OPTION if skill exists as add-on]
Reply SUGGEST and I'll pass this to my team.
```

## Upgrade Detection

Check if the requested feature maps to an available add-on:

- **Social media request** → Social Media Skill ($49/mo)
  - Keywords: "post", "instagram", "facebook", "linkedin", "social"

- **Lead finding** → Lead Generation ($49/mo)
  - Keywords: "leads", "prospects", "find clients", "build list"

- **Email campaigns** → Nurture Campaigns ($49/mo)
  - Keywords: "email campaign", "newsletter", "email blast", "drip campaign"

- **Quote follow-up** → Quote Follow-Up ($29/mo)
  - Keywords: "follow up quotes", "quote reminders", "pending quotes"

- **Renewal alerts** → Renewal Alerts ($29/mo)
  - Keywords: "renewals", "expiring policies", "renewal reminders"

- **Review requests** → Review Requests ($19/mo)
  - Keywords: "reviews", "testimonials", "google reviews", "ask for review"

- **Referral campaigns** → Referral Campaigns ($29/mo)
  - Keywords: "referrals", "referral program", "ask for referrals"

- **Outbound calling** → Outbound Calling ($49/mo)
  - Keywords: "call leads", "phone outreach", "dial for dollars"

- **Analytics** → Analytics Dashboard ($19/mo)
  - Keywords: "analytics", "metrics", "roi", "performance report"

## Response Examples

### Example 1: Social Media Request (Upgrade Available)

**Input**: "Create a post about our new product launch"

**Response**:
```
I can learn how to do that! Social media posting is $49/mo extra.
Want me to upgrade myself? Reply YES to add the Social Media skill.
```

### Example 2: Unknown Request (No Matching Add-On)

**Input**: "Book me a flight to Dallas"

**Response**:
```
I may need my programming updated for that.

What I CAN do right now:
- Check your missed calls
- Make business calls for you
- Schedule appointments
- Send you reports

Reply SUGGEST and I'll pass this to my team — if enough people ask, I'll learn it soon!
```

### Example 3: Feature Request Already Active

**Input**: "I want social media posting" (but they already have the Social Media skill)

**Response**:
```
You already have the Social Media skill! Try:
- "Create a post about [topic]"
- "Schedule posts for this week"
- "How did my posts do?"
```

## Logging

Always log to `unknown_requests` table:

```sql
INSERT INTO unknown_requests (
  subscriber_id,
  channel,
  sender_identifier,
  raw_message,
  suggested_feature,
  created_at
) VALUES (
  [subscriber_id],
  'sms',
  [phone_number],
  [original_message],
  [best_guess_feature_name],
  NOW()
)
```

## Upgrade Confirmation Flow

If user replies "YES" to an upgrade offer:
1. Create Stripe checkout session for the add-on
2. Send them the checkout link via SMS
3. "Great! Here's your upgrade link: [URL]. I'll activate as soon as payment processes."

If user replies "SUGGEST":
1. Log to `unknown_requests` with `suggested_by_user = true`
2. "Request logged! I'll let my team know. Thanks for helping me get better!"

## Implementation Notes

- Never say "I can't do that" — always positive framing
- Always offer alternatives or next steps
- Always log the request (helps product team prioritize features)
- Check active features before suggesting upgrades
- Keep responses short and actionable
