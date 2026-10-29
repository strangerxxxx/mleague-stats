import { NextRequest, NextResponse } from "next/server";

const PAGE_CACHE =
  "public, max-age=0, s-maxage=180, stale-while-revalidate=600";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const season = request.nextUrl.searchParams.get("season");
    if (season) {
      const url = request.nextUrl.clone();
      url.search = "";
      url.pathname = season === "career" ? "/career" : `/seasons/${season}`;
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  // The page itself is rendered on demand from the current snapshot. Let
  // CloudFront keep that response briefly so the next visit does not wait
  // on the origin. max-age=0 keeps the browser from holding a private copy.
  response.headers.set("Cache-Control", PAGE_CACHE);
  return response;
}

export const config = {
  matcher: ["/", "/career", "/players/:path*", "/teams/:path*", "/seasons/:path*"],
};
