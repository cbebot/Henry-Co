import type { Session, SupabaseClient } from "@supabase/supabase-js";

import type { AuthAdapter, AuthResult, AuthSession, AuthUser } from "@/platform/contracts/auth";

function mapUser(u: Session["user"]): AuthUser {
  return {
    id: u.id,
    email: u.email ?? "",
    displayName: (u.user_metadata?.full_name as string | undefined) ?? undefined,
  };
}

function mapSession(session: Session | null): AuthSession | null {
  if (!session?.user) return null;
  return { user: mapUser(session.user) };
}

export class SupabaseAuthAdapter implements AuthAdapter {
  constructor(private readonly client: SupabaseClient) {}

  async getSession(): Promise<AuthSession | null> {
    const { data } = await this.client.auth.getSession();
    return mapSession(data.session ?? null);
  }

  async signInWithPassword(email: string, password: string): Promise<AuthResult<AuthSession>> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("[super-app:auth] sign-in failed", error);
      return {
        ok: false,
        error: "We couldn't sign you in. Check your email and password and try again.",
      };
    }
    const s = mapSession(data.session);
    if (!s) return { ok: false, error: "We couldn't sign you in. Please try again." };
    return { ok: true, data: s };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  subscribe(listener: (session: AuthSession | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      listener(mapSession(session));
    });
    void this.getSession().then(listener);
    return () => data.subscription.unsubscribe();
  }
}
