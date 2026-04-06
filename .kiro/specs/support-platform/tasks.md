# Implementation Plan: HenryCo Support Platform

## Overview

This implementation plan builds a premium cross-site customer support platform by creating a shared support package (`packages/support/`) that extends the existing Care support system. The platform provides a floating support widget accessible across all HenryCo websites, AI-assisted triage, realtime staff notifications, and comprehensive page context tracking.

The implementation leverages the existing Care support infrastructure (data models, staff dashboard, email integration) while adding cross-division capabilities, AI triage, realtime notifications, and a unified widget experience.

## Tasks

- [ ] 1. Create shared support package foundation
  - Create `packages/support/` directory structure
  - Set up package.json with dependencies (React, TypeScript, Framer Motion, TailwindCSS, Zustand, Lucide React)
  - Configure TypeScript with strict mode
  - Set up build configuration for package distribution
  - Create index.ts with package exports
  - _Requirements: 1.1, 1.12, 2.8_

- [ ] 2. Implement core TypeScript types and interfaces
  - [ ] 2.1 Create support types in `packages/support/types/index.ts`
    - Define DivisionKey type for all HenryCo divisions
    - Define WidgetSession interface for session tracking
    - Define AIInteraction interface for AI triage tracking
    - Define PageContext and PageVisit interfaces for context tracking
    - Define Message interface for chat messages
    - Define FAQ interface for knowledge base
    - Define SupportThread and related types
    - _Requirements: 1.1, 3.1, 7.1-7.8_

- [ ] 3. Build widget UI components
  - [ ] 3.1 Create SupportButton component
    - Implement floating button with division-specific theming
    - Add unread indicator badge
    - Add smooth hover and active states
    - Implement keyboard accessibility (Enter/Space to activate)
    - Add ARIA labels for screen readers
    - _Requirements: 1.1, 1.2, 1.6, 2.1, 11.1-11.3_

  - [ ] 3.2 Create SupportPanel component
    - Implement expandable chat panel with animations
    - Add responsive sizing (desktop vs mobile)
    - Implement proper z-index layering
    - Add close button with keyboard support
    - Handle click-outside-to-close behavior
    - Add focus trap when panel is open
    - _Requirements: 1.4, 1.5, 1.10, 10.1-10.3, 11.3_

  - [ ] 3.3 Create SupportHeader component
    - Display division name and branding
    - Add minimize and close buttons
    - Show connection status indicator
    - Implement theme-aware styling
    - _Requirements: 2.1, 2.7, 9.1, 9.11_

  - [ ] 3.4 Create SupportMessage component
    - Implement message bubble with role-based styling (user/assistant/system)
    - Add timestamp display
    - Support markdown rendering for AI responses
    - Add loading skeleton for pending messages
    - _Requirements: 3.2, 9.2, 9.5_

  - [ ] 3.5 Create SupportChat component
    - Implement scrollable message list with auto-scroll
    - Add message input with character limit
    - Add send button with loading state
    - Implement typing indicator
    - Add "Talk to a human" escalation button
    - Handle Enter to send, Shift+Enter for new line
    - _Requirements: 3.1-3.7, 4.1, 9.3, 10.4_

  - [ ] 3.6 Create SupportForm component
    - Build escalation form with name, email, phone fields
    - Add contact method preference selector
    - Add service category dropdown
    - Add urgency level selector
    - Implement form validation with error messages
    - Add submit button with loading state
    - Display thread reference number on success
    - _Requirements: 4.2-4.11, 9.4, 13.5_

  - [ ]* 3.7 Write unit tests for widget components
    - Test SupportButton rendering and interactions
    - Test SupportPanel open/close behavior
    - Test SupportChat message display and input
    - Test SupportForm validation and submission
    - Test keyboard navigation across components
    - Test ARIA labels and accessibility
    - _Requirements: 11.1-11.12_

