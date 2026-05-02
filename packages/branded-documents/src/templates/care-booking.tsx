import * as React from "react";
import { Text } from "@react-pdf/renderer";

import { BrandedDocument } from "../components/BrandedDocument";
import { DocumentSection, DefinitionList } from "../components/DocumentSection";
import { LegalFooter, SignatureBlock } from "../components/SignatureBlock";
import { formatDateTime, formatKobo, statusToLabel, titleCase } from "../format";
import { palette, typeScale } from "../tokens";

export type CareBookingProps = {
  booking: {
    id: string;
    referenceNo: string;
    serviceCode: string;
    serviceTitle: string;
    status: string;
    bookedAt: string;
    scheduledFor: string;
    completedAt?: string | null;
    addressLines: string[];
    pickupNotes?: string | null;
    handlingNotes?: string | null;
    estimatedTotalKobo: number;
    paidKobo?: number | null;
    currency: string;
  };
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  technician?: {
    name: string;
    role: string;
    contactLine?: string | null;
  } | null;
  itemisation: Array<{ id: string; label: string; quantity?: number | null; note?: string | null }>;
};

export function CareBookingDocument({ booking, customer, technician, itemisation }: CareBookingProps) {
  return (
    <BrandedDocument
      metadata={{
        title: `Care booking ${booking.referenceNo}`,
        subject: "HenryCo Care booking confirmation",
        keywords: ["care", "booking", "henryco", booking.referenceNo],
      }}
      header={{
        documentType: "Booking confirmation",
        title: booking.referenceNo,
        subtitle: `${booking.serviceTitle} · ${statusToLabel(booking.status)}`,
        meta: [
          { label: "Booked", value: formatDateTime(booking.bookedAt) },
          { label: "Scheduled", value: formatDateTime(booking.scheduledFor) },
          { label: "Status", value: statusToLabel(booking.status) },
        ],
        divisionLabel: "Fabric Care",
      }}
      division="care"
    >
      <DocumentSection kicker="Customer" tone="elevated">
        <DefinitionList
          rows={[
            { label: "Name", value: customer.name },
            { label: "Email", value: customer.email ?? "—" },
            { label: "Phone", value: customer.phone ?? "—" },
            { label: "Address", value: booking.addressLines.join(", ") },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker="Service">
        <DefinitionList
          rows={[
            { label: "Service code", value: booking.serviceCode, mono: true },
            { label: "Service", value: booking.serviceTitle },
            { label: "Pickup notes", value: booking.pickupNotes ?? "—" },
            { label: "Handling notes", value: booking.handlingNotes ?? "—" },
            {
              label: "Estimated total",
              value: formatKobo(booking.estimatedTotalKobo, booking.currency),
              mono: true,
            },
            {
              label: "Paid",
              value: booking.paidKobo != null ? formatKobo(booking.paidKobo, booking.currency) : "—",
              mono: true,
            },
            {
              label: "Completed",
              value: booking.completedAt ? formatDateTime(booking.completedAt) : "—",
            },
          ]}
        />
      </DocumentSection>

      <DocumentSection kicker="Itemisation">
        {itemisation.length === 0 ? (
          <Text style={{ fontSize: typeScale.body, color: palette.inkMuted, fontFamily: "HenryCoSans" }}>
            No itemisation recorded yet — your technician will confirm at pickup.
          </Text>
        ) : (
          <DefinitionList
            rows={itemisation.map((row) => ({
              label: titleCase(row.label),
              value: [row.quantity ? `× ${row.quantity}` : null, row.note].filter(Boolean).join(" · ") || "—",
            }))}
          />
        )}
      </DocumentSection>

      {technician ? (
        <SignatureBlock
          signatoryName={technician.name}
          signatoryRole={technician.role}
          signedAt={booking.completedAt ?? booking.scheduledFor}
        />
      ) : null}

      <LegalFooter
        lines={[
          "HenryCo Care service guarantee: any garment returned not to specification will be re-cleaned at no extra charge within 5 days of completion.",
          "This document is your booking record. Pricing is confirmed at intake; the receipt issued after completion is the canonical billing record.",
        ]}
      />
    </BrandedDocument>
  );
}
