import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AuthAdapter, AuthResult, AuthSession, AuthUser } from "@/platform/contracts/auth";

const KEY = "@henryco/mock_auth_session_v1";

function uid() {
  return `local-${Math.random().toString(36).slice(2, 12)}`;
}

export class MockAuthAdapter implements AuthAdapter {
  private listeners = new Set<(s: AuthSession | null) => void>();
  private cache: AuthSession | null = null;

  private async persist(session: AuthSession | null) {
    this.cache = session;
    if (session) {
      await AsyncStorage.setItem(KEY, JSON.stringify(session));
    } else {
      await AsyncStorage.removeItem(KEY);
    }
    this.listeners.forEach((l) => l(session));
  }

  private notify(session: AuthSession | null) {
    this.listeners.forEach((l) => l(session));
  }

  async getSession(): Promise<AuthSession | null> {
    if (this.cache) return this.cache;
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    try {
      const s = JSON.parse(raw) as AuthSession;
      this.cache = s;
      return s;
    } catch {
      return null;
    }
  }

  async signInWithPassword(email: string, password: string): Promise<AuthResult<AuthSession>> {
    if (password.length < 8) {
      return { ok: false, error: "Use at least 8 characters (local mock)." };
    }
    const user: AuthUser = {
      id: uid(),
      email: email.trim().toLowerCase(),
      displayName: email.split("@")[0] ?? "Local user",
    };
    const session: AuthSession = { user };
    await this.persist(session);
    return { ok: true, data: session };
  }

  async signOut(): Promise<void> {
    await this.persist(null);
  }

  subscribe(listener: (session: AuthSession | null) => void): () => void {
    this.listeners.add(listener);
    void this.getSession().then((s) => listener(s));
    return () => this.listeners.delete(listener);
  }
}
