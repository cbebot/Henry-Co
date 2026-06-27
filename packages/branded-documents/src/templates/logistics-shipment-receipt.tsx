import * as React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { getBrandedDocumentsCopy, type AppLocale } from "@henryco/i18n";

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
  locale?: AppLocale;
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
  locale = "en",
}: LogisticsShipmentReceiptProps) {
  const t = getBrandedDocumentsCopy(locale).logisticsReceipt;
  const columns: Array<DataTableColumn<LogisticsShipmentReceiptItem>> = [
    {
      key: "label",
      header: t.columnLineItem,
      flex: 3,
      render: (r) => r.label + (r.detail ? ` — ${r.detail}` : ""),
    },
    {
      key: "amount",
      header: t.columnAmount,
      flex: 1.4,
      align: "right",
      mono: true,
      render: (r) => formatKobo(r.amountKobo, shipment.currency),
    },
  ];

  return (
    <BrandedDocument
      locale={locale}
      metadata={{
        title: `Shipment receipt ${shipment.trackingCode}`,
        subject: t.subject,
        keywords: ["logistics", "shipment", "henryco", shipment.trackingCode],
      }}
      header={{
        documentType: t.documentType,
        title: shipment.trackingCode,
        subtitle: `${titleCase(shipment.serviceType)} · ${statusToLabel(shipment.status)}`,
        meta: [
          { label: t.metaBooked, value: formatDateTime(shipment.bookedAt) },
          {
            label: t.metaScheduled,
            value: shipment.scheduledPickupAt
              ? formatDateTime(shipment.scheduledPickupAt)
              : "—",
          },
          { label: t.metaStatus, value: statusToLabel(shipment.status) },
        ],
        divisionLabel: t.divisionLabel,
      }}
      division="logistics"
    >
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>{t.amountPaid}</Text>
        <Text style={styles.bannerValue}>
          {formatKobo(shipment.amountPaidKobo, shipment.currency)}
        </Text>
      </View>

      <DocumentSection kicker={t.sectionCustomer} tone="elevated">
        <DefinitionList
          rows={[
            { label: t.rowName, value: customer.name },
            { label: t.rowEmail, value: customer.email ?? "—" },
            { label: t.rowPhone, value: customer.phone ?? "—" },
            { label: t.rowTrackingCode, value: shipment.trackingCode, mono: true },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker={t.sectionPickup}>
        <Text style={styles.addressBlock}>
          {formatAddressLines(pickupAddress).join("\n")}
        </Text>
      </DocumentSection>

      <DocumentSection kicker={t.sectionDropoff}>
        <Text style={styles.addressBlock}>
          {formatAddressLines(dropoffAddress).join("\n")}
        </Text>
      </DocumentSection>

      <DocumentSection kicker={t.sectionParcelService}>
        <DefinitionList
          rows={[
            { label: t.rowService, value: titleCase(shipment.serviceType) },
            { label: t.rowUrgency, value: titleCase(shipment.urgency) },
            { label: t.rowParcel, value: shipment.parcelType },
            {
              label: t.rowDescription,
              value: shipment.parcelDescription ?? "—",
            },
            {
              label: t.rowWeight,
              value: shipment.weightKg ? t.weightUnit(shipment.weightKg) : "—",
            },
            { label: t.rowSizeTier, value: titleCase(shipment.sizeTier) },
            {
              label: t.rowCorridor,
              value: shipment.zoneLabel ?? "—",
            },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker={t.sectionPricing}>
        <DataTable
          columns={columns}
          rows={pricingItems}
          striped
          emptyMessage={t.emptyPricing}
        />
      </DocumentSection>

      <DocumentSection kicker={t.sectionSettlement}>
        <DefinitionList
          rows={[
            {
              label: t.rowQuoted,
              value: formatKobo(shipment.amountQuotedKobo, shipment.currency),
              mono: true,
            },
            {
              label: t.rowPaid,
              value: formatKobo(shipment.amountPaidKobo, shipment.currency),
              mono: true,
            },
            {
              label: t.rowMethod,
              value: shipment.paymentMethod
                ? titleCase(shipment.paymentMethod)
                : "—",
            },
            {
              label: t.rowReference,
              value: shipment.paymentReference ?? "—",
              mono: true,
            },
            { label: t.rowStatus, value: statusToLabel(shipment.status) },
          ]}
        />
      </DocumentSection>

      {proofOfDelivery ? (
        <DocumentSection kicker={t.sectionProof} tone="elevated">
          <DefinitionList
            rows={[
              { label: t.rowRecipient, value: proofOfDelivery.recipientName },
              {
                label: t.rowDelivered,
                value: formatDateTime(proofOfDelivery.deliveredAt),
              },
              { label: t.rowType, value: titleCase(proofOfDelivery.proofType) },
              { label: t.rowNote, value: proofOfDelivery.note ?? "—" },
            ]}
          />
        </DocumentSection>
      ) : null}

      <LegalFooter lines={[t.legalLine1, t.legalLine2]} />
    </BrandedDocument>
  );
}
