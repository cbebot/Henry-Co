import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

import { DIVISIONS } from "@/data/divisions";

const principles = [
  "Premium execution in every interaction",
  "Transparent operations and honest communication",
  "Accountable service delivery across all divisions",
  "Disciplined growth through connected experiences",
];

export default function AboutScreen() {
  const divisionCount = DIVISIONS.length;
  const activeCount = DIVISIONS.filter((d) => d.status === "active").length;

  return (
    <ScrollView
      className="flex-1 bg-hub-bg"
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pt-4">
        <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
          About
        </Text>
        <Text className="mt-2 text-xl font-bold text-white">
          Henry &amp; Co.
        </Text>
        <Text className="mt-4 text-base leading-7 text-[#DCDCE2]">
          Henry &amp; Co. is a diversified operating group spanning fabric care,
          technology and design, commerce, talent, property, education,
          logistics, and built environment services. The Company Hub connects
          these divisions under one disciplined brand experience—so clients,
          partners, and talent can navigate with clarity.
        </Text>
        <Text className="mt-4 text-base leading-7 text-[#DCDCE2]">
          Founded with the principle that operational excellence and premium
          service should be accessible, Henry &amp; Co. continues to grow its
          division network while maintaining consistent standards of quality,
          transparency, and accountability.
        </Text>
      </View>

      <View className="mt-8 px-4">
        <View className="rounded-2xl border border-hub-line bg-hub-surface p-5">
          <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
            Principles
          </Text>
          <View className="mt-4 gap-3">
            {principles.map((principle) => (
              <View key={principle} className="flex-row items-start gap-3">
                <MaterialCommunityIcons
                  name="diamond-stone"
                  size={14}
                  color="#C9A227"
                  style={{ marginTop: 3 }}
                />
                <Text className="flex-1 text-base leading-6 text-[#DCDCE2]">
                  {principle}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className="mt-6 flex-row gap-3 px-4">
        <View className="flex-1 rounded-2xl border border-hub-line bg-hub-surface p-4">
          <Text className="text-2xl font-bold text-[#C9A227]">
            {divisionCount}
          </Text>
          <Text className="mt-1 text-sm text-hub-muted">
            Total divisions
          </Text>
        </View>
        <View className="flex-1 rounded-2xl border border-hub-line bg-hub-surface p-4">
          <Text className="text-2xl font-bold text-[#C9A227]">
            {activeCount}
          </Text>
          <Text className="mt-1 text-sm text-hub-muted">
            Active divisions
          </Text>
        </View>
      </View>

      <View className="mt-6 px-4">
        <View className="rounded-2xl border border-hub-line bg-hub-surface p-5">
          <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
            The Network
          </Text>
          <Text className="mt-3 text-base leading-7 text-[#DCDCE2]">
            Each division operates with autonomy while sharing infrastructure,
            design principles, and operational standards set by the group.
            Whether you&apos;re booking fabric care, hiring through Jobs, or
            commissioning Studio work, the experience is connected.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
