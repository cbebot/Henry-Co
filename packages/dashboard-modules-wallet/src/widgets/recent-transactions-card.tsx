import {
  Panel,
  Section,
  ActionButton,
  EmptyState,
} from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { typeStyle, monoStyle } from "@henryco/dashboard-shell/tokens";
import { ArrowDownLeft, ArrowUpRight, Download, Wallet } from "lucide-react";
import { formatNaira, formatTransactionLabel, timeAgo } from "../format";
import type { WalletSnapshot } from "../data";

/**
 * RecentTransactionsCard — last 5 wallet transactions with an inline
 * "Download statement" action that triggers the V2-DOCS-01 unified
 * branded-documents endpoint. Empty state surfaces when the wallet
 * has no activity yet.
 *
 * Statement download URL: `/api/documents/wallet-statement/<userId>?download=1`
 * served by `apps/account/app/api/documents/[type]/[id]/route.ts:217-287`
 * (TransactionHistoryDocument template scoped to division="wallet").
 */
export function RecentTransactionsCard({
  snapshot,
  userId,
}: {
  snapshot: WalletSnapshot;
  userId: string;
}) {
  const transactions = snapshot.recentTransactions;

  if (transactions.length === 0) {
    return (
      <Panel tone="flat">
        <EmptyState
          kicker="Transaction history"
          headline="Nothing to show yet."
          body="Your wallet activity surfaces here once you fund the wallet or pay across HenryCo."
          action={
            <ActionButton href="/wallet/funding" tone="primary">
              Add money
            </ActionButton>
          }
        />
      </Panel>
    );
  }

  return (
    <Panel tone="raised">
      <Section
        kicker="Recent activity"
        headline="Last 5 transactions"
        action={
          <ActionButton
            href={`/api/documents/wallet-statement/${userId}?download=1`}
            tone="secondary"
            icon={<Download size={16} aria-hidden />}
          >
            Download statement
          </ActionButton>
        }
      >
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {transactions.map((tx) => {
            const isCredit = tx.direction === "credit";
            const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
            const sign = isCredit ? "+" : "−";
            return (
              <li
                key={tx.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem 0",
                  borderTop: `1px solid var(${CSS_VARS.hairline})`,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "999px",
                    backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                    color: `var(${
                      isCredit ? CSS_VARS.accentText : CSS_VARS.inkMuted
                    })`,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      ...typeStyle("bodyStrong"),
                      color: `var(${CSS_VARS.ink})`,
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatTransactionLabel({
                      description: tx.description,
                      type: tx.type,
                    })}
                  </p>
                  <p
                    style={{
                      ...typeStyle("small"),
                      color: `var(${CSS_VARS.inkSoft})`,
                      margin: 0,
                    }}
                  >
                    {tx.division
                      ? `${tx.division.charAt(0).toUpperCase()}${tx.division.slice(1)} · `
                      : ""}
                    {timeAgo(tx.createdAt)}
                  </p>
                </div>
                <p
                  style={{
                    ...typeStyle("bodyStrong"),
                    ...monoStyle(),
                    margin: 0,
                    color: isCredit
                      ? `var(${CSS_VARS.accentText})`
                      : `var(${CSS_VARS.ink})`,
                    flexShrink: 0,
                  }}
                >
                  {sign}
                  {formatNaira(tx.amountKobo)}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "0.75rem",
        }}
      >
        <ActionButton href="/wallet" tone="ghost" icon={<Wallet size={16} aria-hidden />}>
          View full history
        </ActionButton>
      </div>
    </Panel>
  );
}
