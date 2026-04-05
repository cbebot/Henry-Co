import { ScrollView, StyleSheet } from "react-native";

import { spacing } from "@/design-system/theme";
import { LegalPrivacy } from "@/features/legal/LegalPrivacy";

export default function PrivacyPage() {
  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <LegalPrivacy />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
