import { Link } from "expo-router";
import { View } from "react-native";

import { Button } from "@/design-system/components/Button";
import { Screen } from "@/design-system/components/Screen";
import { spacing } from "@/design-system/theme";
import { HubScreen } from "@/features/hub/HubScreen";

export default function HubTab() {
  return (
    <Screen scroll>
      <HubScreen />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg }}>
        <Link href="/legal/faq" asChild>
          <Button title="FAQ" variant="ghost" />
        </Link>
        <Link href="/legal/contact" asChild>
          <Button title="Contact" variant="ghost" />
        </Link>
      </View>
    </Screen>
  );
}
