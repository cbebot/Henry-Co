import { ScrollView, Text, View } from "react-native";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-6">
      <Text className="text-base font-semibold text-white">{title}</Text>
      <View className="mt-2">{children}</View>
    </View>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-sm leading-6 text-[#DCDCE2]">{children}</Text>
  );
}

export default function PrivacyScreen() {
  return (
    <ScrollView
      className="flex-1 bg-hub-bg"
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pt-4">
        <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
          Privacy Policy
        </Text>
        <Text className="mt-2 text-sm leading-6 text-hub-muted">
          Last updated: April 5, 2026
        </Text>

        <Text className="mt-4 text-sm leading-6 text-[#DCDCE2]">
          Henry &amp; Co. Group (&quot;we&quot;, &quot;us&quot;, or
          &quot;our&quot;) operates the Henry &amp; Co. Hub mobile application
          (the &quot;App&quot;). This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you use the App.
        </Text>

        <Section title="1. Information We Collect">
          <Body>
            We may collect the following categories of information when you use
            the App:
          </Body>
          <Text className="mt-2 text-sm leading-6 text-[#DCDCE2]">
            {"\u2022"} Device identifiers and basic technical data (operating
            system, device model, app version) to ensure compatibility and
            diagnose issues.
          </Text>
          <Text className="mt-1 text-sm leading-6 text-[#DCDCE2]">
            {"\u2022"} Usage analytics such as screens visited, features used,
            and interaction patterns to improve the App experience.
          </Text>
          <Text className="mt-1 text-sm leading-6 text-[#DCDCE2]">
            {"\u2022"} Locally stored preferences including bookmarks, theme
            settings, and onboarding status. This data remains on your device
            and is not transmitted to our servers.
          </Text>
        </Section>

        <Section title="2. How We Use Your Information">
          <Body>
            We use the information we collect to operate, maintain, and improve
            the App; provide you with a personalised experience; monitor
            aggregate usage patterns; respond to support requests; and comply
            with legal obligations. We do not sell your personal information to
            third parties.
          </Body>
        </Section>

        <Section title="3. Data Sharing and Disclosure">
          <Body>
            We may share information with trusted service providers that assist
            us in operating the App (e.g., analytics platforms), but only to the
            extent necessary and under appropriate contractual safeguards. We may
            also disclose information when required by law, to protect our
            rights, or in connection with a merger or acquisition.
          </Body>
          <Text className="mt-2 text-sm leading-6 text-[#DCDCE2]">
            Division websites you access through the in-app browser are governed
            by their respective privacy policies. We encourage you to review
            those policies independently.
          </Text>
        </Section>

        <Section title="4. Data Retention and Security">
          <Body>
            We retain collected information only as long as necessary to fulfil
            the purposes described in this policy. We implement
            industry-standard technical and organisational measures to protect
            your information against unauthorised access, alteration, disclosure,
            or destruction.
          </Body>
        </Section>

        <Section title="5. Your Rights">
          <Body>
            Depending on your jurisdiction, you may have the right to access,
            correct, or delete your personal information; object to or restrict
            certain processing; and withdraw consent where processing is based
            on consent. To exercise these rights, contact us at the address
            below.
          </Body>
        </Section>

        <Section title="6. Children's Privacy">
          <Body>
            The App is not intended for children under the age of 13. We do not
            knowingly collect personal information from children. If you believe
            we have inadvertently collected such information, please contact us
            so we can promptly remove it.
          </Body>
        </Section>

        <Section title="7. Changes to This Policy">
          <Body>
            We may update this Privacy Policy from time to time. We will notify
            you of material changes by updating the &quot;Last updated&quot;
            date at the top of this page. Continued use of the App after changes
            constitutes acceptance of the revised policy.
          </Body>
        </Section>

        <Section title="8. Contact Us">
          <Body>
            If you have questions about this Privacy Policy, please contact us
            at hello@henrycogroup.com or visit henrycogroup.com.
          </Body>
        </Section>
      </View>
    </ScrollView>
  );
}
