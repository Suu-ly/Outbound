import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  const signedOutRoutes =
    /\/login|\/register|\/register\/email|\/verify|\/reset-password|\/forget-password|\/reset-password\/success/g;
  const pathName = request.nextUrl.pathname;
  const isSignedOutRoutes = signedOutRoutes.test(pathName);

  const sessionCookie = getSessionCookie(request);

  // User is not logged in
  if (!sessionCookie) {
    if (isSignedOutRoutes || /\/trip\/[a-z0-9]{12}(\/\w*)?/.test(pathName)) {
      return NextResponse.next();
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
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).+)",
  ],
};
