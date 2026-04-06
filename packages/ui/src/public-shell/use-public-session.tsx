"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { PublicAccountUser } from "../public/public-account-chip";

export type PublicSessionState = {
  user: PublicAccountUser | null;
  signedIn: boolean;
  loginHref: string;
  signupHref: string;
  accountHref: string;
  preferencesHref: string;
  settingsHref: string;
  signOutApiPath: string;
  signOutRedirectHref?: string;
};

const PublicSessionContext = createContext<PublicSessionState | null>(null);

export function PublicSessionProvider({
  session,
  children,
}: {
  session: PublicSessionState;
  children: ReactNode;
}) {
  const stable = useMemo(() => session, [
    session.user?.displayName,
    session.user?.email,
    session.user?.avatarUrl,
    session.signedIn,
    session.loginHref,
    session.signupHref,
    session.accountHref,
    session.preferencesHref,
    session.settingsHref,
    session.signOutApiPath,
    session.signOutRedirectHref,
  ]);

  return (
    <PublicSessionContext value={stable}>
      {children}
    </PublicSessionContext>
  );
}

export function usePublicSession(): PublicSessionState {
  const ctx = useContext(PublicSessionContext);
  if (!ctx) {
    return {
      user: null,
      signedIn: false,
      loginHref: "/login",
      signupHref: "/signup",
      accountHref: "/account",
      preferencesHref: "/preferences",
      settingsHref: "/settings",
      signOutApiPath: "/api/auth/logout",
    };
  }
  return ctx;
}

export function useOptionalPublicSession(): PublicSessionState | null {
  return useContext(PublicSessionContext);
}
