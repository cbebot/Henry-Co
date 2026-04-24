import type {
  NewsletterCampaignClass,
  NewsletterCampaignContent,
  NewsletterDivision,
  NewsletterTopicDefinition,
} from "./types";
import { runVoiceGuard, summarizeVoiceWarnings, type VoiceGuardResult } from "./voice";

export type AiAssistRole = "subject" | "preview" | "headline" | "body" | "cta" | "rewrite_friendly" | "rewrite_concise";

export type DraftSkeletonInput = {
  division: NewsletterDivision;
  campaignClass: NewsletterCampaignClass;
  topic: NewsletterTopicDefinition | null;
  angle: string;
  audienceDescription: string;
  primaryCta: { label: string; href: string } | null;
  secondaryCta: { label: string; href: string } | null;
  factsToInclude: string[];
  authorName: string | null;
};

function sentenceCase(input: string): string {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}

function friendlyDivisionTitle(division: NewsletterDivision): string {
  if (division === "hub") return "HenryCo";
  return `HenryCo ${division.charAt(0).toUpperCase()}${division.slice(1)}`;
}

export function buildDraftSkeleton(input: DraftSkeletonInput): NewsletterCampaignContent {
  const divisionTitle = friendlyDivisionTitle(input.division);
  const topicLabel = input.topic?.label ?? `${divisionTitle} update`;

  const subject = input.angle
    ? `${topicLabel}: ${sentenceCase(input.angle)}`
    : `${topicLabel}`;

  const previewText = input.angle
    ? `A short note from ${divisionTitle} on ${input.angle.toLowerCase()} — only what's useful.`
    : `A short ${topicLabel.toLowerCase()} from ${divisionTitle}.`;

  const headline = sentenceCase(input.angle || topicLabel);

  const bodyBlocks: NewsletterCampaignContent["bodyBlocks"] = [
    {
      kind: "paragraph",
      text:
        input.authorName && input.authorName.trim()
          ? `Hey — quick note from ${input.authorName.trim()} at ${divisionTitle}. Keeping this short.`
          : `Quick note from ${divisionTitle} — keeping this short and useful.`,
    },
  ];

  if (input.factsToInclude.length > 0) {
    bodyBlocks.push({ kind: "heading", text: "What's new" });
    for (const fact of input.factsToInclude.slice(0, 4)) {
      bodyBlocks.push({ kind: "paragraph", text: `• ${fact}` });
    }
  } else {
    bodyBlocks.push({
      kind: "paragraph",
      text: "Replace this paragraph with 1–3 concrete facts. Keep claims specific and true.",
    });
  }

  if (input.primaryCta) {
    bodyBlocks.push({
      kind: "cta",
      text: input.primaryCta.label,
      href: input.primaryCta.href,
      variant: "primary",
    });
  }

  if (input.secondaryCta) {
    bodyBlocks.push({
      kind: "cta",
      text: input.secondaryCta.label,
      href: input.secondaryCta.href,
      variant: "secondary",
    });
  }

  bodyBlocks.push({
    kind: "paragraph",
    text:
      "If this isn't useful, change your email preferences any time — we'd rather send less and have it matter.",
  });

  const footerNote =
    "You're getting this because you asked to hear from " +
    divisionTitle +
    ". Manage preferences or unsubscribe any time.";

  return {
    subject,
    previewText,
    headline,
    bodyBlocks,
    footerNote,
    ctaPrimary: input.primaryCta,
    ctaSecondary: input.secondaryCta,
  };
}

export type AiAssistRequest = {
  role: AiAssistRole;
  skeleton: NewsletterCampaignContent;
  brief: string;
  campaignClass: NewsletterCampaignClass;
};

export type AiAssistResponse = {
  content: NewsletterCampaignContent;
  modelHint: string;
  notes: string[];
};

export type AiAssistInvoker = (request: AiAssistRequest) => Promise<AiAssistResponse>;

export type RefineDraftInput = {
  skeleton: NewsletterCampaignContent;
  brief: string;
  campaignClass: NewsletterCampaignClass;
  invoker?: AiAssistInvoker;
};

export type RefinedDraft = {
  content: NewsletterCampaignContent;
  voice: VoiceGuardResult;
  warningsText: string[];
  usedAi: boolean;
  modelHint: string | null;
};

