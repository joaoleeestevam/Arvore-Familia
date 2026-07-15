import { NextRequest, NextResponse } from "next/server";
import { decryptSession } from "@/lib/session";

// só acessíveis para quem NÃO está logado; se já tiver sessão, manda para "/"
const PUBLIC_ONLY_ROUTES = ["/login", "/esqueci-senha"];

// acessíveis independente de ter sessão ou não (o link de redefinição
// pode chegar a qualquer momento, logado ou não)
const ALWAYS_ACCESSIBLE_ROUTES = ["/redefinir-senha"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (ALWAYS_ACCESSIBLE_ROUTES.includes(path)) {
    return NextResponse.next();
  }

  const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.includes(path);

  const cookie = req.cookies.get("session")?.value;
  const session = await decryptSession(cookie);

  if (!isPublicOnlyRoute && !session?.userId) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("from", path);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicOnlyRoute && session?.userId) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
