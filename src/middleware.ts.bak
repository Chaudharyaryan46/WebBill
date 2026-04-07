import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  // 1. If no token and not on login page, redirect to login
  if (!token && !pathname.startsWith('/login') && !pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token) {
    // 2. Multi-Tenant Status Check (Block deactivated hotels)
    // In a real app, this value should be in the JWT or checked via a quick Redis cache
    if (token.role !== 'SUPER_ADMIN' && !token.hotelActive) {
       return NextResponse.json({ error: 'Hotel subscription inactive or deactivated.' }, { status: 403 });
    }

    // 3. Role-Based Access Control (RBAC) Logic
    if (pathname.startsWith('/superadmin') && token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    if (pathname.startsWith('/waiter') && token.role !== 'WAITER' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    if (pathname.startsWith('/kitchen') && token.role !== 'KITCHEN' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (pathname.startsWith('/counter') && token.role !== 'COUNTER' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
