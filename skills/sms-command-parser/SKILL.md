---
name: sms-command-parser
description: Parses natural language SMS from subscriber into structured intents. Uses Haiku (cheapest model) for speed and cost efficiency.
---

# SMS Command Parser

## Model
claude-haiku-4-5-20251001 (fastest, cheapest)
Max tokens: 500
Temperature: 0

## Task
Convert raw SMS text into a structured intent object.

## Intent Categories

### CALL_RELATED
- `CHECK_MISSED_CALLS`: "what calls did I miss", "any calls today"
- `MAKE_OUTBOUND_CALL`: "call [name] at [number] and [task]"
- `UPDATE_GREETING`: "change my greeting to...", "update voicemail"
- `PAUSE_CALLS`: "pause calls for [duration]", "stop answering calls"
- `RESUME_CALLS`: "resume calls", "start taking calls again"

### EMAIL_RELATED
- `CHECK_EMAIL`: "check my emails", "what's in my inbox"
- `SEND_EMAIL`: "email [name] about..."
- `CREATE_CAMPAIGN`: "create a campaign for..."
- `PAUSE_CAMPAIGN`: "pause the campaign for [name]"
- `CAMPAIGN_REPORT`: "how is my [name] campaign doing"

### SOCIAL_RELATED
- `CREATE_POST`: "post about...", "create a post..."
- `SCHEDULE_POSTS`: "schedule posts for this week"
- `SOCIAL_REPORT`: "how did my posts do"

### LEAD_RELATED
- `GENERATE_LEADS`: "find leads in...", "build a lead list"
- `FOLLOW_UP_LEADS`: "follow up on my leads"

### APPOINTMENT_RELATED
- `CHECK_SCHEDULE`: "what's on my schedule", "do I have appointments"
- `BOOK_APPOINTMENT`: "book an appointment with..."
- `CANCEL_APPOINTMENT`: "cancel my..."

### CONTROL_RELATED
- `PAUSE_BOT`: "stop everything", "pause", "hold"
- `RESUME_BOT`: "resume", "go", "back to normal"
- `CHECK_STATUS`: "what are you doing", "status"
- `ADD_SKILL`: "add social media", "I want..."
- `REMOVE_SKILL`: "remove...", "cancel..."

### REPORT_RELATED
- `WEEKLY_REPORT`: "give me my report", "how did I do"
- `COST_REPORT`: "how much have I used"
- `CALL_REPORT`: "how many calls this week"

### UNKNOWN
- Anything that doesn't match above categories

## Output Format

Return JSON only. No other text.

```json
{
  "intent": "MAKE_OUTBOUND_CALL",
  "confidence": 0.95,
  "entities": {
    "contact_name": "John Smith",
    "contact_number": "7135550100",
    "task": "check on his policy renewal",
    "tone": "professional"
  },
  "requires_confirmation": false,
  "is_urgent": false
}
```

## Examples

### Example 1: Outbound Call Request
**Input**: "Call John Smith at 713-555-0100 and ask about his renewal"

**Output**:
```json
{
  "intent": "MAKE_OUTBOUND_CALL",
  "confidence": 0.98,
  "entities": {
    "contact_name": "John Smith",
    "contact_number": "7135550100",
    "task": "ask about his renewal",
    "tone": "professional"
  },
  "requires_confirmation": false,
  "is_urgent": false
}
```

### Example 2: Check Missed Calls
**Input**: "What calls did I miss today?"

**Output**:
```json
{
  "intent": "CHECK_MISSED_CALLS",
  "confidence": 0.99,
  "entities": {
    "timeframe": "today"
  },
  "requires_confirmation": false,
  "is_urgent": false
}
```

### Example 3: Pause Bot
**Input**: "I'm going into a meeting for 2 hours, pause everything"

**Output**:
```json
{
  "intent": "PAUSE_BOT",
  "confidence": 0.95,
  "entities": {
    "duration": "2 hours",
    "reason": "going into a meeting"
  },
  "requires_confirmation": false,
  "is_urgent": false
}
```

### Example 4: Unknown Request
**Input**: "Book me a flight to Dallas"

**Output**:
```json
{
  "intent": "UNKNOWN",
  "confidence": 0.99,
  "entities": {
    "requested_action": "book flight",
    "destination": "Dallas"
  },
  "requires_confirmation": false,
  "is_urgent": false
}
```

## Error Handling

If unable to parse:
```json
{
  "intent": "UNKNOWN",
  "confidence": 0.0,
  "entities": {},
  "requires_confirmation": true,
  "is_urgent": false
}
```

## System Prompt

You are an expert at parsing natural language commands into structured intent objects.

Given a text message from a subscriber to their AI assistant, classify the intent and extract relevant entities.

Return ONLY valid JSON with this structure:
- intent: The intent category (uppercase snake_case)
- confidence: Float between 0-1
- entities: Object with extracted information
- requires_confirmation: Boolean (true if ambiguous)
- is_urgent: Boolean (true if time-sensitive)

Be precise. Extract phone numbers, names, durations, and other entities accurately.
