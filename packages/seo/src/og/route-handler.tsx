import type { DivisionKey } from "@henryco/config";
import { DefaultOgTemplate } from "./template";
import { renderDefaultOgImage } from "./render";

type Resolver<T> = T | ((params: Record<string, string>) => T | Promise<T>);

async function resolve<T>(value: Resolver<T> | undefined, params: Record<string, string>): Promise<T | undefined> {
  if (typeof value === "function") {
    return await (value as (p: Record<string, string>) => Promise<T> | T)(params);
  }
  return value as T | undefined;
}

export type CreateOgRouteHandlerOptions = {
  divisionKey: DivisionKey;
  title?: Resolver<string>;
  subtitle?: Resolver<string>;
  eyebrow?: Resolver<string>;
};

export function createOgRouteHandler(opts: CreateOgRouteHandlerOptions) {
  return async function GET(
    _req: Request,
    ctx: { params: Promise<Record<string, string>> | Record<string, string> }
  ): Promise<Response> {
    const params = ctx?.params instanceof Promise ? await ctx.params : ctx?.params ?? {};
    const [title, subtitle, eyebrow] = await Promise.all([
      resolve(opts.title, params),
      resolve(opts.subtitle, params),
      resolve(opts.eyebrow, params),
    ]);
    // Delegate to the shared renderer so this path ALSO loads the self-hosted
    // brand serif (previously it built its own fonts-less ImageResponse and
    // rendered in Satori's default sans).
    return renderDefaultOgImage(
      <DefaultOgTemplate
        divisionKey={opts.divisionKey}
        title={title}
        subtitle={subtitle}
        eyebrow={eyebrow}
      />
    );
  };
}
