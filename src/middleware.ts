import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const SIGNED_OUT_ROUTES = [
  "/login",
  "/register",
  "/register/email",
  "/verify",
  "/forget-password",
  "/reset-password",
  "/reset-password/success",
];

export default function middleware(request: NextRequest) {
  const pathName = request.nextUrl.pathname;
  const isSignedOutRoutes = SIGNED_OUT_ROUTES.includes(pathName);

  const sessionCookie = getSessionCookie(request, { cookiePrefix: "outbound" });

  // User is not logged in
  if (!sessionCookie) {
    if (isSignedOutRoutes) {
      if (pathName === "/login") {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const redirect = new URLSearchParams([["redirect", pathName]]);
    return NextResponse.redirect(
      new URL(`/login?${redirect.toString()}`, request.url),
    );
  }

  // User is logged in
  if (isSignedOutRoutes) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, other static assets
     */
    "/((?!api|trip|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).+)",
  ],
};
