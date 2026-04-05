import { View } from "react-native";

import { Text } from "@/design-system/components/Text";
import { spacing } from "@/design-system/theme";

export function LegalTerms() {
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="body" color="textSecondary">
        By using Henry &amp; Co. public pages you agree to use them lawfully and in line with these
        terms. Division destinations may introduce additional requirements.
      </Text>
      <Text variant="subtitle">Informational use</Text>
      <Text variant="body" color="textSecondary">
        Content is provided for general business and informational purposes unless expressly stated
        otherwise.
      </Text>
      <Text variant="subtitle">Brand and IP</Text>
      <Text variant="body" color="textSecondary">
        Henry &amp; Co. branding, design, and materials may not be reused without appropriate
        authorization.
      </Text>
    </View>
  );
}
