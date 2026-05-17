# I18N Locale Coverage Audit

Generated: 2026-05-17T11:02:20.605Z

Definitions:
- **Leaves**: total translatable string slots in the English baseline for the module.
- **Intentional echo**: leaf whose value matches EN by design (brand names, division names, near-universal cognates, static example data, acronyms). Tracked in `scripts/i18n-intentional-echos.mjs`.
- **Actionable echo**: leaf that fell through to the EN fallback unintentionally — a real gap.
- **Missing**: leaf absent in this locale (deepMerge serves EN, but the slot has no localized value).
- **Localised %**: 100% − ((Actionable echo + Missing) / Leaves).

**Total actionable gaps across all modules and locales: 1286**

## `surface`

Total EN leaves: **148**

| Locale | Intentional echo | Actionable echo | Missing | Localised % |
|---|---:|---:|---:|---:|
| fr | 10 | 0 | 0 | 100.0% |
| es | 4 | 0 | 0 | 100.0% |
| pt | 7 | 0 | 0 | 100.0% |
| ar | 2 | 0 | 0 | 100.0% |
| de | 10 | 0 | 0 | 100.0% |
| it | 8 | 0 | 0 | 100.0% |
| zh | 4 | 0 | 0 | 100.0% |
| hi | 4 | 0 | 0 | 100.0% |
| ig | 5 | 0 | 0 | 100.0% |
| yo | 4 | 0 | 0 | 100.0% |
| ha | 5 | 0 | 0 | 100.0% |

## `account`

Total EN leaves: **1545**

| Locale | Intentional echo | Actionable echo | Missing | Localised % |
|---|---:|---:|---:|---:|
| fr | 63 | 0 | 0 | 100.0% |
| es | 39 | 0 | 0 | 100.0% |
| pt | 39 | 0 | 0 | 100.0% |
| ar | 31 | 0 | 0 | 100.0% |
| de | 60 | 83 | 0 | 94.6% |
| it | 44 | 83 | 0 | 94.6% |
| zh | 34 | 83 | 0 | 94.6% |
| hi | 33 | 83 | 0 | 94.6% |
| ig | 36 | 83 | 0 | 94.6% |
| yo | 35 | 83 | 0 | 94.6% |
| ha | 35 | 83 | 0 | 94.6% |

## `hubHome`

Total EN leaves: **158**

| Locale | Intentional echo | Actionable echo | Missing | Localised % |
|---|---:|---:|---:|---:|
| fr | 6 | 1 | 0 | 99.4% |
| es | 4 | 0 | 0 | 100.0% |
| pt | 5 | 0 | 0 | 100.0% |
| ar | 1 | 1 | 0 | 99.4% |
| de | 7 | 0 | 0 | 100.0% |
| it | 3 | 9 | 0 | 94.3% |
| zh | 0 | 0 | 0 | 100.0% |
| hi | 0 | 0 | 0 | 100.0% |
| ig | 2 | 0 | 0 | 100.0% |
| yo | 2 | 0 | 0 | 100.0% |
| ha | 2 | 0 | 0 | 100.0% |

## `marketplace`

Total EN leaves: **45**

| Locale | Intentional echo | Actionable echo | Missing | Localised % |
|---|---:|---:|---:|---:|
| fr | 1 | 0 | 0 | 100.0% |
| es | 2 | 0 | 0 | 100.0% |
| pt | 2 | 0 | 0 | 100.0% |
| ar | 0 | 0 | 0 | 100.0% |
| de | 0 | 0 | 0 | 100.0% |
| it | 0 | 0 | 0 | 100.0% |
| zh | 0 | 0 | 0 | 100.0% |
| hi | 0 | 0 | 0 | 100.0% |
| ig | 1 | 0 | 0 | 100.0% |
| yo | 0 | 0 | 0 | 100.0% |
| ha | 0 | 0 | 0 | 100.0% |

## `jobs`

Total EN leaves: **496**

