import * as Linking from "expo-linking";

const prefix = Linking.createURL("/");

/** Expo Router linking prefixes for universal links + custom scheme (staging). */
export const linkingPrefixes = [prefix, "henryco://", "https://staging.henrycogroup.com/app"];

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
