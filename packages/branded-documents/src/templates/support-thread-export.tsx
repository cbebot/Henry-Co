import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { BrandedDocument } from "../components/BrandedDocument";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { LegalFooter } from "../components/SignatureBlock";
import { formatDateTime, statusToLabel, titleCase } from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

export type SupportMessage = {
  id: string;
  senderType: "customer" | "agent" | "system";
  senderName: string;
  body: string;
  createdAt: string;
  attachments?: Array<{ name: string; mimeType?: string | null }>;
};

export type SupportThreadExportProps = {
  thread: {
    id: string;
    referenceNo: string;
    subject: string;
    division: string | null;
    status: string;
    openedAt: string;
    lastUpdatedAt: string;
  };
  customer: { name: string; email?: string | null };
  messages: SupportMessage[];
};

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: "row", marginTop: 12 },
  bubbleRowAgent: { flexDirection: "row-reverse", marginTop: 12 },
  bubble: {
    flex: 0,
    maxWidth: "78%",
    padding: 10,
    borderRadius: 8,
    backgroundColor: palette.paperElev,
  },
  bubbleAgent: {
    flex: 0,
    maxWidth: "78%",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F8E9C0",
  },
  bubbleSystem: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: palette.lineSoft,
    borderLeftWidth: 2,
    borderLeftColor: palette.copperDeep,
  },
  meta: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: palette.inkMuted,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
    fontWeight: 700,
    marginBottom: 4,
  },
  body: {
    fontSize: typeScale.body,
    fontFamily: "HenryCoSans",
    color: palette.ink,
    lineHeight: 1.5,
  },
  attachmentLabel: {
    marginTop: 6,
    fontSize: typeScale.caption,
    fontFamily: "HenryCoMono",
    color: palette.inkMuted,
  },
});

export function SupportThreadExportDocument({ thread, customer, messages }: SupportThreadExportProps) {
  return (
    <BrandedDocument
      metadata={{
        title: `Support thread ${thread.referenceNo}`,
        subject: thread.subject,
        keywords: ["support", thread.division ?? "", thread.referenceNo],
      }}
      header={{
        documentType: "Support thread",
        title: thread.subject || thread.referenceNo,
        subtitle: `${thread.referenceNo} · ${statusToLabel(thread.status)}`,
        meta: [
          { label: "Opened", value: formatDateTime(thread.openedAt) },
          { label: "Updated", value: formatDateTime(thread.lastUpdatedAt) },
        ],
        divisionLabel: titleCase(thread.division ?? "Support"),
      }}
      division={thread.division ?? "hub"}
    >
      <DocumentSection kicker="Customer" tone="elevated">
        <DefinitionList
          rows={[
            { label: "Name", value: customer.name },
            { label: "Email", value: customer.email ?? "—" },
            { label: "Reference", value: thread.referenceNo, mono: true },
            { label: "Division", value: titleCase(thread.division ?? "—") },
            { label: "Status", value: statusToLabel(thread.status) },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker="Conversation">
        {messages.length === 0 ? (
          <Text style={{ fontSize: typeScale.body, fontFamily: "HenryCoSans", color: palette.inkMuted }}>
            No messages on file for this thread.
          </Text>
        ) : (
          messages.map((m) => {
            if (m.senderType === "system") {
              return (
                <View key={m.id} style={styles.bubbleSystem} wrap={false}>
                  <Text style={styles.meta}>System · {formatDateTime(m.createdAt)}</Text>
                  <Text style={styles.body}>{m.body}</Text>
                </View>
              );
            }
            const isAgent = m.senderType === "agent";
            return (
              <View key={m.id} style={isAgent ? styles.bubbleRowAgent : styles.bubbleRow} wrap={false}>
                <View style={isAgent ? styles.bubbleAgent : styles.bubble}>
                  <Text style={styles.meta}>{m.senderName} · {formatDateTime(m.createdAt)}</Text>
                  <Text style={styles.body}>{m.body}</Text>
                  {m.attachments && m.attachments.length > 0 ? (
                    <View>
                      {m.attachments.map((a) => (
                        <Text key={a.name} style={styles.attachmentLabel}>
                          {a.name} {a.mimeType ? `(${a.mimeType})` : ""}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </DocumentSection>

      <LegalFooter
        lines={[
          "Attachment file content is intentionally not embedded in this export — only the file name and MIME type are listed. Use HenryCo support to retrieve the original files.",
          "This is a snapshot of the thread at export time. Subsequent replies will not appear here; re-export the thread for the latest record.",
        ]}
      />
    </BrandedDocument>
  );
}
