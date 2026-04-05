export type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
};

export type AuthSession = {
  user: AuthUser;
};

export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type AuthAdapter = {
  getSession(): Promise<AuthSession | null>;
  signInWithPassword(email: string, password: string): Promise<AuthResult<AuthSession>>;
  signOut(): Promise<void>;
  /** Subscribe to session changes; returns unsubscribe. */
  subscribe(listener: (session: AuthSession | null) => void): () => void;
};
