import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

import { Button } from "@/design-system/components/Button";
import { Card } from "@/design-system/components/Card";
import { ErrorState } from "@/design-system/components/ErrorState";
import { Text } from "@/design-system/components/Text";
import { TextField } from "@/design-system/components/TextField";
import { spacing } from "@/design-system/theme";
import type { SignInValues } from "@/domain/schemas/authSchema";
import { signInSchema } from "@/domain/schemas/authSchema";
import { useActivity } from "@/hooks/useActivity";
import { useAuthSession } from "@/hooks/useAuthSession";
import { usePlatform } from "@/providers/PlatformProvider";

export function AccountScreen() {
  const router = useRouter();
  const { session, loading } = useAuthSession();
  const { mode, flags, auth, notifications, payments, analytics } = usePlatform();
  const { items: activity, loading: actLoading } = useActivity(6);
  const [checkoutHint, setCheckoutHint] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSignIn = handleSubmit(async (values) => {
    clearErrors("root");
    setCheckoutHint(null);
    const res = await auth.signInWithPassword(values.email, values.password);
    if (!res.ok) {
      setError("root", { message: res.error });
    }
  });

  const onSignOut = async () => {
    setCheckoutHint(null);
    await auth.signOut();
  };

  const onMockCheckout = async () => {
    setCheckoutHint(null);
    analytics.track("mock_checkout_tap", { mode });
    const res = await payments.startCheckout({
      amountMinor: 18_500_000,
      currency: "NGN",
      label: "Demo marketplace item",
    });
    if (res.ok) {
      setCheckoutHint(`Demo payment OK · ${res.reference}${res.mock ? " (mock)" : ""}`);
    } else {
      setCheckoutHint(res.error);
    }
  };

  if (loading) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Text variant="body" color="textSecondary">
          Loading session…
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.lg }} testID="account-screen">
      <Text variant="caption" color="textMuted">
        Runtime: {mode} · remote DB: {flags.remoteDatabase ? "on" : "off"} · payments:{" "}
        {flags.payments ? "sandbox/deferred" : "mock"}
      </Text>

      {session ? (
        <>
          <Text variant="title">Signed in</Text>
          <Text variant="body" color="textSecondary">
            {session.user.email}
          </Text>
          <Button title="Sign out" variant="secondary" onPress={onSignOut} />
          <Button
            title="Register for push"
            variant="ghost"
            onPress={async () => {
              const res = await notifications.registerForPush();
              console.log("Push registration", res);
            }}
          />
          <Button title="Try mock checkout (demo)" variant="ghost" onPress={onMockCheckout} />
          {checkoutHint ? (
            <Text variant="caption" color="textSecondary">
              {checkoutHint}
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <Text variant="subtitle">
            {mode === "local" ? "Local mock sign-in" : "Sign in with your HenryCo account"}
          </Text>
          {mode === "local" ? (
            <Text variant="caption" color="textSecondary">
              Any email and password (8+ chars). No Supabase required.
            </Text>
          ) : null}
          {errors.root?.message ? (
            <ErrorState title="Sign-in failed" message={errors.root.message} />
          ) : null}
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextField
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextField
                label="Password"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.password?.message}
              />
            )}
          />
          <Button title="Sign in" loading={isSubmitting} onPress={onSignIn} />
        </>
      )}

      <Text variant="subtitle">Activity (linked modules)</Text>
      {actLoading ? (
        <Text variant="caption" color="textSecondary">
          Loading…
        </Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {activity.map((a) => (
            <Card
              key={a.id}
              title={a.title}
              subtitle={`${a.subtitle} · ${a.status}`}
              onPress={() => router.push(`/module/${a.divisionSlug}`)}
            />
          ))}
        </View>
      )}

      <Text variant="subtitle">Company</Text>
      <Link href="/legal/privacy">
        <Text variant="body" color="accent">
          Privacy
        </Text>
      </Link>
      <Link href="/legal/terms">
        <Text variant="body" color="accent">
          Terms
        </Text>
      </Link>
    </View>
  );
}
