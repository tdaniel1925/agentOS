---
name: lead-generate
description: Builds targeted prospect lists using web search and Claude research. Returns structured list with contact info and qualification data.
---

# Lead Generate Skill

## Model
claude-sonnet-4-6 + web search tool
Async task — subscriber notified when ready

## Process

### 1. Acknowledge
SMS: "Building your lead list — I'll text you when ready. Usually takes 2-3 minutes."

### 2. Parse the request
Extract:
- Target type (insurance agents, CPAs, realtors, etc.)
- Location (zip code, city, county)
- Size/qualifier (business owners, families, etc.)

### 3. Research
Use web search to find:
- LinkedIn profiles matching criteria
- Local business directories
- Industry associations in the area
- Chamber of commerce listings

### 4. Compile list
For each prospect capture:
- Name
- Business name
- Phone (if public)
- Email (if public)
- LinkedIn URL
- Why they match the criteria

### 5. Quality check
Remove: duplicates, incomplete records, already in subscriber's contacts

### 6. Deliver
Save to Supabase contacts table
Email subscriber: full list as CSV attachment
SMS: "Lead list ready! Found [N] prospects in [area]. Check your email for the full list. Want me to start a campaign for any of them?"

## Compliance
Only use publicly available information.
Never use scraping that violates ToS.
Include opt-out option in any outreach.

## Implementation Notes
- Uses Claude Sonnet for research and qualification
- Web search for finding prospects
- CSV export for easy import to CRM
- All prospects stored in contacts table
- Quality scoring for each lead
- Deduplication against existing contacts

## Example Usage
"Find 50 insurance leads in zip code 77450"

Response: "Building your lead list — I'll text you when ready. Usually takes 2-3 minutes."

[3 minutes later]
"Lead list ready! Found 47 prospects in 77450. Check your email for the full list. Want me to start a campaign for any of them?"
