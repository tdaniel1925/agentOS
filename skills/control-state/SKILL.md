---
name: control-state
description: Handles stop, pause, resume, redirect, and priority commands from subscribers. Updates control_states table. All subsequent actions check this table first.
---

# Control State Skill

## Purpose

Gives subscribers full control over bot behavior via SMS commands:
- Pause operations temporarily or indefinitely
- Resume from pause
- Set inbound-only mode (no outbound actions)
- Vacation mode (minimal activity)
- Pause specific features
- Set priority tasks
- Emergency stop

## Supported Commands

### PAUSE (with duration)

**Inputs**:
- "Pause for 2 hours"
- "Hold everything"
- "Stop for now"
- "Pause until 3pm"

**Behavior**:
- Set `paused_until = NOW() + duration`
- If no duration: ask "How long? Reply with minutes or BACK when done"
- Auto-resume at `paused_until`
- Confirm: "Paused until [time]. Text RESUME to start earlier."

**Database**:
```sql
UPDATE control_states
SET
  mode = 'paused',
  paused_until = [calculated_timestamp],
  updated_at = NOW()
WHERE subscriber_id = [id]
```

### RESUME

**Inputs**:
- "Resume"
- "GO"
- "Back to normal"
- "RESUME"

**Behavior**:
- Clear `paused_until`
- Clear `paused_features`
- Set `mode = 'full'`
- Confirm: "Back to full operation. Resuming [N] paused tasks."

**Database**:
```sql
UPDATE control_states
SET
  mode = 'full',
  paused_until = NULL,
  paused_features = NULL,
  updated_at = NOW()
WHERE subscriber_id = [id]
```

### INBOUND ONLY

**Inputs**:
- "I'm in a meeting"
- "Only answer calls"
- "Inbound only for 1 hour"

**Behavior**:
- Set `mode = 'inbound-only'`
- If duration given: set `mode_expires_at`
- Confirm: "Inbound only mode on. I'll answer calls but won't make any outbound moves."

**What it does**:
- Still answers inbound calls
- Still responds to SMS
- Does NOT make outbound calls
- Does NOT send proactive emails
- Does NOT post to social media

### VACATION MODE

**Inputs**:
- "Vacation until Monday"
- "I'm away until March 15"
- "Out of office next week"

**Behavior**:
- Set `mode = 'vacation'`
- Set `mode_expires_at = return_date`
- Auto-resume on return date
- Confirm: "Vacation mode on until [date]. I'll take messages and answer urgent calls only."

**What it does**:
- Answers inbound calls with "out of office" message
- Collects messages for review
- Flags truly urgent calls (emergencies only)
- Pauses all campaigns and outbound activity

### FEATURE PAUSE

**Inputs**:
- "Stop social media"
- "Don't send emails today"
- "Pause lead generation"

**Behavior**:
- Add feature to `paused_features` array
- Confirm: "Social media paused. Resume with 'resume social'."

**Database**:
```sql
UPDATE control_states
SET
  paused_features = array_append(paused_features, 'social_media'),
  updated_at = NOW()
WHERE subscriber_id = [id]
```

### PRIORITY TASK

**Inputs**:
- "Drop everything and call John Smith"
- "Priority: follow up all pending quotes"
- "Emergency: call all clients about the storm"

**Behavior**:
- Set `priority_task = task_description`
- All other tasks pause
- Confirm: "On it — everything else on hold until done."

**Database**:
```sql
UPDATE control_states
SET
  priority_task = [task_description],
  priority_set_at = NOW(),
  updated_at = NOW()
WHERE subscriber_id = [id]
```

### EVERYTHING STOP

**Inputs**:
- "STOP"
- "Emergency stop"
- "Stop everything now"

**Behavior**:
- Set `mode = 'emergency_stop'`
- Cancel all queued tasks
- Stop all active campaigns
- Confirm with full status of what was stopped

**Confirmation**:
```
EMERGENCY STOP activated.

Stopped:
- 3 outbound calls in queue
- 2 active email campaigns
- Social media scheduler

Text RESUME when ready to restart.
```

## Checking Control State

All skills must check `control_states` before taking action:

```typescript
const { data: controlState } = await supabase
  .from('control_states')
  .select('*')
  .eq('subscriber_id', subscriberId)
  .single()

// Check if paused
if (controlState.paused_until && new Date(controlState.paused_until) > new Date()) {
  return { blocked: true, reason: 'subscriber_paused' }
}

// Check mode
if (controlState.mode === 'inbound-only' && actionType === 'outbound') {
  return { blocked: true, reason: 'inbound_only_mode' }
}

// Check feature pause
if (controlState.paused_features?.includes(featureName)) {
  return { blocked: true, reason: 'feature_paused' }
}

// Check priority task
if (controlState.priority_task && taskId !== controlState.priority_task) {
  return { blocked: true, reason: 'priority_task_active' }
}
```

## Auto-Resume Logic

Run this check before every action:

```typescript
// Auto-resume if pause expired
if (controlState.paused_until && new Date(controlState.paused_until) <= new Date()) {
  await supabase
    .from('control_states')
    .update({
      mode: 'full',
      paused_until: null,
      updated_at: new Date().toISOString()
    })
    .eq('subscriber_id', subscriberId)

  // Notify subscriber
  await sendSMS({
    to: subscriber.contact_phone,
    body: "Auto-resumed. Back to full operation!"
  })
}
```

## Database Schema

The `control_states` table:

```sql
CREATE TABLE control_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id),
  mode TEXT NOT NULL DEFAULT 'full', -- 'full', 'paused', 'inbound-only', 'vacation', 'emergency_stop'
  paused_until TIMESTAMPTZ NULL,
  paused_features TEXT[] DEFAULT '{}',
  priority_task TEXT NULL,
  priority_set_at TIMESTAMPTZ NULL,
  mode_expires_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscriber_id)
)
```

## Response Examples

### Pause with duration
```
Input: "Pause for 2 hours"
Response: "Paused until 3:45 PM. Text RESUME to start earlier."
```

### Pause without duration
```
Input: "Pause"
Response: "How long should I pause? Reply with '1 hour', '30 minutes', or BACK when you're ready."
```

### Resume
```
Input: "RESUME"
Response: "Back to full operation. I'm on it!"
```

### Inbound only
```
Input: "I'm in a meeting for 1 hour"
Response: "Inbound only mode on until 2:30 PM. I'll answer calls but won't make any outbound moves."
```

### Feature pause
```
Input: "Stop social media"
Response: "Social media paused. Resume with 'resume social'."
```

### Priority task
```
Input: "Drop everything and call all pending quotes"
Response: "On it — calling all pending quotes now. Everything else on hold until done."
```

### Emergency stop
```
Input: "STOP"
Response: "EMERGENCY STOP activated. All tasks paused. Text RESUME when ready."
```

## Implementation Notes

- Always update `updated_at` timestamp
- Log all control state changes to `commands_log`
- Send confirmation SMS for every control change
- Check control state at the START of every skill execution
- Auto-resume logic should run on every webhook/cron trigger
