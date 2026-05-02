import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export type HenryCoAnalyticsProps = {
  gaMeasurementId?: string;
};

export function HenryCoAnalytics({ gaMeasurementId }: HenryCoAnalyticsProps = {}) {
  const vercelEnabled = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS !== "0";
  const ga = gaMeasurementId ?? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <>
      {vercelEnabled ? <Analytics /> : null}
      {vercelEnabled ? <SpeedInsights /> : null}
      {ga && isProduction ? (
        <>
          <Script
            id="ga-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`}
          />
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${ga.replace(/'/g, "")}', { anonymize_ip: true });`,
            }}
          />
        </>
      ) : null}
    </>
  );
}
