# Property Listing Governance

This document describes the current HenryCo Property governance model implemented in app code.

## Submission intake

- Public submissions are accepted only from signed-in HenryCo accounts.
- The form adapts by service type and intent.
- The API validates:
  - service-specific context fields
  - required upload categories
  - essential listing metadata
  - accepted media and document file types
  - file-size limits

## Evidence categories

- ownership proof
- authority proof
- management authorization
- identity evidence
- inspection evidence
- supporting documents

These categories are persisted into the property application record and mirrored into shared customer documents with property-specific metadata.

## Current governance decision rails

1. `awaiting_documents`
   - required evidence is still missing

2. `awaiting_eligibility`
   - shared account verification or duplicate-contact review is still unresolved

3. `inspection_requested` / `inspection_scheduled`
   - inspection-sensitive publication gate is still active

4. `under_review`
   - trust gates are sufficiently resolved for editorial review

5. `approved` / `published`
   - only after staff decision

6. `blocked` / `rejected` / `escalated`
   - used when publication would be unsafe or not yet defensible

## Staff controls now exposed in repo truth

- inspection update workflow
- listing governance decisions
- duplicate-contact review visibility
- submission-context visibility
- document-category visibility
- managed-portfolio operations page

## Publication safety rules now enforced in app logic

- open inspections should block publish and approve decisions
- correction, escalation, rejection, or block decisions require staff notes
- listings still in document or eligibility hold should not skip straight to publish

## What still needs a later pass

- richer staff-side document preview for `storage://` files
- deeper moderation analytics and audit export
- stronger assignment controls for inspection ownership and case routing
