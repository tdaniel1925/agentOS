---
name: campaign-create
description: Creates a multi-email nurture campaign for a prospect. Uses Claude Opus to research the prospect and write personalized emails. Generates a preview for subscriber approval before launching.
---

# Campaign Create Skill

## Model
claude-opus-4-6 (complex task — needs best quality)
This is an async task — subscriber gets immediate acknowledgment then notification when complete.

## Process

### Step 1: Acknowledge immediately
SMS subscriber: "Creating [name]'s campaign now. This takes about 60 seconds — I'll text you preview #1 when ready."

### Step 2: Research prospect
Use web search skill to research:
- Their industry and role
- Common pain points for their profession
- Why they might need the subscriber's service
- Best messaging approach for this demographic

### Step 3: Generate email sequence
Using research + subscriber's industry pack:
- Generate all [sequence_length] emails
- Each email must be:
  * Personally relevant to prospect's background
  * Different angle/topic from previous emails
  * Appropriate length (150-300 words)
  * Clear but soft call to action
  * Sound like it came from a real person
  * Not AI-generated sounding

### Step 4: Stage in database
Insert campaign record: status = 'preview'
Insert all campaign_emails with scheduled_at timestamps (interval_days apart from approved_at)

### Step 5: Send preview
Email email #1 to subscriber's email with subject:
"[Preview] Campaign for [prospect_name] — Approve to launch"

SMS subscriber:
"Campaign for [prospect_name] ready!
Check your email for preview #1.
Reply YES to launch all [N] emails (every [N] days)
Or reply EDIT to change something."

### Step 6: Wait for approval
Campaign stays in 'preview' status until subscriber replies YES.
If EDIT received: revise email #1 and resend preview.
If no response in 48 hours: send reminder.

### Step 7: On YES approval
Set campaign status = 'active'
Set approved_at = NOW()
Recalculate all scheduled_at timestamps from now
First email sends in [interval_days] from now

## Error Handling
If prospect email is invalid: alert subscriber, don't create campaign.
If subscriber not on campaigns plan: upgrade offer.

## Implementation Notes
- Uses Claude Opus for research and email generation (quality is critical)
- Web search used for prospect research (LinkedIn, company info, industry data)
- Emails generated with tone matching subscriber's industry and brand voice
- PII scanner runs on all generated content before storage
- All costs logged to cost_events table
- All actions logged to commands_log table

## Example Usage
"Create a 6 month nurture campaign for John Smith at jsmith@email.com. He's a stock broker who may need life insurance. Send every 4 days. Show me email 1 first."

Response: "Creating John's campaign now. This takes about 60 seconds — I'll text you preview #1 when ready."

[60 seconds later]
"Campaign for John Smith ready! Check your email for preview #1. Reply YES to launch all 45 emails (every 4 days) Or reply EDIT to change something."
