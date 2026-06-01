import * as React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

import { BrandedDocument } from "../components/BrandedDocument";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { LegalFooter } from "../components/SignatureBlock";
import {
  formatDateTime,
  formatKobo,
  statusToLabel,
  titleCase,
} from "../format";
import { letterSpacing, palette, typeScale } from "../tokens";

/**
 * V3 PASS 21 — LogisticsShipmentReceipt PDF template.
 *
 * Used by the customer-side "Download receipt" CTA on
 * account.henrycogroup.com/logistics and the post-booking confirmation
 * email attachment. Renders:
 *   - Tracking code (the receipt number)
 *   - Booked + scheduled + completed timestamps
 *   - Pickup + dropoff addresses (full — this is the customer's own
 *     record, not the anonymous public lookup)
 *   - Service / urgency / parcel description
 *   - Pricing breakdown rows (base, urgency, weight, size, fragile,
 *     inter-city, manual adjustment) from logistics_shipments.pricing_breakdown
 *   - Amount paid + payment method + reference
 *   - Proof-of-delivery summary when present
 */

export type LogisticsShipmentReceiptItem = {
  id: string;
  label: string;
  detail?: string | null;
  amountKobo: number;
};

export type LogisticsShipmentReceiptProps = {
  shipment: {
    id: string;
    trackingCode: string;
    serviceType: string;
    urgency: string;
    parcelType: string;
    parcelDescription?: string | null;
    weightKg: number;
    sizeTier: string;
    status: string;
    bookedAt: string;
    scheduledPickupAt?: string | null;
    scheduledDeliveryAt?: string | null;
    completedAt?: string | null;
    paymentMethod?: string | null;
    paymentReference?: string | null;
    amountQuotedKobo: number;
    amountPaidKobo: number;
    currency: string;
    zoneLabel?: string | null;
  };
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  pickupAddress: {
    contactName: string;
    line1: string;
    line2?: string | null;
    city: string;
    region: string;
    phone?: string | null;
  };
  dropoffAddress: {
    contactName: string;
    line1: string;
    line2?: string | null;
    city: string;
    region: string;
    phone?: string | null;
  };
  pricingItems: LogisticsShipmentReceiptItem[];
  proofOfDelivery?: {
    recipientName: string;
    deliveredAt: string;
    proofType: string;
    note?: string | null;
  } | null;
};

