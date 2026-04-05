import { NextResponse } from "next/server";
import {
  getDomainLookupMode,
  isBlockedBrandishSlug,
  lookupComDomainAvailability,
  normalizeFqdnForLookup,
  slugifyDomainLabel,
  suggestProfessionalDomains,
} from "@/lib/studio/domain-intelligence";

export async function POST(request: Request) {
  let body: { query?: string };
  try {
    body = (await request.json()) as { query?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = String(body.query || "").trim();
  if (!raw) {
    return NextResponse.json({ error: "Enter a name or domain" }, { status: 400 });
  }

  const fqdnGuess = normalizeFqdnForLookup(raw.includes(".") ? raw : `${slugifyDomainLabel(raw)}.com`);
  const sld = slugifyDomainLabel(raw);

  if (sld && isBlockedBrandishSlug(sld)) {
    return NextResponse.json({
      mode: getDomainLookupMode(),
      status: "blocked",
      message:
        "That name sits too close to a well-known brand for us to suggest as a new identity. Try a more distinctive name.",
      fqdn: fqdnGuess,
      suggestions: [] as string[],
    });
  }

  const suggestions = suggestProfessionalDomains(raw);
  const mode = getDomainLookupMode();

  if (mode === "off" || !fqdnGuess?.endsWith(".com")) {
    return NextResponse.json({
      mode,
      status: "unconfigured",
      message:
        "Live registry lookup is not turned on for this environment yet. These names are ideas only—HenryCo will confirm availability with you before anything is purchased.",
      fqdn: fqdnGuess || (sld ? `${sld}.com` : null),
      suggestions,
    });
  }

  const available = await lookupComDomainAvailability(fqdnGuess);
  if (available === true) {
    return NextResponse.json({
      mode,
      status: "available",
      message:
        "This .com name does not appear in the public registry directory we checked. Final availability still depends on your registrar at purchase time.",
      fqdn: fqdnGuess,
      suggestions,
    });
  }
  if (available === false) {
    return NextResponse.json({
      mode,
      status: "unavailable",
      message:
        "This .com name already appears registered. Try another name or pick one of the alternatives below.",
      fqdn: fqdnGuess,
      suggestions: suggestions.filter((s) => s.toLowerCase() !== fqdnGuess.toLowerCase()),
    });
  }

  return NextResponse.json({
    mode,
    status: "unknown",
    message:
      "We could not complete a live check right now. Share the name anyway—HenryCo will verify it with you.",
    fqdn: fqdnGuess,
    suggestions,
  });
}
