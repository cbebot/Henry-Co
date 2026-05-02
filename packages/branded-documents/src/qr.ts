import "server-only";

import QRCode from "qrcode";

export async function buildVerificationQr(url: string, opts?: { size?: number }): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "Q",
    margin: 1,
    width: opts?.size ?? 240,
    color: {
      dark: "#1A1814",
      light: "#FBF7EE",
    },
  });
}