- [ ] 4. Implement widget state management
  - [ ] 4.1 Create useSupportWidget hook
    - Implement widget open/closed state
    - Implement conversation mode state (ai/escalation/success)
    - Persist state to localStorage
    - Handle state restoration on page load
    - Implement unread message counter
    - _Requirements: 1.12, 8.2, 8.6_

  - [ ] 4.2 Create useSupportChat hook
    - Implement message list state
    - Implement send message function
    - Handle AI response streaming
    - Implement conversation history management
    - Handle error states and retries
    - _Requirements: 3.8, 8.1, 8.12, 13.3-13.4_

  - [ ] 4.3 Create useSupportContext hook
    - Capture current page URL and title
    - Capture referrer and user agent
    - Track page visit history (last 10 pages)
    - Generate or retrieve session ID
    - Capture authenticated user info if available
    - _Requirements: 7.1-7.8, 7.11_

  - [ ]* 4.4 Write unit tests for state management hooks
    - Test widget state persistence
    - Test chat message handling
    - Test context capture accuracy
    - Test error recovery logic
    - _Requirements: 13.1-13.12_

- [ ] 5. Build theme system for cross-division support
  - [ ] 5.1 Create support-theme.ts utility
    - Extract division colors from company config
    - Generate theme variants for each division
    - Implement light/dark theme support
    - Create CSS variable injection function
    - Add theme preview utility for testing
    - _Requirements: 2.1-2.10_

  - [ ] 5.2 Integrate theme system into components
    - Apply division theme to SupportButton
    - Apply division theme to SupportPanel
    - Apply division theme to SupportHeader
    - Ensure consistent theming across all components
    - Test theme switching
    - _Requirements: 2.1, 2.3, 2.8, 9.11_

- [ ] 6. Implement API client for support operations
  - [ ] 6.1 Create support-client.ts
    - Implement createThread function
    - Implement getThread function
    - Implement addMessage function
    - Implement classifyIntent function (AI triage)
    - Implement suggestFAQs function
    - Add request/response type definitions
    - Implement error handling with retries
    - Add request timeout handling
    - _Requirements: 3.2, 4.5, 13.3-13.4, 13.9_

  - [ ]* 6.2 Write integration tests for API client
    - Test thread creation with mock API
    - Test error handling and retries
    - Test timeout behavior
    - Test request validation
    - _Requirements: 13.1-13.12_

- [ ] 7. Create main SupportWidget orchestrator component
  - [ ] 7.1 Implement SupportWidget component
    - Compose all sub-components (button, panel, chat, form)
    - Implement state machine for widget modes
    - Handle division prop and theme application
    - Implement position and offset props
    - Add event callbacks (onOpen, onClose, onEscalate)
    - Handle async loading and code splitting
    - _Requirements: 1.1-1.12, 2.1-2.10, 12.1-12.5_

  - [ ] 7.2 Create SupportWidgetProvider context
    - Wrap widget with context provider
    - Share state across widget components
    - Provide API client to components
    - Provide theme configuration
    - _Requirements: 1.1, 2.1_

  - [ ]* 7.3 Write end-to-end tests for complete widget flow
    - Test widget open/close cycle
    - Test AI conversation flow
    - Test escalation flow
    - Test theme application
    - Test mobile responsiveness
    - _Requirements: 1.1-1.12, 9.1-9.12, 10.1-10.12_

