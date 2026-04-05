import { ScrollView, StyleSheet } from "react-native";

import { spacing } from "@/design-system/theme";
import { LegalFaq } from "@/features/legal/LegalFaq";

export default function FaqPage() {
  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <LegalFaq />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
