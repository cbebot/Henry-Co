"use client";

import { FpjsProvider, useVisitorData } from "@fingerprintjs/fingerprintjs-pro-react";
import { getPublicFingerprintConfig, getPublicOneSignalConfig } from "@henryco/config";
import Script from "next/script";
import { useEffect, useState, type ReactNode } from "react";
import {
  consentAllowsAnalytics,
  consentAllowsMarketing,
  HENRYCO_CONSENT_STORAGE_KEY,
  HENRYCO_CONSENT_UPDATED_EVENT,
  readStoredHenryCoConsent,
  type HenryCoConsentState,
} from "../public/consent-state";

function OneSignalRuntimeScripts({ enabled }: { enabled: boolean }) {
  const { appId, safariWebId, enabled: sdkEnabled } = getPublicOneSignalConfig();
  if (!enabled || !sdkEnabled) return null;

  const config = JSON.stringify({
    appId,
    ...(safariWebId ? { safari_web_id: safariWebId } : {}),
    notifyButton: { enable: true },
  });

  return (
    <>
      <Script
        id="henryco-onesignal-sdk"
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />
      <Script id="henryco-onesignal-init" strategy="afterInteractive">
        {`
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          window.OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init(${config});
          });
        `}
      </Script>
    </>
  );
}

export function ThirdPartyRuntimeProviders({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<HenryCoConsentState | null>(null);
  const fingerprint = getPublicFingerprintConfig();

  useEffect(() => {
    const syncConsent = () => {
      setConsent(readStoredHenryCoConsent());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== HENRYCO_CONSENT_STORAGE_KEY) return;
      syncConsent();
    };

    syncConsent();
    window.addEventListener(HENRYCO_CONSENT_UPDATED_EVENT, syncConsent);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(HENRYCO_CONSENT_UPDATED_EVENT, syncConsent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const analyticsEnabled = consentAllowsAnalytics(consent);
  const marketingEnabled = consentAllowsMarketing(consent);
  const content = (
    <>
      {children}
      <OneSignalRuntimeScripts enabled={marketingEnabled} />
    </>
  );

  if (!analyticsEnabled || !fingerprint.apiKey) {
    return content;
  }

  return (
    <FpjsProvider
      loadOptions={{
        apiKey: fingerprint.apiKey,
        region: fingerprint.region,
      }}
    >
      {content}
    </FpjsProvider>
  );
}

export function useHenryCoVisitorData(
  getOptions?: Parameters<typeof useVisitorData>[0],
  config?: Parameters<typeof useVisitorData>[1]
) {
  return useVisitorData(getOptions, config);
}