| Locale | Intentional echo | Actionable echo | Missing | Localised % |
|---|---:|---:|---:|---:|
| fr | 0 | 54 | 0 | 89.1% |
| es | 0 | 50 | 0 | 89.9% |
| pt | 0 | 50 | 0 | 89.9% |
| ar | 0 | 45 | 0 | 90.9% |
| de | 2 | 74 | 0 | 85.1% |
| it | 1 | 76 | 0 | 84.7% |
| zh | 0 | 68 | 0 | 86.3% |
| hi | 0 | 67 | 0 | 86.5% |
| ig | 0 | 48 | 0 | 90.3% |
| yo | 0 | 69 | 0 | 86.1% |
| ha | 0 | 69 | 0 | 86.1% |

## `care`

Total EN leaves: **181**

| Locale | Intentional echo | Actionable echo | Missing | Localised % |
|---|---:|---:|---:|---:|
| fr | 0 | 4 | 0 | 97.8% |
| es | 0 | 2 | 0 | 98.9% |
| pt | 0 | 2 | 0 | 98.9% |
| ar | 0 | 2 | 0 | 98.9% |
| de | 0 | 2 | 0 | 98.9% |
| it | 0 | 2 | 0 | 98.9% |
| zh | 0 | 2 | 0 | 98.9% |
| hi | 0 | 2 | 0 | 98.9% |
| ig | 0 | 2 | 0 | 98.9% |
| yo | 0 | 2 | 0 | 98.9% |
| ha | 0 | 2 | 0 | 98.9% |

## `auth`

Total EN leaves: **29**

| Locale | Intentional echo | Actionable echo | Missing | Localised % |
|---|---:|---:|---:|---:|
| fr | 0 | 0 | 0 | 100.0% |
| es | 0 | 0 | 0 | 100.0% |
| pt | 0 | 0 | 0 | 100.0% |
| ar | 0 | 0 | 0 | 100.0% |
| de | 0 | 0 | 0 | 100.0% |
| it | 2 | 0 | 0 | 100.0% |
| zh | 0 | 0 | 0 | 100.0% |
| hi | 0 | 0 | 0 | 100.0% |
| ig | 0 | 0 | 0 | 100.0% |
| yo | 0 | 0 | 0 | 100.0% |
| ha | 0 | 0 | 0 | 100.0% |

## `consent`

Total EN leaves: **28**

| Locale | Intentional echo | Actionable echo | Missing | Localised % |
|---|---:|---:|---:|---:|
| fr | 1 | 0 | 0 | 100.0% |
| es | 1 | 0 | 0 | 100.0% |
| pt | 1 | 0 | 0 | 100.0% |
| ar | 0 | 0 | 0 | 100.0% |
| de | 1 | 0 | 0 | 100.0% |
| it | 2 | 0 | 0 | 100.0% |
| zh | 0 | 0 | 0 | 100.0% |
| hi | 0 | 0 | 0 | 100.0% |
| ig | 0 | 0 | 0 | 100.0% |
| yo | 0 | 0 | 0 | 100.0% |
| ha | 0 | 0 | 0 | 100.0% |

## `state`

Total EN leaves: **18**

| Locale | Intentional echo | Actionable echo | Missing | Localised % |
|---|---:|---:|---:|---:|
| fr | 0 | 0 | 0 | 100.0% |
| es | 0 | 0 | 0 | 100.0% |
| pt | 0 | 0 | 0 | 100.0% |
| ar | 0 | 0 | 0 | 100.0% |
| de | 0 | 0 | 0 | 100.0% |
| it | 0 | 0 | 0 | 100.0% |
| zh | 0 | 0 | 0 | 100.0% |
| hi | 0 | 0 | 0 | 100.0% |
| ig | 0 | 0 | 0 | 100.0% |
| yo | 0 | 0 | 0 | 100.0% |
| ha | 0 | 0 | 0 | 100.0% |

