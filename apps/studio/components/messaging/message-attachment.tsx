"use client";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType2,
  ImageIcon,
  Paperclip,
} from "lucide-react";
import type { MessageAttachment } from "@/lib/messaging/types";
import { formatAttachmentSize } from "@/lib/messaging/utils";

type Props = {
  attachment: MessageAttachment;
  /** When true, the attachment is rendered in the bubble's tone. */
  ownTone?: boolean;
};

/**
 * Inline attachment renderer. Image attachments show a thumbnail with
 * lazy loading; other types show a typed file chip with size and a
 * download affordance. Tap to open the original in a new tab.
 */
export function MessageAttachmentView({ attachment, ownTone }: Props) {
  if (attachment.kind === "image") {
    return <ImageAttachment attachment={attachment} ownTone={ownTone} />;
  }
  return <FileAttachment attachment={attachment} ownTone={ownTone} />;
}

function ImageAttachment({ attachment, ownTone }: Props) {
  const [loaded, setLoaded] = useState(false);
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0E1A]"
      aria-label={`Open image ${attachment.label} in a new tab`}
    >
      <div className="relative">
        {!loaded ? (
          <div
            className="flex h-44 w-full items-center justify-center bg-white/[0.03]"
            aria-hidden
          >
            <ImageIcon className="h-6 w-6 text-white/30" />
          </div>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.label}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`block max-h-[420px] w-full object-cover transition-opacity duration-200 ${
            loaded ? "opacity-100" : "opacity-0 absolute inset-0"
          }`}
        />
      </div>
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 text-[11px] ${
          ownTone ? "text-[#F5F4EE]/80" : "text-white/55"
        }`}
      >
        <span className="truncate" title={attachment.label}>
          {attachment.label}
        </span>
        {attachment.size ? (
          <span className="tabular-nums">
            {formatAttachmentSize(attachment.size)}
          </span>
        ) : null}
      </div>
    </a>
  );
}

function FileAttachment({ attachment, ownTone }: Props) {
  const containerToneCls = ownTone
    ? "border-white/[0.18] bg-white/[0.06] hover:bg-white/[0.10]"
    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]";
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex max-w-[320px] items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors ${containerToneCls}`}
      aria-label={`Download ${attachment.label}`}
      download={attachment.label}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          ownTone
            ? "bg-[#d4b14e]/25 text-[#F5F4EE]"
            : "bg-[#d4b14e]/15 text-[#d4b14e]"
        }`}
      >
        {renderAttachmentIcon(attachment)}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={`truncate text-[13px] font-medium leading-tight ${
            ownTone ? "text-[#F5F4EE]" : "text-white/90"
          }`}
          title={attachment.label}
        >
          {attachment.label}
        </div>
        <div
          className={`mt-0.5 flex items-center gap-1.5 text-[11px] ${
            ownTone ? "text-[#F5F4EE]/65" : "text-white/45"
          }`}
        >
          <span className="uppercase tracking-[0.06em]">
            {labelFor(attachment)}
          </span>
          {attachment.size ? (
            <>
              <span aria-hidden>·</span>
              <span className="tabular-nums">
                {formatAttachmentSize(attachment.size)}
              </span>
            </>
          ) : null}
        </div>
      </div>
      <Download
        className={`h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${
          ownTone ? "text-[#F5F4EE]/80" : "text-white/55"
        }`}
        aria-hidden
      />
    </a>
  );
}

const ATTACHMENT_ICON_CLS = "h-5 w-5";

function renderAttachmentIcon(attachment: MessageAttachment) {
  switch (attachment.kind) {
    case "image":
      return <ImageIcon className={ATTACHMENT_ICON_CLS} aria-hidden />;
    case "pdf":
      return <FileText className={ATTACHMENT_ICON_CLS} aria-hidden />;
    case "doc":
      return <FileSpreadsheet className={ATTACHMENT_ICON_CLS} aria-hidden />;
    case "video":
      return <FileType2 className={ATTACHMENT_ICON_CLS} aria-hidden />;
    default:
      return <Paperclip className={ATTACHMENT_ICON_CLS} aria-hidden />;
  }
}

function labelFor(attachment: MessageAttachment) {
  switch (attachment.kind) {
    case "image":
      return "Image";
    case "pdf":
      return "PDF";
    case "doc":
      return "Document";
    case "video":
      return "Video";
    default:
      return "File";
  }
}