- [ ] 8. Checkpoint - Verify widget package builds and renders
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Extend Care backend for cross-division support
  - [ ] 9.1 Create database migration for new tables
    - Create support_widget_sessions table with indexes
    - Create support_ai_interactions table with indexes
    - Create support_page_visits table with indexes
    - Add division column to care_security_logs
    - Add new event types for cross-division support
    - _Requirements: 7.1-7.12, 15.1-15.12_

  - [ ] 9.2 Create support API routes in Care backend
    - Create POST /api/support/threads endpoint
    - Create GET /api/support/threads/:threadRef endpoint
    - Create POST /api/support/threads/:threadRef/messages endpoint
    - Implement request validation and sanitization
    - Implement rate limiting
    - Add CSRF protection
    - _Requirements: 4.5-4.11, 14.2-14.6_

  - [ ] 9.3 Implement AI triage endpoints
    - Create POST /api/support/ai/classify endpoint
    - Create POST /api/support/ai/suggest endpoint
    - Integrate OpenAI API for intent classification
    - Implement FAQ semantic search
    - Add confidence scoring logic
    - Implement escalation decision logic
    - Track AI interactions in database
    - _Requirements: 3.2-3.12, 15.3-15.4_

  - [ ] 9.4 Create support data layer functions
    - Implement createWidgetSession function
    - Implement trackPageVisit function
    - Implement trackAIInteraction function
    - Implement createSupportThread function (extend existing)
    - Implement getSupportThread function
    - Implement addThreadMessage function
    - Add division-aware routing logic
    - _Requirements: 4.5, 7.1-7.12, 8.1-8.12_

  - [ ]* 9.5 Write API integration tests
    - Test thread creation endpoint
    - Test AI classification endpoint
    - Test FAQ suggestion endpoint
    - Test rate limiting
    - Test input validation
    - Test error responses
    - _Requirements: 13.1-13.12, 14.1-14.12_

- [ ] 10. Implement realtime notification system
  - [ ] 10.1 Set up Supabase Realtime subscriptions
    - Configure Realtime on care_security_logs table
    - Create notification event types
    - Implement event broadcasting function
    - _Requirements: 6.1-6.4, 6.11_

  - [ ] 10.2 Create useSupportRealtime hook
    - Subscribe to support notification events
    - Filter events by user permissions
    - Handle connection/disconnection
    - Implement reconnection logic
    - Parse and format notification data
    - _Requirements: 6.1-6.4, 6.11-6.12_

  - [ ] 10.3 Build notification delivery system
    - Implement in-app notification display
    - Add browser notification support with permission request
    - Add notification sound with user preference
    - Implement notification badge counter
    - Add cross-tab synchronization using BroadcastChannel
    - Implement mark-as-read functionality
    - _Requirements: 6.1-6.12_

  - [ ]* 10.4 Write realtime system tests
    - Test event subscription and delivery
    - Test reconnection logic
    - Test cross-tab synchronization
    - Test notification preferences
    - _Requirements: 6.1-6.12_

- [ ] 11. Extend Care staff dashboard for cross-division support
  - [ ] 11.1 Update support inbox to show division source
    - Add division badge to thread list items
    - Add division filter dropdown
    - Update thread queries to include division
    - Add division-specific routing indicators
    - _Requirements: 5.4, 5.6, 5.15_

  - [ ] 11.2 Add page context display to thread detail view
    - Create PageContextPanel component
    - Display page URL, title, referrer
    - Display user journey (page visit history)
    - Display user session details
    - Display device and browser info
    - _Requirements: 5.5, 7.11_

  - [ ] 11.3 Add AI interaction history to thread view
    - Display AI conversation before escalation
    - Show AI intent classification
    - Show suggested FAQs that were presented
    - Show escalation reason
    - _Requirements: 3.12, 5.12_

  - [ ] 11.4 Integrate realtime notifications into dashboard
    - Add notification bell icon with badge
    - Display notification list dropdown
    - Play sound on new notifications
    - Update thread list in realtime
    - Add notification preferences panel
    - _Requirements: 6.1-6.12_

  - [ ]* 11.5 Write dashboard integration tests
    - Test division filtering
    - Test page context display
    - Test realtime updates
    - Test notification delivery
    - _Requirements: 5.1-5.15, 6.1-6.12_

- [ ] 12. Integrate widget into Care public site
  - [ ] 12.1 Add support package to Care dependencies
    - Install @henryco/support package
    - Configure package imports
    - _Requirements: 1.1_

  - [ ] 12.2 Integrate SupportWidget into Care layout
    - Import SupportWidget in public shell layout
    - Pass division="care" prop
    - Configure theme and position
    - Test widget rendering on Care pages
    - _Requirements: 1.1-1.12, 2.1-2.10_

  - [ ] 12.3 Test widget on Care site
    - Test widget open/close
    - Test AI conversation
    - Test escalation flow
    - Test mobile experience
    - Test accessibility
    - _Requirements: 1.1-1.12, 10.1-10.12, 11.1-11.12_

