import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateAccessToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('t')?.value;
  const isHome = request.nextUrl.pathname === '/';

  // La página principal es pública: sin token se muestra la landing.
  if (!token) {
    if (isHome) return NextResponse.next();
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isValid = await validateAccessToken(token);

  if (!isValid) {
    if (isHome) {
      const response = NextResponse.next();
      response.cookies.delete('t');
      return response;
    }
    const loginUrl = new URL('/auth/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('t');
    return response;
  }

  // Con sesión válida, la landing redirige al resumen.
  if (isHome) {
    return NextResponse.redirect(new URL('/resumen', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/sesiones', '/resumen', '/resumen/:path*'],
};
