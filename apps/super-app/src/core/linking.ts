import * as Linking from "expo-linking";

const prefix = Linking.createURL("/");

/**
 * Expo Router linking prefixes for universal links + custom scheme.
 *
 * V3-04 (S2): the production prefixes mirror `app.json`'s
 * `associatedDomains` so a `https://<division>.henryonyx.com/…`
 * universal link is recognised by the app. Path → in-app screen
 * remapping is handled centrally in `app/+native-intent.ts`
 * (`redirectSystemPath`), so this list only needs the origins.
 */
export const linkingPrefixes = [
  prefix,
  "henryco://",
  "https://staging.henryonyx.com/app",
  "https://account.henryonyx.com",
  "https://care.henryonyx.com",
  "https://marketplace.henryonyx.com",
  "https://property.henryonyx.com",
  "https://jobs.henryonyx.com",
  "https://learn.henryonyx.com",
  "https://logistics.henryonyx.com",
  "https://studio.henryonyx.com",
  "https://building.henryonyx.com",
  "https://hotel.henryonyx.com",
];

export const linkingConfig = {
  prefixes: linkingPrefixes,
  config: {
    screens: {
      "(tabs)": {
        screens: {
          index: "hub",
          directory: "directory",
          divisions: "divisions",
          account: "account",
        },
      },
      legal: {
        path: "legal",
        screens: {
          about: "about",
          contact: "contact",
          privacy: "privacy",
          terms: "terms",
          faq: "faq",
        },
      },
      module: {
        path: "module",
        screens: {
          "[slug]": ":slug",
        },
      },
    },
  },
};
