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

export default function TermsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-hub-bg"
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pt-4">
        <Text className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
          Terms of Use
        </Text>
        <Text className="mt-2 text-sm leading-6 text-hub-muted">
          Last updated: April 5, 2026
        </Text>

        <Text className="mt-4 text-sm leading-6 text-[#DCDCE2]">
          These Terms of Use (&quot;Terms&quot;) govern your access to and use
          of the Henry &amp; Co. Hub mobile application (the &quot;App&quot;)
          operated by Henry &amp; Co. Group (&quot;we&quot;, &quot;us&quot;, or
          &quot;our&quot;). By downloading, installing, or using the App, you
          agree to be bound by these Terms.
        </Text>

        <Section title="1. Acceptance of Terms">
          <Body>
            By accessing or using the App, you confirm that you have read,
            understood, and agree to be bound by these Terms. If you do not
            agree, you must not use the App. We reserve the right to modify
            these Terms at any time, and your continued use constitutes
            acceptance of any changes.
          </Body>
        </Section>

        <Section title="2. Use License">
          <Body>
            We grant you a limited, non-exclusive, non-transferable, revocable
            licence to use the App for personal, non-commercial purposes in
            accordance with these Terms. You may not copy, modify, distribute,
            sell, or lease any part of the App, nor may you reverse-engineer or
            attempt to extract the source code, except where such restrictions
            are prohibited by applicable law.
          </Body>
        </Section>

        <Section title="3. Division Services">
          <Body>
            The App serves as a navigation hub for Henry &amp; Co. divisions.
            Each division operates independently and may have its own terms of
            service, pricing, and policies. When you access a division&apos;s
            website or service through the App, you are subject to that
            division&apos;s applicable terms in addition to these Terms.
          </Body>
          <Text className="mt-2 text-sm leading-6 text-[#DCDCE2]">
            We do not guarantee the availability, accuracy, or completeness of
            any division&apos;s services. The App provides information about
            divisions on an &quot;as available&quot; basis.
          </Text>
        </Section>

        <Section title="4. User Conduct">
          <Body>
            You agree not to use the App in any way that violates applicable
            laws or regulations; infringes upon the rights of others; introduces
            viruses, malware, or other harmful code; or attempts to gain
            unauthorised access to our systems or networks. We reserve the right
            to terminate or restrict your access to the App for any violation of
            these Terms.
          </Body>
        </Section>

        <Section title="5. Intellectual Property">
          <Body>
            All content, features, and functionality of the App, including but
            not limited to text, graphics, logos, icons, and software, are the
            property of Henry &amp; Co. Group or its licensors and are protected
            by applicable intellectual property laws. Nothing in these Terms
            grants you any right, title, or interest in such intellectual
            property except for the limited licence described above.
          </Body>
        </Section>

        <Section title="6. Disclaimers">
          <Body>
            THE APP IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
            WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED,
            INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
            WARRANT THAT THE APP WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
          </Body>
        </Section>

        <Section title="7. Limitation of Liability">
          <Body>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, HENRY &amp; CO. GROUP SHALL
            NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
            OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE
            APP, REGARDLESS OF THE THEORY OF LIABILITY.
          </Body>
        </Section>

        <Section title="8. Governing Law">
          <Body>
            These Terms shall be governed by and construed in accordance with
            the laws of the jurisdiction in which Henry &amp; Co. Group is
            registered, without regard to conflict-of-law principles. Any
            disputes arising under these Terms shall be resolved in the
            competent courts of that jurisdiction.
          </Body>
        </Section>

        <Section title="9. Contact">
          <Body>
            For questions regarding these Terms, please contact us at
            hello@henrycogroup.com or visit henrycogroup.com.
          </Body>
        </Section>
      </View>
    </ScrollView>
  );
}
