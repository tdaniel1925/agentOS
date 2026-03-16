# Calendar SMS Commands

## Overview

Users can manage their Microsoft Outlook/Office 365 calendar via SMS text messages to Jordan. Calendar integration uses the same Microsoft OAuth connection as email.

---

## Prerequisites

User must have connected their Microsoft account first:
- Text: **"connect email"**
- This grants Jordan access to both email AND calendar

---

## SMS Commands

### 1. View Today's Schedule

**Commands:**
- `calendar today`
- `show calendar`
- `what's on my calendar today`
- `schedule today`

**Response Example:**
```
📅 Today's Schedule (3 events)

1. ⏰ 9:00 AM - 10:00 AM
   📅 Team Standup
   📍 Conference Room A

2. ⏰ 2:00 PM - 3:30 PM
   📅 Client Meeting
   👥 3 attendees

3. ⏰ 5:00 PM - 6:00 PM
   📅 Project Review
```

---

### 2. View This Week's Schedule

**Commands:**
- `calendar week`
- `show week`
- `what's on my calendar this week`
- `schedule this week`

**Response Example:**
```
📅 This Week (7 events)

Mon, Mar 18:
  1. 9:00 AM - Team Standup
  2. 2:00 PM - Client Call

Tue, Mar 19:
  1. 10:00 AM - Budget Review
  2. All Day - Conference

Wed, Mar 20:
  1. 1:00 PM - Sales Meeting
```

---

### 3. Quick Summary

**Commands:**
- `next meeting`
- `when is my next meeting`
- `what's next on my calendar`

**Response Example:**
```
Your next event is "Client Meeting" at 2:00 PM today.
```

---

### 4. Create/Book Meeting (via Natural Language)

**Commands:**
- `book meeting with John tomorrow at 2pm`
- `schedule call with Sarah next Tuesday 10am`
- `add dentist appointment Friday 3pm`

**Response Example:**
```
✅ Event created: "Meeting with John"
📅 Tomorrow at 2:00 PM - 3:00 PM
```

**Supported Formats:**
- Natural language date parsing (tomorrow, next Tuesday, etc.)
- Default duration: 1 hour (can be customized)
- Optional: Add location, attendees

**Advanced Examples:**
```
"book meeting with john@email.com tomorrow 2pm at office"
"schedule 30 minute call with team next monday 10am"
```

---

### 5. Calendar Status Check

**Commands:**
- `calendar status`
- `am i free today`
- `do i have any meetings`

**Response:**
Shows a quick count and next event summary

---

## Integration with Email Connection

Calendar uses the **same Microsoft OAuth connection** as email:

1. User texts: `connect email`
2. Jordan sends OAuth link
3. User authorizes Microsoft account
4. Jordan now has access to:
   - ✅ Email (read/send)
   - ✅ Calendar (read/write)

**To disconnect:**
- Text: `disconnect email`
- This removes BOTH email and calendar access

---

## Voice Calendar Check

### Trigger Command (SMS):
- `call me about my calendar`
- `voice calendar check`

### What Happens:
1. Jordan calls the user immediately
2. Reads today's schedule aloud
3. User can ask: "What's next?", "When's my meeting with John?", "Am I free at 3pm?"

**Example Call:**
```
Jordan: "Hey! I just checked your calendar. You have 3 events
         today. Want me to go through them?"

User: "Yes"

Jordan: "Event 1: Team Standup at 9 AM in Conference Room A.
         Event 2: Client Meeting at 2 PM with 3 attendees.
         Event 3: Project Review at 5 PM..."
```

---

## API Endpoints

### GET Today's Events
```
POST /api/calendar/today
Body: { subscriber_id: "uuid" }
```

### GET Week's Events
```
POST /api/calendar/week
Body: { subscriber_id: "uuid" }
```

### CREATE Event
```
POST /api/calendar/create
Body: {
  subscriber_id: "uuid",
  subject: "Meeting Title",
  start: "2024-03-18T14:00:00Z",
  end: "2024-03-18T15:00:00Z",
  location: "Conference Room",
  attendees: ["john@email.com"],
  isAllDay: false
}
```

---

## Database Logging

All calendar commands are logged to `commands_log`:

```sql
INSERT INTO commands_log (
  subscriber_id,
  command,
  intent,
  success,
  response_sent,
  metadata
) VALUES (
  'user-uuid',
  'calendar_today',
  'CALENDAR_VIEW',
  true,
  'Found 3 events today',
  '{"event_count": 3}'
);
```

**Common Intents:**
- `CALENDAR_VIEW` - Viewing calendar
- `CALENDAR_CREATE` - Creating events
- `CALENDAR_VOICE_CHECK` - Voice calendar call

---

## Error Handling

### No Microsoft Connection
**User texts:** `calendar today`
**Response:** `❌ Calendar not connected yet. Text "connect email" to get started.`

### No Events
**User texts:** `calendar today`
**Response:** `📅 Today's Schedule\n\nNo events scheduled. You're free!`

### Token Expired
- Auto-refresh handled transparently
- User never sees token errors

---

## Natural Language Processing

Jordan can understand various phrasings:

**For Viewing:**
- "show my schedule"
- "what do i have today"
- "am i busy tomorrow"

**For Booking:**
- "set up meeting with john 2pm"
- "add dentist appointment friday"
- "schedule team call next week"

**For Canceling:**
- "cancel my 2pm meeting"
- "remove dentist appointment"

---

## Future Enhancements

### Smart Scheduling
```
User: "find time to meet with john this week"
Jordan: "You're both free Tuesday at 10am or Thursday at 2pm. Which works?"
```

### Meeting Prep
```
User: "what's my next meeting about?"
Jordan: "Client Meeting at 2pm. Last time you discussed Q1 goals.
         3 attendees. No agenda attached."
```

### Conflict Detection
```
Jordan: "⚠️ You just booked a meeting at 2pm but you already have
         'Client Call' scheduled. Should I move one?"
```

---

## Security & Privacy

- ✅ OAuth tokens encrypted with AES-256
- ✅ Calendar data not stored (real-time Graph API queries)
- ✅ User can disconnect anytime via SMS
- ✅ All actions logged for transparency

---

## Testing Checklist

- [ ] Connect Microsoft account via SMS
- [ ] View today's calendar
- [ ] View week's calendar
- [ ] Create simple event
- [ ] Create event with attendees
- [ ] Test voice calendar check call
- [ ] Disconnect and verify access revoked

---

**🎉 Calendar Integration is Ready!**

Users can now manage their Microsoft Calendar entirely via SMS and voice commands through Jordan.
