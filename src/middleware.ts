import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const signedOutRoutes = [
  "/login",
  "/register",
  "/register/email",
  "/verify",
  "/reset-password",
  "/forget-password",
  "/reset-password/success",
];

export default async function middleware(request: NextRequest) {
  const pathName = request.nextUrl.pathname;
  const isSignedOutRoutes = signedOutRoutes.includes(pathName);

  // TODO throw errors properly
  const sessionCookie = getSessionCookie(request);

  // User is not logged in
  if (!sessionCookie) {
    if (isSignedOutRoutes) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
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
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).+)",
  ],
};
