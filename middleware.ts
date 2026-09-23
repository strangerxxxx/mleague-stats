import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const season = request.nextUrl.searchParams.get("season");
  if (!season) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.search = "";
  url.pathname = season === "career" ? "/career" : `/seasons/${season}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    {
      source: "/",
      has: [{ type: "query", key: "season" }],
    },
  ],
};
