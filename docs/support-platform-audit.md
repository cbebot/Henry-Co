# HenryCo Support Platform Audit

**Date**: April 6, 2026
**Auditor**: Kiro AI
**Scope**: Comprehensive audit of existing support-related systems across the HenryCo monorepo

## Executive Summary

The HenryCo monorepo already contains a **comprehensive support system** implemented in the Care division app. This system includes:
- Contact forms with structured intake
- Support thread management
- Staff support dashboard with inbox/outbox
- Email integration
- Support categorization and urgency levels
- Thread assignment and status tracking

**Key Finding**: The existing support infrastructure is strong and production-ready for Care. The primary gap is the **lack of a cross-site floating support widget** and **cross-division support platform** that works across all HenryCo websites.

---

## Existing Support Systems

### 1. Care Division Support System

**Location**: `apps/care/`

**Classification**: **KEEP WITH REFINEMENT** - Strong foundation, needs cross-site expansion

#### Components Found

**Frontend Components**:
- `apps/care/components/care/ContactForm.tsx` - Premium contact form with validation
- `apps/care/app/(public)/contact/page.tsx` - Contact page with support channels
- `apps/care/app/(staff)/support/` - Staff support dashboard

**Backend Infrastructure**:
- `apps/care/lib/support/shared.ts` - Support types and utilities
- `apps/care/lib/support/data.ts` - Comprehensive support data layer
- `apps/care/app/api/care/contact/route.ts` - Contact API endpoint

**Staff Dashboard Routes**:
- `/support` - Support dashboard home
- `/support/inbox` - Incoming support threads
- `/support/outbox` - Outgoing messages
- `/support/archive` - Resolved threads
- `/support/reviews` - Review moderation
- `/support/payments` - Payment support
- `/support/expenses` - Expense support
- `/support/notifications` - Support notifications

#### Strengths

1. **Structured Data Model**:
   - Support thread statuses: new, open, pending_customer, resolved
   - Contact methods: email, phone, whatsapp, any
   - Service categories: general, garment_care, home_cleaning, office_cleaning, pickup_delivery, billing_payment, recurring_plan
   - Urgency levels: routine, priority, urgent

2. **Comprehensive Backend**:
   - Thread creation and management
   - Thread assignment to support agents
   - Status updates
   - Internal notes
   - Support replies
   - Email integration (inbound/outbound)
   - Booking context attachment
   - Review moderation integration

3. **Premium UI**:
   - Care-themed design
   - Excellent form validation
   - Loading states
   - Success/error feedback
   - Mobile responsive

4. **Staff Dashboard**:
   - Inbox for incoming threads
   - Thread detail views
   - Assignment workflow
   - Status management
   - Reply functionality

#### Gaps

1. **No Cross-Site Widget**: Support is only accessible via dedicated contact pages
2. **Division-Specific**: Only implemented for Care, not available across other divisions
3. **No Realtime**: No realtime notifications or live chat
4. **No AI Triage**: No AI-assisted first-line support
5. **No Page Context**: No automatic page visit tracking
6. **No Anonymous Chat**: Requires form submission, no instant messaging

---

### 2. Contact Pages Across Divisions

**Found in**:
- Care: `/contact` (full implementation)
- Studio: `/contact` (referenced in nav)
- Building: `/contact` (referenced in nav)
- Hotel: `/contact` (referenced in nav)

**Classification**: **KEEP WITH REFINEMENT** - Good starting points, need widget integration

**Strengths**:
- Each division has support email and phone in config
- Navigation includes contact/help links
- Consistent company-wide support approach

**Gaps**:
- No unified cross-site support experience
- Each division would need separate contact form implementation
- No shared support widget

---

### 3. Support Configuration

**Location**: `packages/config/company.ts`

**Classification**: **KEEP** - Excellent foundation

**Support Data Available**:
```typescript
{
  supportEmail: string;
  supportPhone: string;
}
```

