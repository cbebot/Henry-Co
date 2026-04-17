import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("x-property-return-path", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.next({
    request: {
      headers: reqHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
