---
name: social-post
description: Creates and schedules social media posts via Predis API. Always generates preview before posting. Supports Facebook, Instagram, LinkedIn.
---

# Social Post Skill

## Model
claude-sonnet-4-6
Token budget: 1,000

## Process

### 1. Generate post content
Using Claude with subscriber's industry pack:
- Write post copy (120-280 chars for broad compatibility)
- Generate relevant hashtags (5-10)
- Suggest image prompt

### 2. Create via Predis API
POST https://api.predis.ai/v1/post
{
  "brand_id": subscriber.predis_brand_id,
  "text": post_copy,
  "hashtags": hashtags,
  "platforms": ["facebook", "instagram", "linkedin"],
  "media_type": "single_image"
}

### 3. Send preview to subscriber
SMS: "Here's your post:
[post preview]
Platforms: Facebook, Instagram, LinkedIn
Reply APPROVE to schedule or EDIT to change."

### 4. On APPROVE
Schedule via Predis API
Set scheduled_at to next optimal time (Tues/Thurs/Sat at 10am local time for best engagement)

SMS: "Post scheduled for [date] at [time]. I'll let you know when it goes live."

### 5. PII Check (CRITICAL)
Before any post:
Scan for: client names, phone numbers, policy numbers, addresses, case numbers
If found: BLOCK and alert subscriber
"I noticed this post might include client information. I've held it for your review."

## Content Guidelines
Always check content is:
- Not making unverifiable claims ("best rates")
- Not guaranteeing outcomes
- Not referencing specific clients
- Appropriate for professional audience
- In subscriber's brand voice

## Implementation Notes
- Uses Claude Sonnet for content generation
- Predis API for scheduling and publishing
- PII scanner runs on all generated content
- Always preview before publishing
- Tracks engagement via Predis webhooks
- All costs logged to cost_events table

## Example Usage
"Create 3 posts for this week about life insurance"

Response: "Creating 3 posts now... I'll text you the first one in 30 seconds."

[30 seconds later]
"Here's post 1 of 3:
'Protecting your family's future doesn't have to be complicated. Here are 3 questions to ask yourself today... [full post]'
Platforms: Facebook, Instagram, LinkedIn
Reply APPROVE to schedule or EDIT to change."