const styles = StyleSheet.create({
  banner: {
    marginTop: 16,
    backgroundColor: "#D77539",
    color: palette.ink,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerLabel: {
    fontSize: typeScale.hairline,
    fontFamily: "HenryCoSans",
    color: "#1A100A",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.kicker * 6,
  },
  bannerValue: {
    fontSize: typeScale.subhead,
    fontFamily: "HenryCoMono",
    color: "#1A100A",
    fontWeight: 700,
  },
  addressBlock: {
    fontSize: typeScale.body,
    color: palette.ink,
    fontFamily: "HenryCoSans",
    lineHeight: 1.5,
  },
});

function formatAddressLines(address: LogisticsShipmentReceiptProps["pickupAddress"]) {
  return [
    address.contactName,
    address.line1,
    address.line2 ?? null,
    `${address.city}, ${address.region}`,
    address.phone ?? null,
  ].filter((line): line is string => typeof line === "string" && line.length > 0);
}

export function LogisticsShipmentReceiptDocument({
  shipment,
  customer,
  pickupAddress,
  dropoffAddress,
  pricingItems,
  proofOfDelivery,
}: LogisticsShipmentReceiptProps) {
  const columns: Array<DataTableColumn<LogisticsShipmentReceiptItem>> = [
    {
      key: "label",
      header: "Line item",
      flex: 3,
      render: (r) => r.label + (r.detail ? ` — ${r.detail}` : ""),
    },
    {
      key: "amount",
      header: "Amount",
      flex: 1.4,
      align: "right",
      mono: true,
      render: (r) => formatKobo(r.amountKobo, shipment.currency),
    },
  ];

  return (
    <BrandedDocument
      metadata={{
        title: `Shipment receipt ${shipment.trackingCode}`,
        subject: "HenryCo Logistics shipment receipt",
        keywords: ["logistics", "shipment", "henryco", shipment.trackingCode],
      }}
      header={{
        documentType: "Shipment receipt",
        title: shipment.trackingCode,
        subtitle: `${titleCase(shipment.serviceType)} · ${statusToLabel(shipment.status)}`,
        meta: [
          { label: "Booked", value: formatDateTime(shipment.bookedAt) },
          {
            label: "Scheduled",
            value: shipment.scheduledPickupAt
              ? formatDateTime(shipment.scheduledPickupAt)
              : "—",
          },
          { label: "Status", value: statusToLabel(shipment.status) },
        ],
        divisionLabel: "Logistics",
      }}
      division="logistics"
    >
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Amount paid</Text>
        <Text style={styles.bannerValue}>
          {formatKobo(shipment.amountPaidKobo, shipment.currency)}
        </Text>
      </View>

      <DocumentSection kicker="Customer" tone="elevated">
        <DefinitionList
          rows={[
            { label: "Name", value: customer.name },
            { label: "Email", value: customer.email ?? "—" },
            { label: "Phone", value: customer.phone ?? "—" },
            { label: "Tracking code", value: shipment.trackingCode, mono: true },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker="Pickup">
        <Text style={styles.addressBlock}>
          {formatAddressLines(pickupAddress).join("\n")}
        </Text>
      </DocumentSection>

      <DocumentSection kicker="Drop-off">
        <Text style={styles.addressBlock}>
          {formatAddressLines(dropoffAddress).join("\n")}
        </Text>
      </DocumentSection>

      <DocumentSection kicker="Parcel + service">
        <DefinitionList
          rows={[
            { label: "Service", value: titleCase(shipment.serviceType) },
            { label: "Urgency", value: titleCase(shipment.urgency) },
            { label: "Parcel", value: shipment.parcelType },
            {
              label: "Description",
              value: shipment.parcelDescription ?? "—",
            },
            {
              label: "Weight",
              value: shipment.weightKg ? `${shipment.weightKg} kg` : "—",
            },
            { label: "Size tier", value: titleCase(shipment.sizeTier) },
            {
              label: "Corridor",
              value: shipment.zoneLabel ?? "—",
            },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker="Pricing breakdown">
        <DataTable
          columns={columns}
          rows={pricingItems}
          striped
          emptyMessage="No itemised pricing recorded."
        />
      </DocumentSection>

      <DocumentSection kicker="Settlement">
        <DefinitionList
          rows={[
            {
              label: "Quoted",
              value: formatKobo(shipment.amountQuotedKobo, shipment.currency),
              mono: true,
            },
            {
              label: "Paid",
              value: formatKobo(shipment.amountPaidKobo, shipment.currency),
              mono: true,
            },
            {
              label: "Method",
              value: shipment.paymentMethod
                ? titleCase(shipment.paymentMethod)
                : "—",
            },
            {
              label: "Reference",
              value: shipment.paymentReference ?? "—",
              mono: true,
            },
            { label: "Status", value: statusToLabel(shipment.status) },
          ]}
        />
      </DocumentSection>

      {proofOfDelivery ? (
        <DocumentSection kicker="Proof of delivery" tone="elevated">
          <DefinitionList
            rows={[
              { label: "Recipient", value: proofOfDelivery.recipientName },
              {
                label: "Delivered",
                value: formatDateTime(proofOfDelivery.deliveredAt),
              },
              { label: "Type", value: titleCase(proofOfDelivery.proofType) },
              { label: "Note", value: proofOfDelivery.note ?? "—" },
            ]}
          />
        </DocumentSection>
      ) : null}

      <LegalFooter
        lines={[
          "Henry Holdings Limited, through HenryCo Logistics, is the operator of record for this shipment. Insurance, claim windows, and lost-package liability are governed by the HenryCo Logistics service agreement.",
          "If a discrepancy exists between this receipt and the live shipment record, contact logistics support within 7 days for the fastest resolution path.",
        ]}
      />
    </BrandedDocument>
  );
}
