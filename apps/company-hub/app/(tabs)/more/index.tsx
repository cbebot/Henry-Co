import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useHubAppearance } from "@/context/HubAppearanceContext";

type MenuRow = {
  href: "/more/about" | "/more/contact" | "/more/privacy" | "/more/terms" | "/more/settings";
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  subtitle: string;
};

const rows: MenuRow[] = [
  {
    href: "/more/about",
    label: "About",
    icon: "information-outline",
    subtitle: "Who we are",
  },
  {
    href: "/more/contact",
    label: "Contact",
    icon: "email-outline",
    subtitle: "Reach the team",
  },
  {
    href: "/more/privacy",
    label: "Privacy",
    icon: "shield-lock-outline",
    subtitle: "Your data",
  },
  {
    href: "/more/terms",
    label: "Terms",
    icon: "file-document-outline",
    subtitle: "Legal terms",
  },
  {
    href: "/more/settings",
    label: "Settings",
    icon: "cog-outline",
    subtitle: "Preferences",
  },
];

export default function MoreIndexScreen() {
  const { palette } = useHubAppearance();

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pt-4">
        <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
          Menu
        </Text>
        <Text
          className="mt-2 text-2xl font-bold"
          style={{ color: palette.textPrimary }}
        >
          More
        </Text>
        <Text className="mt-2 text-sm leading-6" style={{ color: palette.muted }}>
          Policies, company context, and ways to reach us—consistent with the
          public hub experience.
        </Text>
      </View>

      <View className="mt-8 flex-row flex-wrap gap-3 px-4">
        {rows.map((row) => (
          <Link key={row.href} href={row.href} asChild>
            <Pressable
              className="w-[47%] rounded-2xl border p-4 active:opacity-90"
              style={{
                borderColor: palette.line,
                backgroundColor: palette.surface,
              }}
              accessibilityLabel={`Navigate to ${row.label}`}
              accessibilityRole="button"
            >
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#C9A227]/15">
                <MaterialCommunityIcons
                  name={row.icon}
                  size={24}
                  color="#C9A227"
                />
              </View>
              <Text
                className="mt-3 text-base font-semibold"
                style={{ color: palette.textPrimary }}
              >
                {row.label}
              </Text>
              <Text className="mt-1 text-xs" style={{ color: palette.muted }}>
                {row.subtitle}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}
