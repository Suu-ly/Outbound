import type { auth } from "@/server/auth";
import { NextResponse, type NextRequest } from "next/server";

type Session = typeof auth.$Infer.Session;

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
  const data = await fetch(
    process.env.BETTER_AUTH_URL + "/api/auth/get-session",
    {
      headers: {
        //get the cookie from the request
        cookie: request.headers.get("cookie") || "",
      },
    },
  )
    .then((response) => response.json())
    .then((data) => data as Session | null);

  // User is not logged in
  if (!data || (data && !data.session)) {
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
