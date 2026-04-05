import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

import { getEnv, isSupabaseConfigured } from "@/core/env";
import { registerForPushNotificationsAsync } from "@/core/pushNotifications";
import { getSupabaseClient } from "@/core/supabase";
import { Button } from "@/design-system/components/Button";
import { ErrorState } from "@/design-system/components/ErrorState";
import { Text } from "@/design-system/components/Text";
import { TextField } from "@/design-system/components/TextField";
import { spacing } from "@/design-system/theme";
import type { SignInValues } from "@/domain/schemas/authSchema";
import { signInSchema } from "@/domain/schemas/authSchema";
import { useAuthSession } from "@/features/account/useAuthSession";

export function AccountScreen() {
  const { session, loading } = useAuthSession();
  const env = getEnv();
  const configured = isSupabaseConfigured(env);

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
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("root", { message: "Supabase is not configured for this build." });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setError("root", { message: error.message });
    }
  });

  const onSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase?.auth.signOut();
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
      {!configured ? (
        <ErrorState
          title="Staging backend not configured"
          message="Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable sign-in."
        />
      ) : null}

      {session ? (
        <>
          <Text variant="title">Signed in</Text>
          <Text variant="body" color="textSecondary">
            {session.user.email}
          </Text>
          <Button title="Sign out" variant="secondary" onPress={onSignOut} />
          <Button
            title="Register for push (device)"
            variant="ghost"
            onPress={async () => {
              const res = await registerForPushNotificationsAsync();
              if (res.status === "granted") {
                console.log("Expo push token", res.expoPushToken);
              }
            }}
          />
        </>
      ) : (
        <>
          <Text variant="subtitle">Sign in with your HenryCo account</Text>
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
