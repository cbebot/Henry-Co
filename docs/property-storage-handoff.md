# Property Storage Handoff

HenryCo Property currently persists its runtime workflow in Supabase Storage-backed JSON collections plus file buckets.

## Current repo truth

- Listing runtime records are written into the `property-runtime` bucket as JSON documents.
- Public listing media is written into the `property-media` bucket.
- Trust and inspection files are written into the `property-documents` bucket and referenced with `storage://...` URLs.
- Application records now carry:
  - categorized verification documents
  - submission context fields
  - review note and state

## Why this matters

- The app now enforces a more serious trust and inspection workflow.
- Staff can see document categories, inspection state, and submission context.
- That governance is operationally meaningful in the app layer, but the long-term source of truth should not remain storage-backed JSON forever.

## Backend handoff needed after this pass

1. Move runtime JSON collections into durable SQL tables.
   - listings
   - listing_applications
   - listing_inspections
   - listing_policy_events
   - viewing_requests
   - managed_records

2. Keep storage for files, but persist normalized metadata in SQL.
   - document kind
   - upload field
   - uploader
   - listing reference
   - inspection reference where applicable

3. Mirror app-side status rails in schema truth.
   - awaiting_documents
   - awaiting_eligibility
   - inspection_requested
   - inspection_scheduled
   - under_review
   - blocked
   - escalated

4. Add staff-safe retrieval for document previews.
   - current staff UI can describe evidence categories
   - a later backend pass should add signed URL generation or a secure preview proxy for `storage://` records

## Current limitation to carry forward explicitly

- This pass makes the app logic stricter and more coherent.
- It does not complete the SQL migration of the property workflow.
- Claude live deployment or backend follow-up should treat this as an app-layer governance improvement with an explicit storage-to-schema handoff still pending.
