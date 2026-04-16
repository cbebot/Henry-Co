# Accessibility Hardening Notes

## Confirmed fixes made in this pass

- Property search now uses explicit control IDs, label associations, search semantics, and grouped boolean filters.
- Marketplace reactive search now exposes:
  - labeled search input
  - combobox/listbox relationships
  - keyboard navigation for suggestions
  - active option state
  - dismiss behavior for `Escape`
  - mobile filter sheet dialog semantics
- Public metadata and crawler work was kept separate from faux accessibility changes.

## Problems deliberately not papered over

- No decorative `aria-*` attributes were added where the interaction model stayed broken.
- No hidden-only labels were used when a visible label was the clearer fix.
- No broad dashboard or staff-workflow UI rewrites were attempted in this pass.

## Remaining follow-up targets

- Audit jobs filter expansion for finer mobile and keyboard behavior.
- Review public image/logo handling on hub and care for stronger media performance without breaking dynamic remote assets.
- Run authenticated browser checks on actual mobile devices for tap-target comfort and focus order across public forms.
