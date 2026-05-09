# Hardcoded-string audit (Pass 18 baseline)

Files scanned: **1259**
Total user-visible hardcoded strings flagged: **8041**

These are JSX text, attribute values (placeholder/title/aria-label/alt), and object-literal copy fields that bypass the i18n system.

Note: This audit produces false positives for proper nouns, file paths, single-letter labels, and identifier-shaped strings; treat the count as an upper bound.

## By target directory

| Directory | Findings |
|---|---:|
| `apps/care` | 1697 |
| `apps/studio` | 1652 |
| `apps/marketplace` | 1148 |
| `apps/account` | 928 |
| `apps/jobs` | 791 |
| `apps/property` | 616 |
| `apps/learn` | 528 |
| `apps/logistics` | 370 |
| `packages/ui` | 311 |
