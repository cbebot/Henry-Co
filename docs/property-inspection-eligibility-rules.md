# Property Inspection Eligibility Rules

HenryCo Property should treat inspection as a real publication gate, not a decorative note.

## Inspection should be required when

- the submission path is `inspection_request`
- the listing is `managed_property`
- the listing is `verified_property`
- the listing is `land`
- the policy risk score is high enough to justify a site check

## Inspection should not be silently bypassed

- A listing with an open inspection in `requested` or `scheduled` state should not be published.
- Staff can waive inspection, but that should be an explicit recorded decision.
- Failed inspections should move the listing into a blocked or corrective state instead of pretending review is complete.

## Inspection lifecycle used by app truth

- `requested`
- `scheduled`
- `completed`
- `waived`
- `failed`
- `cancelled`

## Listing-state interactions

- `requested` maps the listing into `inspection_requested`
- `scheduled` maps the listing into `inspection_scheduled`
- `completed` or `waived` can return the listing to `under_review` if no stronger hold remains
- `failed` should block the listing
- `cancelled` should return it to a corrective state

## Operational notes

- Inspection notes should capture real access or site constraints.
- Outcome notes should capture what was verified, what failed, or why the workflow was waived.
- Staff surfaces should allow inspection state changes without leaving the property workspace.

## Important current limitation

- The app can track inspection state and apply listing-status consequences.
- The app does not yet include a dedicated calendar or external field-ops system.
- Scheduling truth currently lives in the property runtime layer, not an external operations product.
