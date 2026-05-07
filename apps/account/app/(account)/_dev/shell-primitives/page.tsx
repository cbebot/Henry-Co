/**
 * V2-DASH-01 G3 — Dev sandbox for the dashboard-shell primitives.
 *
 * Renders one instance of each primitive in each meaningful state so
 * a developer can eyeball geometry, motion, and a11y in one place
 * without spinning up the full shell.
 *
 * Lives under `_dev/` (Next.js convention: underscore-prefixed folders
 * are NEVER routed) so this page exists only when explicitly opened
 * via `/[base]/_dev/shell-primitives`. NOT shipped in production
 * navigation; NOT linked from the IdentityBar or any module.
 *
 * Usage:
 *   1. `pnpm --filter @henryco/account dev`
 *   2. http://localhost:3003/_dev/shell-primitives
 *
 * If the page renders without console errors and every primitive
 * shows its declared state, V10 (empty / loading / error / success)
 * holds at the primitive layer.
 */

import { Bell, ShoppingBag, Wallet } from "lucide-react";
import {
  ActionButton,
  Badge,
  Chip,
  DEFAULT_CSS_VAR_VALUES,
  EmptyState,
  ErrorBoundary,
  LoadingSkeleton,
  MetricCard,
  Panel,
  PageHeader,
  QuickLink,
  Section,
  SignalCard,
} from "@henryco/dashboard-shell";

export const dynamic = "force-dynamic";

export default function ShellPrimitivesSandbox() {
  return (
    <div
      style={{
        ...DEFAULT_CSS_VAR_VALUES,
        padding: "2rem 1.5rem",
        backgroundColor: "var(--hc-surface)",
        minHeight: "100vh",
      }}
    >
      <PageHeader
        kicker="V2-DASH-01"
        title="Shell primitives sandbox"
        description="Every primitive in @henryco/dashboard-shell, rendered in its meaningful states. Open in the browser to verify motion, focus, and a11y."
      />

      <Section
        kicker="01"
        headline="Panels"
        description="Three tones — flat, raised, inset."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          <Panel tone="flat">
            <p>Flat — no shadow, hairline border.</p>
          </Panel>
          <Panel tone="raised">
            <p>Raised — soft shadow, primary content surface.</p>
          </Panel>
          <Panel tone="inset">
            <p>Inset — recessed, quiet sections.</p>
          </Panel>
        </div>
      </Section>

      <Section kicker="02" headline="Chips & badges">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <Chip tone="accent">Accent</Chip>
          <Chip tone="success">Success</Chip>
          <Chip tone="warning">Warning</Chip>
          <Chip tone="urgent">Urgent</Chip>
          <Chip tone="neutral">Neutral</Chip>
          <Chip tone="outline">Outline</Chip>
          <Badge value={3} />
          <Badge value={42} tone="urgent" />
          <Badge value="!" tone="warning" />
          <Badge value={150} tone="success" />
        </div>
      </Section>

      <Section
        kicker="03"
        headline="MetricCard — required context"
        description="Type-system-enforced: bare {label, value} is a type error."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          <MetricCard
            label="Wallet"
            value="₦45,200"
            icon={<Wallet size={18} />}
            context={{ kind: "comparison", vs: "last week", delta: "+₦12,400" }}
          />
          <MetricCard
            label="Notifications"
            value="3"
            icon={<Bell size={18} />}
            context={{ kind: "trend", direction: "up", magnitude: "+18 in 7d" }}
          />
          <MetricCard
            label="Orders"
            value="12"
            icon={<ShoppingBag size={18} />}
            context={{ kind: "trend", direction: "down", magnitude: "−2 since Mon" }}
          />
          <MetricCard
            label="Sessions"
            value="—"
            context={{ kind: "trend", direction: "flat", magnitude: "stable" }}
          />
        </div>
      </Section>

      <Section
        kicker="04"
        headline="SignalCard — four priorities"
        description="Security + urgent get a left-edge accent strip."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
          <SignalCard
            kicker="Marketplace"
            title="Order #M-1024 packed"
            body="Vendor confirmed dispatch — track to follow rider."
            priority="info"
            timestamp="just now"
          />
          <SignalCard
            kicker="Wallet"
            title="Funding under review"
            body="Finance is checking your transfer proof. Typical clearance is two business hours."
            priority="warning"
            timestamp="20 min ago"
          />
          <SignalCard
            kicker="Property"
            title="Listing flagged for review"
            body="A reviewer asked for clearer photos before publish."
            priority="urgent"
            accent="#C04A1F"
            timestamp="1h"
          />
          <SignalCard
            kicker="Security"
            title="Sign-in from a new device"
            body="If this wasn't you, lock your account from /security right away."
            priority="security"
            accent="#B91C1C"
            timestamp="2 min"
            action={{ label: "Review", tone: "accent" }}
          />
        </div>
      </Section>

      <Section
        kicker="05"
        headline="EmptyState — typographic only"
        description="No illustration, no cartoon, no apology copy."
      >
        <Panel tone="flat">
          <EmptyState
            kicker="Disputes"
            headline="No open disputes."
            body="When you raise an issue with an order, the thread lives here with status updates from the support stage — nothing falls off the trail."
            action={<ActionButton tone="primary">Open a dispute</ActionButton>}
          />
        </Panel>
      </Section>

      <Section
        kicker="06"
        headline="LoadingSkeleton — five variants"
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
          <LoadingSkeleton variant="metric" />
          <LoadingSkeleton variant="signal" />
          <LoadingSkeleton variant="card" lines={4} />
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <LoadingSkeleton variant="avatar" />
            <div style={{ flex: 1 }}>
              <LoadingSkeleton variant="line" width="60%" />
              <div style={{ height: "0.5rem" }} />
              <LoadingSkeleton variant="line" width="40%" />
            </div>
          </div>
        </div>
      </Section>

      <Section
        kicker="07"
        headline="ActionButton — five states"
        description="idle / pending (in form context) / disabled / spinner / success-lock"
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <ActionButton tone="primary">Idle</ActionButton>
          <ActionButton tone="primary" spinner>Spinner</ActionButton>
          <ActionButton tone="primary" disabled>Disabled</ActionButton>
          <ActionButton tone="primary" success>Success-lock</ActionButton>
          <ActionButton tone="secondary">Secondary</ActionButton>
          <ActionButton tone="ghost">Ghost</ActionButton>
          <ActionButton tone="primary" href="/security">As link</ActionButton>
        </div>
      </Section>

      <Section
        kicker="08"
        headline="QuickLink"
      >
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <QuickLink
            href="/wallet"
            label="Wallet"
            kicker="Account"
            icon={<Wallet size={16} />}
            meta="₦45,200"
          />
          <QuickLink
            href="/notifications"
            label="Notifications"
            icon={<Bell size={16} />}
            meta="3 new"
            tone="accent"
          />
        </div>
      </Section>

      <Section
        kicker="09"
        headline="ErrorBoundary"
        description="Wrap a render to capture render-time exceptions."
      >
        <ErrorBoundary label="Diagnostic frame">
          <Panel tone="flat">
            <p>This child renders successfully — no error to catch. Click reload below to verify the boundary&apos;s UI when triggered.</p>
          </Panel>
        </ErrorBoundary>
      </Section>
    </div>
  );
}
