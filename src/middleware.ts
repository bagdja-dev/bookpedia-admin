/**
 * Resolusi Platform (tenant) berdasarkan Host header — port dari
 * bagdja-bookpedia-app/middleware.ts. Inject header internal
 * (`PLATFORM_SLUG_HEADER`) ke request sehingga Route Handler proxy
 * dapat meneruskan ke backend untuk scope data per-Platform.
 *
 * `/auth/*` dikecualikan paling awal.
 */

import { NextResponse, type NextRequest } from 'next/server';

import { PLATFORM_SLUG_HEADER } from '@/lib/platform-slug-header';
import { resolvePlatformSlugFromHost } from '@/lib/platform-resolve';

function withPlatformSlug(request: NextRequest, slug: string): NextResponse {
  const headers = new Headers(request.headers);
  headers.set(PLATFORM_SLUG_HEADER, slug);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  const slug = await resolvePlatformSlugFromHost(request.headers.get('host'));
  if (!slug) {
    return NextResponse.next();
  }

  return withPlatformSlug(request, slug);
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)', '/api/proxy/:path*'],
};
