/**
 * Resolusi base URL untuk panggil `bookpedia-api` — pola `AUCTION_WEB_INTERNAL_URL`
 * di `bagdja-auction-api` (11 Sep 2026): di dalam Docker network Coolify
 * yang sama, panggil container lain lewat domain publik sering gagal —
 * `getaddrinfo ENOTFOUND` — karena hairpin NAT/DNS resolver Docker, BUKAN
 * karena domain itu sendiri salah (dikonfirmasi kejadian nyata di
 * `bagdja-bookpedia-app`, 11 Sep 2026).
 *
 * `bookpedia-admin` seluruhnya server-side (semua panggilan lewat BFF proxy
 * `lib/backend-api.ts` + route upload) — TIDAK ADA panggilan client-side
 * langsung seperti `publicFetch` di `bookpedia-app`. Helper ini tetap ditulis
 * dengan cek `typeof window` (bukan cuma baca `BOOKPEDIA_API_INTERNAL_URL`
 * langsung) supaya polanya identik & bisa dicopy-paste ulang persis kalau
 * nanti ada panggilan client-side ditambahkan di sini.
 */
export function getApiBase(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.BOOKPEDIA_API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_BOOKPEDIA_API_URL ||
      'http://localhost:5020'
    );
  }
  return process.env.NEXT_PUBLIC_BOOKPEDIA_API_URL || 'http://localhost:5020';
}
