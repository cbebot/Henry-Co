import { View } from "react-native";

import { Text } from "@/design-system/components/Text";
import { spacing } from "@/design-system/theme";

export function LegalAbout() {
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="body" color="textSecondary">
        Henry &amp; Co. is a multi-division business group built to deliver specialized services
        through focused operating units under a shared standard of quality, discipline, and
        professional accountability.
      </Text>
      <Text variant="subtitle">Focused divisions</Text>
      <Text variant="body" color="textSecondary">
        Each division serves a clearly defined customer need, market category, and operating model.
      </Text>
      <Text variant="subtitle">Shared operating discipline</Text>
      <Text variant="body" color="textSecondary">
        Leadership, brand governance, service quality, and long-term stewardship align to one
        parent standard.
      </Text>
    </View>
  );
}
