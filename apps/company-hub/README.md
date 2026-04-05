# Henry & Co. Hub (mobile)

Native **Expo (SDK 54)** app: company hub experience with **Expo Router** tabs, **NativeWind** (Tailwind), **React Native Paper** (MD3, gold `#C9A227`), and **expo-web-browser** for division sites.

## Run

From repo root:

```bash
pnpm company-hub:start
```

Or from this directory:

```bash
pnpm start
```

## Structure

- `app/(tabs)/` — **Home** | **Discover** | **More** (stack: About, Contact, Privacy, Terms)
- `src/data/divisions.json` — eight divisions (source of truth)
- `HubSearchProvider` — global search across Home + Discover
- `DivisionModalProvider` — bottom-sheet style modal + **Visit Division**

Replace placeholder PNGs under `assets/images/` with production icon and splash art.
