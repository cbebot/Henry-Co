import { View } from "react-native";

import { Text } from "@/design-system/components/Text";
import { spacing } from "@/design-system/theme";

export function LegalPrivacy() {
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="body" color="textSecondary">
        This privacy notice applies to Henry &amp; Co. corporate surfaces and direct interactions
        with the parent company. Independent division systems may maintain separate notices.
      </Text>
      <Text variant="subtitle">Information you may provide</Text>
      <Text variant="body" color="textSecondary">
        Names, email addresses, phone numbers, company details, and enquiry content submitted
        through forms or correspondence.
      </Text>
      <Text variant="subtitle">Automatically collected data</Text>
      <Text variant="body" color="textSecondary">
        Technical usage signals such as device type, session activity, and pages viewed may be
        collected to secure and improve services.
      </Text>
    </View>
  );
}
