# AgentOS - BUILD TRACKER
**Project**: Mobile-First SMS Command Center
**Started**: 2026-03-16
**Status**: Ready to Build

---

## OVERVIEW

Building a mobile-first experience where:
- SMS = Command center (quick commands)
- Web = Data viewer (full details, mobile-optimized)
- Voice = Direct access (call Jordan anytime)

All channels work together seamlessly as ONE unified assistant experience.

---

## ARCHITECTURE DIAGRAM

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       ├─ SMS ──────→ Twilio ──→ AgentOS ──→ Quick Response + Web Link
       │                                      ↓
       ├─ Voice ────→ VAPI ───→ AgentOS      Mobile Web Pages
       │                                      (emails, calls, calendar)
       └─ Web ─────→ Direct Access ──────────→ Dashboard
```

---

## AGENT ASSIGNMENTS

### 🤖 AGENT 1: Mobile Email Interface
**Spec**: `AGENT-1-MOBILE-EMAIL-SPEC.md`
**Priority**: P1 (Critical Path)
**Estimated Time**: 3-4 hours
**Status**: ⏸️ Not Started

**Deliverables**:
- [ ] `src/app/m/emails/[id]/page.tsx` - Email inbox page
- [ ] `src/components/mobile/EmailInboxMobile.tsx` - Main UI
- [ ] `src/components/mobile/EmailCard.tsx` - Email card
- [ ] `src/components/mobile/EmailDetailModal.tsx` - Detail modal
- [ ] `src/components/mobile/FilterChip.tsx` - Filter button

**Success Criteria**:
- [ ] Loads from SMS link
- [ ] Filters work (all/urgent/client/lead)
- [ ] Email detail modal works
- [ ] Refresh button works
- [ ] Mobile-optimized (< 2s load)

---

### 🤖 AGENT 2: Mobile Calls & Calendar
**Spec**: `AGENT-2-MOBILE-CALLS-CALENDAR-SPEC.md`
**Priority**: P2
**Estimated Time**: 3-4 hours
**Status**: ⏸️ Not Started

**Deliverables**:
- [ ] `src/app/m/calls/[id]/page.tsx` - Call history page
- [ ] `src/app/m/calendar/[id]/page.tsx` - Calendar page
- [ ] `src/components/mobile/CallHistoryMobile.tsx` - Call list UI
- [ ] `src/components/mobile/CalendarMobile.tsx` - Calendar UI
- [ ] `src/components/mobile/CallCard.tsx` - Call card
- [ ] `src/components/mobile/CallDetailModal.tsx` - Call details
- [ ] `src/components/mobile/CalendarEventCard.tsx` - Event card

**Success Criteria**:
- [ ] Shows last 7 days of calls
- [ ] Transcripts display correctly
- [ ] Call back button works
- [ ] Calendar shows upcoming events
- [ ] "Not connected" state handles gracefully

---

### 🤖 AGENT 3: Phone Number Provisioning UI
**Spec**: `AGENT-3-PHONE-PROVISIONING-UI-SPEC.md`
**Priority**: P1 (Blocks onboarding)
**Estimated Time**: 4-5 hours
**Status**: ⏸️ Not Started

**Deliverables**:
- [ ] `src/app/onboarding/[id]/page.tsx` - Onboarding flow
- [ ] `src/components/onboarding/ProvisioningProgress.tsx` - Progress bar
- [ ] `src/components/onboarding/NumberChooser.tsx` - Number picker
- [ ] `src/components/onboarding/ProvisioningComplete.tsx` - Success screen
- [ ] `src/app/api/phone-numbers/search/route.ts` - Search API

**Success Criteria**:
- [ ] Progress bar shows while provisioning assistant
- [ ] User can search by ZIP code
- [ ] Shows 10 available numbers
- [ ] Charges $15 setup fee correctly
- [ ] Success screen shows correct number
- [ ] Redirects to dashboard when done

---

### 🤖 AGENT 4: SMS Link Integration
**Spec**: `AGENT-4-SMS-LINK-INTEGRATION-SPEC.md`
**Priority**: P1 (Enables web flow)
**Estimated Time**: 2-3 hours
**Status**: ⏸️ Not Started

**Deliverables**:
- [ ] Modify `src/lib/skills/email-check.ts` - Add link, store full data
- [ ] Create `src/lib/skills/call-check.ts` - New skill
- [ ] Create `src/lib/skills/calendar-check.ts` - New skill
- [ ] Modify `src/lib/skills/sms-parser.ts` - Add new intents
- [ ] Modify `src/lib/skills/executor.ts` - Add new handlers
- [ ] Create `src/app/api/skills/email-check/route.ts` - Refresh API

**Success Criteria**:
- [ ] Email SMS includes mobile link
- [ ] Call SMS includes mobile link
- [ ] Calendar SMS includes mobile link
- [ ] Links open correctly on mobile
- [ ] Refresh buttons work
- [ ] SMS responses under 200 characters

---

### 🤖 AGENT 5: Usage Dashboard
**Spec**: `AGENT-5-USAGE-DASHBOARD-SPEC.md`
**Priority**: P2
**Estimated Time**: 3-4 hours
**Status**: ⏸️ Not Started

**Deliverables**:
- [ ] `src/app/(dashboard)/usage/page.tsx` - Main page
- [ ] `src/components/dashboard/UsageOverview.tsx` - Usage cards
- [ ] `src/components/dashboard/UsageChart.tsx` - Historical chart
- [ ] `src/components/dashboard/UsageLimits.tsx` - Limit settings
- [ ] `src/app/api/usage/limits/route.ts` - Update API

**Success Criteria**:
- [ ] Shows real-time voice/SMS usage
- [ ] Overage warnings display prominently
- [ ] Chart shows last 30 days
- [ ] Spending limit is adjustable
- [ ] Can't set limit below $97

---

## DEPENDENCY GRAPH

```
┌─────────────────┐
│   Agent 3       │  Must complete first (blocks onboarding)
│   Phone Setup   │
└────────┬────────┘
         │
         ↓
    ┌────────────────────────────────┐
    │                                │
