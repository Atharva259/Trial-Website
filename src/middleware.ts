import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('admin_session')?.value;
  const { pathname } = request.nextUrl;

  // Protect staff and admin pages
  const isProtectedPath =
    pathname.startsWith('/kitchen') ||
    pathname.startsWith('/pos') ||
    pathname.startsWith('/admin');

  if (isProtectedPath) {
    if (!sessionToken) {
      // Redirect to login page
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Parse JWT payload (structure check + expiration check)
    try {
      const parts = sessionToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        if (isExpired) {
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('redirect', pathname);
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete('admin_session');
          return response;
        }
      } else {
        throw new Error('Invalid token structure');
      }
    } catch (e) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('admin_session');
      return response;
    }
  }

  return NextResponse.next();
}

// Config to specify matching routes
export const config = {
  matcher: ['/kitchen/:path*', '/pos/:path*', '/admin/:path*'],
};
