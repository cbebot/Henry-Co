import * as WebBrowser from "expo-web-browser";
import { View } from "react-native";

import { Button } from "@/design-system/components/Button";
import { Text } from "@/design-system/components/Text";
import { spacing } from "@/design-system/theme";
import type { Division } from "@/domain/division";

function OpenSiteButton({ url }: { url: string }) {
  return <Button title="Open division website" onPress={() => WebBrowser.openBrowserAsync(url)} />;
}

export function ModuleDetail({ division }: { division: Division }) {
  if (division.slug === "buildings-interiors") {
    return (
      <View style={{ gap: spacing.md }}>
        <Text variant="body" color="textSecondary">
          Buildings &amp; Interiors is in a coming-soon state on the public hub. This placeholder
          keeps the roadmap visible inside the super app without exposing unfinished transactional
          flows.
        </Text>
        <OpenSiteButton url={division.destinationUrl} />
      </View>
    );
  }

  if (division.slug === "fabric-care") {
    return (
      <View style={{ gap: spacing.md }}>
        <Text variant="subtitle">Orders &amp; pickup</Text>
        <Text variant="body" color="textSecondary">
          Schedule pickup, follow live garment status, and message support from one workspace.
          Native flows connect to Supabase tables (`fabric_orders`, `pickup_slots`) in staging.
        </Text>
        <OpenSiteButton url={division.destinationUrl} />
      </View>
    );
  }

  if (division.slug === "jobs") {
    return (
      <View style={{ gap: spacing.md }}>
        <Text variant="subtitle">Roles &amp; applications</Text>
        <Text variant="body" color="textSecondary">
          Browse verified employers, save roles to your HenryCo account, and submit structured
          applications with trust signals surfaced before you apply.
        </Text>
        <OpenSiteButton url={division.destinationUrl} />
      </View>
    );
  }

  if (division.slug === "property") {
    return (
      <View style={{ gap: spacing.md }}>
        <Text variant="subtitle">Listings &amp; viewings</Text>
        <Text variant="body" color="textSecondary">
          Curated rentals and sales with trust notes, viewing requests, and managed-property
          services. Mobile uses the same account spine as the web property surface.
        </Text>
        <OpenSiteButton url={division.destinationUrl} />
      </View>
    );
  }

  if (division.slug === "learn") {
    return (
      <View style={{ gap: spacing.md }}>
        <Text variant="subtitle">Courses &amp; certificates</Text>
        <Text variant="body" color="textSecondary">
          Public learning paths, internal assignments, and verifiable certificates roll up to your
          profile when authenticated.
        </Text>
        <OpenSiteButton url={division.destinationUrl} />
      </View>
    );
  }

  if (division.slug === "logistics") {
    return (
      <View style={{ gap: spacing.md }}>
        <Text variant="subtitle">Dispatch &amp; proof of delivery</Text>
        <Text variant="body" color="textSecondary">
          Quotes, bookings, rider assignment, and POD photos share one accountable workflow. Start
          on the web while native dispatch surfaces harden in staging.
        </Text>
        <OpenSiteButton url={division.destinationUrl} />
      </View>
    );
  }

  if (division.slug === "marketplace") {
    return (
      <View style={{ gap: spacing.md }}>
        <Text variant="subtitle">Products &amp; vendors</Text>
        <Text variant="body" color="textSecondary">
          Verified seller passports, split-order clarity, and wishlists stay tied to your HenryCo
          account. Checkout integrations should remain in staging until payments are approved.
        </Text>
        <OpenSiteButton url={division.destinationUrl} />
      </View>
    );
  }

  if (division.slug === "studio") {
    return (
      <View style={{ gap: spacing.md }}>
        <Text variant="subtitle">Studio inquiry</Text>
        <Text variant="body" color="textSecondary">
          Capture package-fit or bespoke briefs, route to the right delivery team, and track
          milestones, invoices, and files inside your HenryCo account.
        </Text>
        <OpenSiteButton url={division.destinationUrl} />
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="body" color="textSecondary">
        Explore this division on the web while native experiences continue to ship.
      </Text>
      <OpenSiteButton url={division.destinationUrl} />
    </View>
  );
}