┌───▼────────┐  ┌────────────────┐  │
│  Agent 1   │  │    Agent 2     │  │
│  Emails    │  │  Calls/Cal     │  │
└───┬────────┘  └────────┬───────┘  │
    │                    │          │
    └────────┬───────────┘          │
             ↓                      │
    ┌────────────────┐              │
    │    Agent 4     │◄─────────────┘
    │  SMS Links     │  Needs mobile pages
    └────────┬───────┘
             │
             ↓
    ┌────────────────┐
    │    Agent 5     │  Can run anytime
    │  Usage Dash    │
    └────────────────┘
```

**Recommended Order**:
1. Launch Agent 3 (Phone Setup) - Blocks everything else
2. Launch Agents 1, 2, 5 in parallel - Independent
3. Launch Agent 4 last - Needs Agent 1 & 2 pages to exist

---

## TOTAL ESTIMATES

| Agent | Estimated Time | Lines of Code |
|-------|---------------|---------------|
| Agent 1: Mobile Email | 3-4 hours | ~420 lines |
| Agent 2: Calls & Calendar | 3-4 hours | ~700 lines |
| Agent 3: Phone Setup | 4-5 hours | ~600 lines |
| Agent 4: SMS Links | 2-3 hours | ~415 lines |
| Agent 5: Usage Dashboard | 3-4 hours | ~570 lines |
| **TOTAL** | **15-20 hours** | **~2,705 lines** |

---

## TESTING STRATEGY

### Unit Testing
Each agent must test their components in isolation:
- Component renders correctly
- Props are handled correctly
- State updates work
- Error states display

### Integration Testing
After all agents complete:
- SMS → Web link flow works end-to-end
- User can complete full onboarding
- Refresh buttons trigger correct APIs
- Mobile responsive on all devices

### E2E Testing
Final validation:
1. New user signs up
2. Chooses phone number
3. Texts Jordan "check email"
4. Clicks link in SMS
5. Views emails on mobile
6. Clicks refresh
7. Views updated data

---

## DEBUGGING GUIDELINES

### Issue: Agent can't find database table
**Solution**: Check migrations have run
```bash
cd supabase
supabase db push
```

### Issue: TypeScript errors
**Solution**: Check imports and types
```bash
npm run type-check
```

### Issue: Mobile page doesn't load
**Solution**: Check:
1. Route file exists in correct location
2. Server Component is async
3. Supabase query syntax is correct
4. subscriber_id param is passed correctly

### Issue: SMS link doesn't work
**Solution**: Check:
1. NEXT_PUBLIC_APP_URL env var is set
2. URL is publicly accessible (not localhost)
3. Mobile page actually exists at that route

---

## ENVIRONMENT VARIABLES CHECKLIST

Required for this build:
```bash
# Already have these:
✅ ANTHROPIC_API_KEY
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ STRIPE_SECRET_KEY
✅ TWILIO_ACCOUNT_SID
✅ TWILIO_AUTH_TOKEN
✅ VAPI_API_KEY
✅ MICROSOFT_CLIENT_ID
✅ MICROSOFT_CLIENT_SECRET

