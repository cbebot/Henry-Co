# HenryCo Language Priority Map
## Language support levels
### Level A: production content priority
- `en` (English) — source and full baseline
- `fr` (French) — highest-priority target language

### Level B: scaffolded for future completion
- `ar` (Arabic)
- `es` (Spanish)
- `pt` (Portuguese)
- `ig` (Igbo)
- `yo` (Yoruba)
- `ha` (Hausa)

Level B locales may have selective copy coverage (for example consent surfaces) and otherwise must fall back to English.

## Must-localize-now surfaces
- primary navigation and public-shell controls
- auth/account critical actions and errors
- trust/KYC-critical text
- pricing/checkout-critical comprehension text
- dashboard essentials and top-level status copy
- support/help essentials
- key loading/empty/error states

## Translation sequencing
1. keep English source canonical and stable
2. ship reviewed French for priority surfaces
3. expand French across remaining critical dashboards and system messages
4. only then graduate other locales from scaffolded to translated

## Quality rule
Never ship mixed critical journeys where headings are translated but key body actions or warnings are not.
