import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSIE_COOKIE, SESSIE_TOKEN } from "@/lib/auth"

export function middleware(request: NextRequest) {
  const ingelogd =
    request.cookies.get(SESSIE_COOKIE)?.value === SESSIE_TOKEN
  const { pathname } = request.nextUrl
  const isLogin = pathname === "/login"

  if (!ingelogd && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (ingelogd && isLogin) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Beveilig alle routes behalve statische bestanden en api.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|.*\\.png$|.*\\.svg$).*)"],
}
