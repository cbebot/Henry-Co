export type PushRegistration =
  | { status: "unavailable"; reason: string }
  | { status: "granted"; token: string }
  | { status: "denied" };

export type NotificationsAdapter = {
  registerForPush(): Promise<PushRegistration>;
};
