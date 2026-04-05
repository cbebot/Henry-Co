import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

import { palette } from "@/design-system/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.textPrimary,
        headerTitleStyle: { fontWeight: "600" },
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hub",
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={22} color={color} />,
          tabBarAccessibilityLabel: "Company hub",
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: "Directory",
          tabBarIcon: ({ color }) => <FontAwesome name="search" size={22} color={color} />,
          tabBarAccessibilityLabel: "Division directory",
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Divisions",
          tabBarIcon: ({ color }) => <FontAwesome name="th-large" size={22} color={color} />,
          tabBarAccessibilityLabel: "All divisions",
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={22} color={color} />,
          tabBarAccessibilityLabel: "Account and profile",
        }}
      />
    </Tabs>
  );
}