function autoConcise(content: NewsletterCampaignContent): NewsletterCampaignContent {
  const subject =
    content.subject.length > 78 ? `${content.subject.slice(0, 75).trimEnd()}…` : content.subject;
  const previewText =
    content.previewText.length > 110
      ? `${content.previewText.slice(0, 107).trimEnd()}…`
      : content.previewText;

  const bodyBlocks = content.bodyBlocks.map((block) => {
    if (!block.text) return block;
    const trimmed = block.text.replace(/\s+/g, " ").trim();
    if (trimmed.length <= 280) return { ...block, text: trimmed };
    return { ...block, text: `${trimmed.slice(0, 270).trimEnd()}…` };
  });

  return { ...content, subject, previewText, bodyBlocks };
}

export async function refineDraft(input: RefineDraftInput): Promise<RefinedDraft> {
  let content = input.skeleton;
  let usedAi = false;
  let modelHint: string | null = null;

  if (input.invoker) {
    try {
      const assisted = await input.invoker({
        role: "rewrite_friendly",
        skeleton: input.skeleton,
        brief: input.brief,
        campaignClass: input.campaignClass,
      });
      content = assisted.content;
      usedAi = true;
      modelHint = assisted.modelHint;
    } catch (err) {
      console.warn("[newsletter/draft] AI assist failed, falling back to skeleton:", err);
    }
  } else {
    content = autoConcise(input.skeleton);
  }

  const voice = runVoiceGuard({ content, campaignClass: input.campaignClass });
  return {
    content,
    voice,
    warningsText: summarizeVoiceWarnings(voice.warnings),
    usedAi,
    modelHint,
  };
}

export function renderDraftAsHtml(content: NewsletterCampaignContent): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const blocksHtml = content.bodyBlocks
    .map((block) => {
      const text = block.text ? escape(block.text) : "";
      switch (block.kind) {
        case "heading":
          return `<h2 style="font-family:Inter,system-ui,sans-serif;font-weight:600;font-size:18px;margin:24px 0 8px;color:#111;">${text}</h2>`;
        case "callout":
          return `<div style="background:#f7f3eb;border-left:3px solid #C9A227;padding:12px 16px;margin:16px 0;font-family:Inter,system-ui,sans-serif;color:#333;">${text}</div>`;
        case "cta":
          if (!block.href) {
            return `<p style="margin:16px 0;font-family:Inter,system-ui,sans-serif;color:#111;">${text}</p>`;
          }
          return `<p style="margin:16px 0;"><a href="${escape(
            block.href
          )}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-family:Inter,system-ui,sans-serif;font-weight:500;">${text}</a></p>`;
        case "divider":
          return `<hr style="border:none;border-top:1px solid #e6e2d8;margin:24px 0;" />`;
        case "paragraph":
        default:
          return `<p style="margin:12px 0;font-family:Inter,system-ui,sans-serif;color:#333;line-height:1.55;">${text}</p>`;
      }
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escape(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#faf7f1;">
<div style="max-width:600px;margin:0 auto;padding:32px 20px;">
  <div style="font-family:Inter,system-ui,sans-serif;color:#888;font-size:12px;letter-spacing:.4px;text-transform:uppercase;">HENRY &amp; CO.</div>
  <h1 style="font-family:Inter,system-ui,sans-serif;font-weight:600;font-size:24px;margin:12px 0 4px;color:#111;">${escape(
    content.headline
  )}</h1>
  <div style="font-family:Inter,system-ui,sans-serif;color:#888;font-size:13px;margin-bottom:12px;">${escape(
    content.previewText
  )}</div>
  ${blocksHtml}
  ${
    content.footerNote
      ? `<p style="margin:32px 0 0;font-family:Inter,system-ui,sans-serif;color:#888;font-size:12px;">${escape(
          content.footerNote
        )}</p>`
      : ""
  }
  <p style="margin:12px 0 0;font-family:Inter,system-ui,sans-serif;color:#888;font-size:12px;">
    <a href="{{preferences_url}}" style="color:#666;text-decoration:underline;">Manage preferences</a>
    &nbsp;·&nbsp;
    <a href="{{unsubscribe_url}}" style="color:#666;text-decoration:underline;">Unsubscribe</a>
  </p>
</div>
</body>
</html>`;
}

export function estimateReadingTimeSeconds(content: NewsletterCampaignContent): number {
  const allText = [
    content.subject,
    content.previewText,
    content.headline,
    ...content.bodyBlocks.map((b) => b.text ?? ""),
    content.footerNote ?? "",
  ]
    .join(" ")
    .trim();
  const words = allText.split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  return Math.max(15, Math.round((words / 220) * 60));
}