**Per Division**:
- Hub: hello@henrycogroup.com, +2349133957084
- Care: care@henrycogroup.com
- Building: building@henrycogroup.com
- Hotel: hotel@henrycogroup.com
- Marketplace: marketplace@henrycogroup.com
- Property: property@henrycogroup.com
- Logistics: logistics@henrycogroup.com
- Studio: studio@henrycogroup.com
- Jobs: jobs@henrycogroup.com
- Learn: learn@henrycogroup.com

**Strengths**:
- Centralized support contact configuration
- Per-division support channels
- Easy to extend

---

### 4. Messaging/Notification Systems

**Found**:
- Care toast notifications: `apps/care/components/feedback/CareToaster.tsx`
- Support notifications route: `apps/care/app/(staff)/support/notifications/page.tsx`

**Classification**: **KEEP WITH REFINEMENT** - Good foundation, needs realtime

**Gaps**:
- No realtime notification system
- No WebSocket or Server-Sent Events
- No cross-tab notification sync
- No browser notifications

---

### 5. Event/Audit Systems

**Found**:
- Support event logging in `apps/care/lib/support/data.ts`
- `insertSupportEvent` function for audit trail

**Classification**: **KEEP** - Good audit trail

**Strengths**:
- Comprehensive event logging
- Support thread history
- Agent actions tracked

**Gaps**:
- No page visit tracking
- No user journey tracking
- No analytics integration

---

## Architecture Assessment

### What Exists (Strong Foundation)

1. ✅ **Support Data Model** - Comprehensive, production-ready
2. ✅ **Contact Forms** - Premium UI, good validation
3. ✅ **Staff Dashboard** - Functional inbox/outbox system
4. ✅ **Email Integration** - Inbound/outbound email handling
5. ✅ **Thread Management** - Assignment, status, notes
6. ✅ **Support Configuration** - Per-division support channels

### What's Missing (Build Required)

1. ❌ **Cross-Site Floating Widget** - No widget across public sites
2. ❌ **Realtime Notifications** - No live updates for staff
3. ❌ **AI Triage** - No AI-assisted support
4. ❌ **Page Context Tracking** - No automatic context capture
5. ❌ **Unified Support Platform** - Care-only, not cross-division
6. ❌ **Live Chat** - No instant messaging capability
7. ❌ **Anonymous Support** - Requires form submission
8. ❌ **Mobile Widget** - No mobile-optimized floating widget

---

## Recommended Architecture

### Phase 1: Shared Support Widget Foundation

**Create**: `packages/support/` - New shared package

**Components**:
- `SupportWidget` - Floating widget component
- `SupportWidgetProvider` - Context provider
- `SupportChat` - Chat interface
- `SupportForm` - Quick contact form
- `useSupportWidget` - Widget state hook

**Features**:
- Site-aware theming
- Desktop/mobile responsive
- Open/close animations
- Unread indicators
- Account-aware behavior

### Phase 2: Cross-Site Integration

**Update**: All division apps to include support widget

**Integration Points**:
- Public shell layout
- Site-specific theme configuration
- Division-specific support routing

### Phase 3: Unified Support Backend

**Create**: Shared support API layer

**Features**:
- Cross-division thread management
- Unified support inbox for staff
- Division routing logic
- Escalation workflows

### Phase 4: AI Triage Layer

**Create**: AI-assisted support intake

**Features**:
- Intent classification
- FAQ matching
- Smart escalation
- Context preservation

### Phase 5: Realtime Infrastructure

**Implement**: Realtime notification system

**Features**:
- WebSocket or SSE for live updates
- Staff notification alerts
- Unread message sync
- Typing indicators

### Phase 6: Analytics & Context

**Implement**: Support context tracking

**Features**:
- Page visit tracking
- User journey capture
- Session context
- Division/site awareness

---

## Classification Summary

### KEEP (No Changes)

1. **Support Configuration** (`packages/config/company.ts`)
   - Centralized support contact info
   - Per-division channels
   - Well-structured

