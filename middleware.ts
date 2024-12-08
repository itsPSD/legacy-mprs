import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper function to check if a value is empty (null, undefined, or empty string)
const isEmpty = (value: any): boolean => {
  return value === null || value === undefined || value === '';
};

export async function middleware(request: NextRequest) {
  // Don't redirect these paths
  const publicPaths = [
    '/_next',
    '/api',
    '/login',
    '/favicon.ico',
    '/update-profile'
  ];

  // Check if current path is public
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Debug log
  console.log('Middleware Token:', {
    path: request.nextUrl.pathname,
    characterName: token?.characterName,
    cid: token?.cid
  });

  // If no token, allow through (auth will handle it)
  if (!token) {
    return NextResponse.next();
  }

  // Check for incomplete profile
  if (isEmpty(token.characterName) || isEmpty(token.cid)) {
    console.log('Redirecting to update-profile due to incomplete profile');
    // Create absolute URL for redirect
    const url = new URL('/update-profile', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
