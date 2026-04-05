import { Screen } from "@/design-system/components/Screen";
import { DirectoryScreen } from "@/features/directory/DirectoryScreen";

export default function DirectoryTab() {
  return (
    <Screen scroll title="Directory">
      <DirectoryScreen />
    </Screen>
  );
}
