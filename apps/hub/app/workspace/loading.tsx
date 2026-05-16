import { getHubWorkspaceCopy } from "@henryco/i18n/server";
import GlobalLoader from "../components/GlobalLoader";
import { getHubPublicLocale } from "../../lib/locale-server";

export default async function Loading() {
  const locale = await getHubPublicLocale();
  const copy = getHubWorkspaceCopy(locale);
  return (
    <GlobalLoader
      title={copy.loader.title}
      subtitle={copy.loader.subtitle}
      statusLabel={copy.loader.statusLabel}
      accent="#0E7C86"
    />
  );
}
