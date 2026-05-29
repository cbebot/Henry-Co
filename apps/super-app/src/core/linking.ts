import * as Linking from "expo-linking";

const prefix = Linking.createURL("/");

/**
 * Expo Router linking prefixes for universal links + custom scheme.
 *
 * V3-04 (S2): the production prefixes mirror `app.json`'s
 * `associatedDomains` so a `https://<division>.henrycogroup.com/…`
 * universal link is recognised by the app. Path → in-app screen
 * remapping is handled centrally in `app/+native-intent.ts`
 * (`redirectSystemPath`), so this list only needs the origins.
 */
export const linkingPrefixes = [
  prefix,
  "henryco://",
  "https://staging.henrycogroup.com/app",
  "https://account.henrycogroup.com",
  "https://care.henrycogroup.com",
  "https://marketplace.henrycogroup.com",
  "https://property.henrycogroup.com",
  "https://jobs.henrycogroup.com",
  "https://learn.henrycogroup.com",
  "https://logistics.henrycogroup.com",
  "https://studio.henrycogroup.com",
  "https://building.henrycogroup.com",
  "https://hotel.henrycogroup.com",
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
