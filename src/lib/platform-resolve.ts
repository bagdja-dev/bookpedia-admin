/**
 * Resolusi slug Platform dari Host request — untuk middleware.ts (inject
 * header internal ke request aplikasi).
 *
 * Port dari bagdja-bookpedia-app/src/lib/platform-resolve.ts dengan env
 * yang sama (default slug `novello`, host `bagdja.com`).
 */

import { PLATFORM_HOST } from './platform-host';

export const DEFAULT_PLATFORM_SLUG = process.env.NEXT_PUBLIC_DEFAULT_PLATFORM_SLUG ?? 'novello';
export const API_URL = process.env.NEXT_PUBLIC_BOOKPEDIA_API_URL ?? 'http://localhost:5020';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

const SUBDOMAIN_PATTERN = new RegExp(`^([a-z0-9-]+)\\.${PLATFORM_HOST.replace(/\./g, '\\.')}$`);

const LOCAL_SUBDOMAIN_PATTERN = /^([a-z0-9-]+)\.localhost$/;

export function hostnameFromHost(hostHeader: string | null | undefined): string {
  return (hostHeader ?? '').split(':')[0];
}

async function resolveSlugForDomain(host: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/public/platforms/resolve?host=${encodeURIComponent(host)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { slug?: string };
    return data.slug ?? null;
  } catch {
    return null;
  }
}

export async function resolvePlatformSlugFromHost(hostHeader: string | null | undefined): Promise<string | null> {
  const hostname = hostnameFromHost(hostHeader);

  if (!hostname || LOCAL_HOSTS.has(hostname) || hostname === PLATFORM_HOST) {
    return DEFAULT_PLATFORM_SLUG;
  }

  const subdomainMatch = hostname.match(SUBDOMAIN_PATTERN) ?? hostname.match(LOCAL_SUBDOMAIN_PATTERN);
  if (subdomainMatch) {
    return subdomainMatch[1];
  }

  return resolveSlugForDomain(hostname);
}
