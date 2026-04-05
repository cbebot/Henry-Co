import { ScrollView, StyleSheet } from "react-native";

import { spacing } from "@/design-system/theme";
import { LegalTerms } from "@/features/legal/LegalTerms";

export default function TermsPage() {
  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <LegalTerms />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
