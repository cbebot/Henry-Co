import { ScrollView, StyleSheet } from "react-native";

import { LegalAbout } from "@/features/legal/LegalAbout";
import { spacing } from "@/design-system/theme";

export default function AboutPage() {
  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <LegalAbout />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