# Need to verify:
❓ NEXT_PUBLIC_APP_URL (must be public URL, not localhost)
   Example: https://theapexbots.com

# Optional but recommended:
❓ EMAIL_TOKEN_ENCRYPTION_KEY (32-char random string)
   Generate: openssl rand -base64 32
```

---

## DEPLOYMENT CHECKLIST

After all agents complete:

### Pre-Deploy
- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] All tests passing
- [ ] Environment variables set in Vercel
- [ ] Database migrations applied to production

### Deploy
- [ ] Push to main branch
- [ ] Vercel auto-deploys
- [ ] Check deployment logs
- [ ] Verify build succeeded

### Post-Deploy
- [ ] Test SMS → Web link flow on real phone
- [ ] Test phone provisioning with real Stripe card
- [ ] Test email refresh on mobile
- [ ] Monitor Sentry for errors
- [ ] Check Vercel analytics for performance

---

## ROLLBACK PLAN

If critical bugs found after deploy:

1. **Immediate**: Revert to previous Vercel deployment
   ```bash
   vercel rollback <previous-url>
   ```

2. **Fix**: Debug locally, fix issue

3. **Test**: Verify fix works

4. **Re-deploy**: Push fixed code

---

## SUCCESS METRICS

### Technical Metrics
- [ ] All pages load in < 2 seconds
- [ ] Mobile responsive on iPhone SE (375px) and up
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] 100% test coverage for critical paths

### User Experience Metrics
- [ ] User can complete onboarding without support help
- [ ] SMS → Web link flow is intuitive
- [ ] Mobile pages are easy to navigate
- [ ] Touch targets are at least 44x44px

### Business Metrics
- [ ] Onboarding completion rate > 80%
- [ ] SMS engagement rate > 50%
- [ ] Phone provisioning success rate > 95%
- [ ] Support tickets < 5% of signups

---

## LAUNCH STATUS

| Component | Status | Last Updated | Notes |
|-----------|--------|--------------|-------|
| Agent 1: Email Interface | ⏸️ Not Started | 2026-03-16 | Waiting for launch |
| Agent 2: Calls & Calendar | ⏸️ Not Started | 2026-03-16 | Waiting for launch |
| Agent 3: Phone Setup | ⏸️ Not Started | 2026-03-16 | Waiting for launch |
| Agent 4: SMS Links | ⏸️ Not Started | 2026-03-16 | Waiting for launch |
| Agent 5: Usage Dashboard | ⏸️ Not Started | 2026-03-16 | Waiting for launch |

**Update this table as agents complete their work!**

---

## AGENT COMPLETION PROTOCOL

When an agent finishes:

1. **Update Status**: Change "⏸️ Not Started" → "✅ Complete" in table above
2. **Check Deliverables**: Verify all files listed in spec were created
3. **Run Tests**: Execute test checklist from spec
4. **Document Issues**: Note any blockers or decisions made
5. **Notify**: Update this file and commit

---

## NOTES & DECISIONS

### 2026-03-16: Initial Spec Created
- Decision: Mobile-first approach over cramming data into SMS
- Decision: 5 parallel agents for faster development
- Decision: Phone provisioning is P1, blocks onboarding
- Decision: Usage dashboard is P2, can wait

### Future Enhancements (Post-Launch)
- Email reply functionality (see AGENT-6-EMAIL-REPLY-SPEC.md - TBD)
- Voice command handling via VAPI
- Calendar event creation from SMS
- Campaign approval via SMS + mobile link
- Batch operations (e.g., "call all missed calls")

---

## GETTING HELP

### If an agent gets stuck:
1. Check the spec file for debugging section
2. Search similar patterns in existing codebase
3. Check Supabase docs for query syntax
4. Test API endpoints with curl/Postman first
5. Console.log liberally
6. Ask for help in commit message if blocked

### Common Issues:
- **"Can't read property of undefined"**: Check Supabase query returned data
- **"Module not found"**: Check import path is correct
- **"Type error"**: Check TypeScript interfaces match data
- **"404 on mobile link"**: Check route file exists in correct location

---

## FINAL CHECKLIST

Before marking project as complete:

- [ ] All 5 agents have completed deliverables
- [ ] All tests passing
- [ ] TypeScript builds without errors
- [ ] Deployed to production
- [ ] Tested on real devices (iPhone, Android)
- [ ] SMS links work from real phone
- [ ] Phone provisioning works with real Stripe charge
- [ ] No critical bugs in Sentry
- [ ] Documentation updated
- [ ] Team demoed the new features
- [ ] Celebrated! 🎉

---

**Last Updated**: 2026-03-16
**Next Review**: After Agent 3 completes (phone setup)
