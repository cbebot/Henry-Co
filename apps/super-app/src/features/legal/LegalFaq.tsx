import { View } from "react-native";

import { Text } from "@/design-system/components/Text";
import { spacing } from "@/design-system/theme";

const items: { q: string; a: string }[] = [
  {
    q: "Can I go directly to a division?",
    a: "Yes. Divisions keep their own destinations. The hub helps you understand the wider group and pick the right business faster.",
  },
  {
    q: "Will new divisions appear here?",
    a: "Yes. As Henry & Co. expands, divisions are introduced through the same premium framework.",
  },
  {
    q: "Who is this experience for?",
    a: "Customers, partners, suppliers, media, talent, and stakeholders who need a clearer view of the group.",
  },
];

export function LegalFaq() {
  return (
    <View style={{ gap: spacing.lg }}>
      {items.map((item) => (
        <View key={item.q} style={{ gap: spacing.sm }}>
          <Text variant="subtitle">{item.q}</Text>
          <Text variant="body" color="textSecondary">
            {item.a}
          </Text>
        </View>
      ))}
    </View>
  );
}