2. **Support Data Model** (`apps/care/lib/support/shared.ts`)
   - Comprehensive types
   - Good categorization
   - Extensible

3. **Support Event Logging** (`apps/care/lib/support/data.ts`)
   - Audit trail
   - Thread history
   - Agent tracking

### KEEP WITH REFINEMENT

1. **Care Support System** (`apps/care/`)
   - Strong foundation
   - Needs cross-site expansion
   - Needs realtime capabilities
   - Needs AI triage

2. **Contact Pages** (Various apps)
   - Good starting points
   - Need widget integration
   - Need unified experience

3. **Staff Dashboard** (`apps/care/app/(staff)/support/`)
   - Functional inbox
   - Needs realtime updates
   - Needs cross-division view

### REPLACE

None - existing systems are strong

### REMOVE

None - no dead support code found

### DEFER

1. **Advanced AI Integration** - Full conversational AI
2. **Video/Voice Support** - Beyond scope of initial build
3. **Multi-Language Support** - Defer to i18n system
4. **Mobile App Integration** - Separate mobile initiative

---

## Implementation Priority

### High Priority (Build Now)

1. **Cross-Site Floating Widget** - Essential for unified experience
2. **Shared Support Package** - Foundation for all divisions
3. **Widget Theme System** - Site-aware design variations
4. **Basic AI Triage** - Intent classification and FAQ matching
5. **Escalation Logic** - Clean handoff to human support

### Medium Priority (Build Soon)

1. **Realtime Notifications** - Staff dashboard live updates
2. **Unified Support Inbox** - Cross-division staff view
3. **Page Context Tracking** - User journey awareness
4. **Mobile Widget Optimization** - Touch-friendly interface

### Low Priority (Future Enhancement)

1. **Advanced AI Conversations** - Full conversational capability
2. **Video/Voice Support** - Rich media support
3. **Chatbot Personality** - Brand-aligned AI persona
4. **Predictive Support** - Proactive issue detection

---

## Technical Recommendations

### Widget Architecture

**Technology Stack**:
- React (client component)
- Framer Motion (animations)
- Zustand or Context (state management)
- TailwindCSS (styling)
- Lucide React (icons)

**Design Principles**:
- Unobtrusive floating button
- Smooth open/close animations
- Mobile-first responsive
- Keyboard accessible
- Screen reader friendly

### Backend Architecture

**API Structure**:
```
/api/support/
  /threads - List threads
  /threads/[id] - Thread details
  /threads/[id]/messages - Thread messages
  /threads/[id]/reply - Send reply
  /threads/create - Create thread
  /ai/classify - AI intent classification
  /ai/suggest - AI FAQ suggestions
```

**Database Schema** (extend existing):
```sql
-- Already exists in Care
support_threads
support_messages
support_agents

-- New tables needed
support_widget_sessions
support_page_visits
support_ai_interactions
```

### Realtime Architecture

**Options**:
1. **Server-Sent Events (SSE)** - Simple, one-way
2. **WebSockets** - Full duplex, more complex
3. **Polling** - Fallback, less efficient

**Recommendation**: Start with SSE for staff notifications, add WebSockets if needed for live chat

---

## Success Metrics

### Widget Adoption
- Widget open rate per site
- Conversation start rate
- Completion rate

### Support Efficiency
- First response time
- Resolution time
- Escalation rate
- AI deflection rate

### User Satisfaction
- Support satisfaction score
- Widget usability rating
- Response quality rating

---

## Conclusion

The HenryCo monorepo has a **strong support foundation** in the Care division that can be extended into a **premium cross-site support platform**. The primary work required is:

1. **Building the floating support widget** as a shared package
2. **Integrating the widget** across all public websites
3. **Implementing AI triage** for first-line support
4. **Adding realtime capabilities** for staff notifications
5. **Extending the support backend** for cross-division management

The existing Care support system provides an excellent blueprint and can be refactored into shared packages that all divisions can use.

**Status**: Ready to proceed with implementation
