import * as Linking from "expo-linking";

import { henryAppDomain } from "./domain";

const prefix = Linking.createURL("/");

/**
 * Expo Router linking prefixes for universal links + custom scheme (staging).
 * PROD-READY-01: the staging Universal-Link host is derived from
 * `EXPO_PUBLIC_BASE_DOMAIN`; the default keeps `staging.henrycogroup.com/app`.
 */
export const linkingPrefixes = [
  prefix,
  "henryco://",
  `https://staging.${henryAppDomain()}/app`,
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
