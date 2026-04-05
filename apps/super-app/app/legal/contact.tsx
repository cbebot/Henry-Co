import { ScrollView, StyleSheet } from "react-native";

import { spacing } from "@/design-system/theme";
import { ContactScreen } from "@/features/legal/ContactScreen";

export default function ContactPage() {
  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <ContactScreen />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
