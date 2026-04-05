import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  kicker: string;
  title: string;
  action?: {
    label: string;
    onPress: () => void;
  };
};

export function SectionHeader({ kicker, title, action }: Props) {
  return (
    <View className="flex-row items-end justify-between px-4 pb-3 pt-6">
      <View className="min-w-0 flex-1">
        <Text className="text-xs font-bold uppercase tracking-widest text-hub-gold">
          {kicker}
        </Text>
        <Text className="mt-1 text-xl font-bold text-white">{title}</Text>
      </View>

      {action && (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          className="flex-row items-center gap-1 pb-0.5"
          hitSlop={8}
        >
          <Text className="text-sm font-semibold text-hub-gold">
            {action.label}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color="#C9A227"
          />
        </Pressable>
      )}
    </View>
  );
}