- [ ] 13. Integrate widget into Marketplace site
  - [ ] 13.1 Add support package to Marketplace dependencies
    - Install @henryco/support package
    - Configure package imports
    - _Requirements: 1.1_

  - [ ] 13.2 Integrate SupportWidget into Marketplace layout
    - Import SupportWidget in public shell layout
    - Pass division="marketplace" prop
    - Configure Marketplace theme
    - Test widget rendering on Marketplace pages
    - _Requirements: 1.1-1.12, 2.1-2.10_

  - [ ] 13.3 Handle Marketplace widget deprecation
    - Remove old Marketplace support widget code
    - Update any references to old widget
    - Migrate any Marketplace-specific support logic
    - Test that new widget fully replaces old functionality
    - _Requirements: 1.1, 2.6_

  - [ ]* 13.4 Test widget on Marketplace site
    - Test widget with Marketplace theme
    - Test division-specific routing
    - Test mobile experience
    - Test accessibility
    - _Requirements: 1.1-1.12, 2.1-2.10, 10.1-10.12, 11.1-11.12_

- [ ] 14. Integrate widget into Studio site
  - [ ] 14.1 Add support package and integrate into Studio layout
    - Install @henryco/support package
    - Import SupportWidget with division="studio"
    - Configure Studio theme
    - _Requirements: 1.1-1.12, 2.1-2.10_

  - [ ]* 14.2 Test widget on Studio site
    - Test widget functionality and theming
    - Test mobile and accessibility
    - _Requirements: 1.1-1.12, 10.1-10.12, 11.1-11.12_

- [ ] 15. Integrate widget into remaining division sites
  - [ ] 15.1 Integrate into Building site
    - Add support package and widget with division="building"
    - _Requirements: 1.1-1.12, 2.1-2.10_

  - [ ] 15.2 Integrate into Hotel site
    - Add support package and widget with division="hotel"
    - _Requirements: 1.1-1.12, 2.1-2.10_

  - [ ] 15.3 Integrate into Property site
    - Add support package and widget with division="property"
    - _Requirements: 1.1-1.12, 2.1-2.10_

  - [ ] 15.4 Integrate into Logistics site
    - Add support package and widget with division="logistics"
    - _Requirements: 1.1-1.12, 2.1-2.10_

  - [ ] 15.5 Integrate into Jobs site
    - Add support package and widget with division="jobs"
    - _Requirements: 1.1-1.12, 2.1-2.10_

  - [ ] 15.6 Integrate into Learn site
    - Add support package and widget with division="learn"
    - _Requirements: 1.1-1.12, 2.1-2.10_

  - [ ]* 15.7 Test widget across all division sites
    - Verify theme consistency
    - Verify division-specific routing
    - Test cross-site experience
    - _Requirements: 1.1-1.12, 2.1-2.10_

- [ ] 16. Checkpoint - Verify cross-site widget integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Implement analytics and reporting
  - [ ] 17.1 Create analytics tracking functions
    - Track widget open events
    - Track conversation start events
    - Track AI deflection events
    - Track escalation events
    - Track response time metrics
    - Track resolution time metrics
    - _Requirements: 15.1-15.12_

  - [ ] 17.2 Create analytics dashboard views
    - Build support metrics overview page
    - Add widget usage charts
    - Add AI performance charts
    - Add division breakdown charts
    - Add time-series trend charts
    - Add export functionality
    - _Requirements: 15.11-15.12_

  - [ ]* 17.3 Write analytics tests
    - Test event tracking accuracy
    - Test metric calculations
    - Test dashboard rendering
    - _Requirements: 15.1-15.12_

