import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

import { Button } from "@/design-system/components/Button";
import { ErrorState } from "@/design-system/components/ErrorState";
import { Text } from "@/design-system/components/Text";
import { TextField } from "@/design-system/components/TextField";
import { spacing } from "@/design-system/theme";
import type { ContactFormValues } from "@/domain/schemas/contactSchema";
import { contactSchema } from "@/domain/schemas/contactSchema";
import { submitContact } from "@/services/contactService";

export function ContactScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      topic: "",
      message: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root");
    const res = await submitContact(values);
    if (!res.ok) {
      setError("root", { message: res.error });
      return;
    }
    reset();
  });

  return (
    <View style={{ gap: spacing.lg }} testID="contact-screen">
      <Text variant="body" color="textSecondary">
        Corporate enquiries, partnerships, and media introductions. For division-specific requests,
        open the relevant module and use its operational channels.
      </Text>
      {errors.root?.message ? (
        <ErrorState title="Could not send" message={errors.root.message} />
      ) : null}
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            label="Full name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="topic"
        render={({ field }) => (
          <TextField
            label="Topic"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.topic?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="message"
        render={({ field }) => (
          <TextField
            label="Message"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.message?.message}
          />
        )}
      />
      <Button title="Send message" loading={isSubmitting} onPress={onSubmit} />
    </View>
  );
}
