# VAPI Setup Skill

## Purpose
Connect to VAPI API and create the demo assistant for the AgentOS rep demo engine.

## What This Skill Does
1. Creates a VAPI assistant with industry-agnostic demo system prompt
2. Configures voice, model, and webhook settings
3. Returns the assistant ID to be added to .env.local

## Usage
```
Create VAPI demo assistant
```

## Implementation Notes
- Uses VAPI API key from environment
- Creates permanent assistant (not temporary like outbound calls)
- Configures webhook to point to /api/webhooks/demo-call
- Uses Claude Sonnet 4 for intelligent conversations
- Voice: Professional, friendly tone
- Records calls for transcript extraction

## System Prompt Strategy
The demo assistant uses a flexible system prompt that adapts to the prospect's business type (passed via metadata). Core message:
- Introduce Jordan as AI assistant
- Explain AgentOS value proposition
- Demonstrate 2-3 key features
- Ask for email to send follow-up
- Keep call under 3 minutes

## API Endpoint
POST https://api.vapi.ai/assistant

## Response
Returns assistant object with `id` field - this becomes VAPI_DEMO_ASSISTANT_ID
