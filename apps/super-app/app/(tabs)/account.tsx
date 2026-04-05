import { Screen } from "@/design-system/components/Screen";
import { AccountScreen } from "@/features/account/AccountScreen";

export default function AccountTab() {
  return (
    <Screen scroll title="Account">
      <AccountScreen />
    </Screen>
  );
}
