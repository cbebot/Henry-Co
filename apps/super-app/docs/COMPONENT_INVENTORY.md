# Design System Component Inventory

| Component    | Path                                   | Purpose                                                |
| ------------ | -------------------------------------- | ------------------------------------------------------ |
| `Text`       | `src/design-system/components/Text.tsx` | Typography variants with accessible color roles        |
| `Button`     | `src/design-system/components/Button.tsx` | Primary / secondary / ghost actions + loading state   |
| `TextField`  | `src/design-system/components/TextField.tsx` | Labels, hints, validation errors, multiline support |
| `Screen`     | `src/design-system/components/Screen.tsx` | Safe area + optional scroll + title region            |
| `Spinner`    | `src/design-system/components/Spinner.tsx` | Loading indicator with optional caption               |
| `EmptyState` | `src/design-system/components/EmptyState.tsx` | Zero-result messaging + optional CTA               |
| `ErrorState` | `src/design-system/components/ErrorState.tsx` | Recoverable error surface                           |
| `Card`       | `src/design-system/components/Card.tsx` | Tappable or static content container                  |

## Tokens

- `src/design-system/theme.ts` — `palette`, `spacing`, `radii`, `typography`.

## Feature Screens

| Feature        | Entry screen / component                                      |
| -------------- | ------------------------------------------------------------- |
| Hub            | `src/features/hub/HubScreen.tsx`                              |
| Directory      | `src/features/directory/DirectoryScreen.tsx`                  |
| Division grid  | `src/features/divisions/ServicesScreen.tsx`                   |
| Module detail  | `src/features/divisions/DivisionModuleScreen.tsx`             |
| Module body    | `src/features/modules/ModuleDetail.tsx`                       |
| Legal (static) | `src/features/legal/Legal*.tsx`, `ContactScreen.tsx`          |
| Account        | `src/features/account/AccountScreen.tsx`, `useAuthSession.ts` |