- [ ] 18. Implement error handling and fallbacks
  - [ ] 18.1 Add comprehensive error boundaries
    - Wrap widget in error boundary
    - Add fallback UI for widget crashes
    - Display alternative contact methods on critical errors
    - Log errors to monitoring service
    - _Requirements: 13.1-13.12_

  - [ ] 18.2 Implement network error handling
    - Add retry logic with exponential backoff
    - Add offline detection
    - Queue messages when offline
    - Show connection status to user
    - _Requirements: 13.3, 13.9-13.11_

  - [ ] 18.3 Add user-facing error messages
    - Create error message dictionary
    - Implement contextual error display
    - Add actionable recovery steps
    - Provide fallback contact methods
    - _Requirements: 13.1-13.2, 13.8_

  - [ ]* 18.4 Write error handling tests
    - Test error boundary behavior
    - Test retry logic
    - Test offline queue
    - Test error message display
    - _Requirements: 13.1-13.12_

- [ ] 19. Performance optimization
  - [ ] 19.1 Implement code splitting
    - Lazy load SupportPanel component
    - Lazy load SupportForm component
    - Lazy load AI classification logic
    - Split vendor bundles
    - _Requirements: 12.5, 12.11_

  - [ ] 19.2 Optimize bundle size
    - Tree-shake unused dependencies
    - Minimize CSS bundle
    - Optimize icon imports
    - Use production builds
    - _Requirements: 12.4, 12.11_

  - [ ] 19.3 Implement asset optimization
    - Lazy load images and icons
    - Use SVG sprites for icons
    - Implement resource hints (preconnect, prefetch)
    - Cache static assets
    - _Requirements: 12.6-12.8_

  - [ ] 19.4 Add performance monitoring
    - Track widget load time
    - Track first interaction time
    - Monitor bundle size
    - Track Core Web Vitals impact
    - _Requirements: 12.1-12.12_

  - [ ]* 19.5 Write performance tests
    - Test load time under 1 second
    - Test no layout shifts (CLS = 0)
    - Test bundle size under 50KB gzipped
    - Test minimal main thread blocking
    - _Requirements: 12.1-12.12_

- [ ] 20. Security hardening
  - [ ] 20.1 Implement input validation and sanitization
    - Validate all form inputs
    - Sanitize user messages before storage
    - Prevent XSS in message rendering
    - Validate API request payloads
    - _Requirements: 14.2-14.4_

  - [ ] 20.2 Add rate limiting and abuse prevention
    - Implement rate limiting on API endpoints
    - Add CAPTCHA for suspicious activity
    - Implement session-based throttling
    - Add IP-based rate limiting
    - _Requirements: 14.6_

  - [ ] 20.3 Implement security headers and CSRF protection
    - Add CSRF tokens to API requests
    - Configure security headers
    - Implement content security policy
    - Add request origin validation
    - _Requirements: 14.1, 14.5_

  - [ ]* 20.4 Write security tests
    - Test XSS prevention
    - Test CSRF protection
    - Test rate limiting
    - Test input validation
    - _Requirements: 14.1-14.12_

- [ ] 21. Final checkpoint and documentation
  - [ ] 21.1 Create widget integration guide
    - Document installation steps
    - Document configuration options
    - Provide code examples
    - Document theming customization
    - _Requirements: 1.1-1.12, 2.1-2.10_

  - [ ] 21.2 Create staff dashboard user guide
    - Document dashboard features
    - Document notification settings
    - Document thread management workflow
    - Provide troubleshooting tips
    - _Requirements: 5.1-5.15, 6.1-6.12_

  - [ ] 21.3 Final integration testing
    - Test complete customer journey across all divisions
    - Test staff notification and response workflow
    - Test AI triage accuracy
    - Test mobile experience across devices
    - Test accessibility compliance
    - Test performance metrics
    - _Requirements: All requirements_

  - [ ] 21.4 Final checkpoint - Ensure all tests pass
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- The implementation builds on the existing Care support system rather than replacing it
- Checkpoints ensure incremental validation at key milestones
- Widget integration follows a phased rollout: Care → Marketplace → Studio → Other divisions
- The Marketplace widget deprecation is handled explicitly in task 13.3
- AI triage and realtime notifications are core features, not optional
- All division sites will have consistent widget experience with division-specific theming
- Performance and security are prioritized throughout implementation
- Testing tasks are marked optional but highly recommended for production quality

