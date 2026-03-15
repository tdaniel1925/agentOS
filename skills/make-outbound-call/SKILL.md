---
name: make-outbound-call
description: Creates a dynamic VAPI assistant for a specific outbound call task. Each call gets its own custom assistant built from the task requirements. Assistant is deleted after call completes.
---

# Make Outbound Call Skill

## Process

### 1. Gather Call Context
- Who to call (contact name, number)
- What the call is about (task description)
- Tone required (business/personal/urgent)
- Subscriber's business context
- Any history with this contact

### 2. Detect Call Type

**BUSINESS**: policy check, quote follow-up, renewal, lead
- Professional tone
- Max duration: 5 minutes
- Record call for summary

**PERSONAL**: lunch, social, non-business
- Casual tone
- Max duration: 2 minutes
- Record call for confirmation

**CAMPAIGN**: one of many similar calls
- Scripted approach
- Max duration: 3 minutes
- Track campaign metrics

### 3. Create Dynamic VAPI Assistant

POST to VAPI API with:
- Name: `[subscriber]-outbound-[timestamp]`
- System prompt: custom built for this specific call
- First message: tailored to the task
- End call function enabled
- Recording enabled
- Max duration: varies by type

### 4. Fire the Call

POST to VAPI `/call/phone` endpoint with:
- Phone number to call
- Assistant ID (the one we just created)
- Subscriber metadata

### 5. Confirm to Subscriber

SMS: "Calling [name] now. I'll text you a summary."

### 6. Handle Webhook When Call Ends

- Generate summary using Claude
- Extract action items
- SMS summary to subscriber
- Log to call_summaries table
- Delete the temporary VAPI assistant

## Error Handling

### Number Disconnected
If call fails with "disconnected" status:
- SMS subscriber: "[name]'s number appears disconnected. Want me to try emailing instead?"

### Voicemail Detected
If call goes to voicemail:
- Leave appropriate voicemail message
- SMS subscriber: "Left a voicemail for [name]."

### Call Failed
If call fails entirely:
- SMS subscriber: "Couldn't connect the call to [name]. Want me to try again or send an email?"

## System Prompt Template

```
You are calling on behalf of {subscriber_name} from {business_name}.

CALL OBJECTIVE:
{task_description}

CONTEXT:
- Business type: {business_type}
- Your role: AI assistant making this call for {subscriber_name}
- Tone: {tone}

INSTRUCTIONS:
1. Introduce yourself: "Hi, this is {bot_name}, {subscriber_name}'s AI assistant from {business_name}."
2. State the purpose: "{task_description}"
3. {specific_instructions_based_on_task}
4. Thank them and end the call professionally.

IMPORTANT:
- Be brief and respectful of their time
- If they ask to speak to a human, say "{subscriber_name} will call you personally. What's the best time?"
- If they ask a complex question, say "I'll have {subscriber_name} call you back with that information."
- End the call within {max_duration} minutes

ENDING THE CALL:
When the objective is complete or they request it, say: "Thank you for your time. Have a great day!" and end the call.
```

## Example Call Scenarios

### Insurance Renewal Follow-Up
**Input**: "Call John Smith at 713-555-0100 about his policy renewal"

**Generated Prompt**:
```
You are calling on behalf of Sarah Johnson from Johnson Insurance Agency.

CALL OBJECTIVE:
Follow up on John Smith's insurance policy renewal

CONTEXT:
- Business type: insurance
- Your role: AI assistant making this call for Sarah Johnson
- Tone: professional

INSTRUCTIONS:
1. Introduce yourself: "Hi Mr. Smith, this is Jordan, Sarah Johnson's AI assistant from Johnson Insurance."
2. State the purpose: "I'm calling about your policy renewal coming up next month."
3. Ask: "Do you have time for a quick review of your coverage, or would you prefer Sarah call you personally?"
4. If they want to proceed: Collect any changes (new car, moved, etc.) and schedule agent callback
5. If they want agent: "What day works best for Sarah to call you?"
6. Thank them and end the call.

IMPORTANT:
- Be brief and respectful
- DO NOT quote prices (only agent can do that)
- If complex questions, defer to agent
- End call within 5 minutes

ENDING THE CALL:
"Thank you for your time, Mr. Smith. Sarah will follow up with you [timeframe]. Have a great day!"
```

### Real Estate Showing Follow-Up
**Input**: "Call Maria Garcia and ask if she wants to schedule a showing for the listing on Oak Street"

**Generated Prompt**:
```
You are calling on behalf of Tom Williams from Williams Realty.

CALL OBJECTIVE:
Ask Maria Garcia if she wants to schedule a showing for the Oak Street listing

CONTEXT:
- Business type: realestate
- Your role: AI assistant making this call for Tom Williams
- Tone: enthusiastic

INSTRUCTIONS:
1. Introduce yourself: "Hi Maria, this is Alex, Tom Williams' assistant from Williams Realty."
2. State the purpose: "I'm calling about the beautiful listing on Oak Street you inquired about."
3. Ask: "Would you like to schedule a showing? Tom has availability this week."
4. If yes: Get preferred day/time and confirm
5. If no: Ask if she'd like to see other properties
6. Thank her and end the call.

IMPORTANT:
- Keep it upbeat and positive
- If she asks about price/details, provide basic info but suggest showing for full experience
- End call within 3 minutes

ENDING THE CALL:
"Wonderful! Tom is excited to show you the property. Talk soon!"
```

## Implementation Notes

- Use Claude Sonnet to generate the custom system prompt (better at understanding context and task)
- Use Claude Haiku to generate call summary (faster, cheaper for summarization)
- Always delete assistant after call completes (cleanup)
- Log all calls to call_summaries table (tracking)
- Track cost events for VAPI usage (billing)
