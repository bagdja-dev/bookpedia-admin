/**
 * Kontrak `bookpedia-api` untuk Platform/Staff/Domain — persis
 * `PlatformResponseDto`/`PlatformStaffResponseDto`/dst yang sudah dibangun
 * di backend (§4.1). JANGAN diubah sepihak dari sisi admin; kontrak ini
 * ditentukan backend.
 */

export interface PlatformColors {
  bg: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  terracotta: string;
  terracottaForeground: string;
  mustard: string;
  olive: string;
}

export interface Platform {
  id: string;
  nama: string;
  slug: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  colors: PlatformColors;
  lockStudio: boolean;
  rendererKey: string;
  domain: string | null;
  domainVerifiedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Fase 5 (SEO) — jumlah Chapter pertama tiap Book yang bisa dibaca tanpa login. 0 = SEMUA Chapter gratis (bukan "nol Chapter gratis"). */
  maxFreeChapters: number;
  /** Tampilkan badge status cerita (draft/ongoing/completed) di halaman publik. Tidak mempengaruhi Studio. */
  showBookStatus: boolean;
  /** Fase 6 — batas jumlah Tag yang boleh dilekatkan ke satu Book. */
  maxTagsPerBook: number;
  /** Verifikasi Google Search Console ("HTML file" method) — nama file persis dari Google. */
  searchConsoleVerificationFilename: string | null;
  searchConsoleVerificationContent: string | null;
}

export interface PlatformsResponse {
  isOwner: boolean;
  platforms: Platform[];
}

export interface CreatePlatformPayload {
  nama: string;
  slug: string;
  logoUrl?: string;
  faviconUrl?: string;
  colors: PlatformColors;
  lockStudio?: boolean;
  rendererKey?: string;
  maxFreeChapters?: number;
  showBookStatus?: boolean;
  maxTagsPerBook?: number;
}

export interface UpdatePlatformPayload {
  nama?: string;
  slug?: string;
  logoUrl?: string;
  faviconUrl?: string;
  colors?: PlatformColors;
  lockStudio?: boolean;
  rendererKey?: string;
  isActive?: boolean;
  maxFreeChapters?: number;
  showBookStatus?: boolean;
  maxTagsPerBook?: number;
  searchConsoleVerificationFilename?: string | null;
  searchConsoleVerificationContent?: string | null;
}

export interface PlatformStaff {
  id: string;
  platformId: string;
  userId: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PlatformStaffInvitationStatus = 'pending' | 'expired';

export interface PlatformStaffInvitationListItem {
  id: string;
  email: string;
  status: PlatformStaffInvitationStatus;
  createdAt: string;
  expiresAt: string;
}

export interface InvitePlatformStaffPayload {
  email: string;
}

/** Response invite — SATU-SATUNYA tempat `token` terekspos (dipakai bikin link accept manual). */
export interface PlatformStaffInvitationResponse {
  id: string;
  platformId: string;
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface DomainVerificationResponse {
  recordName: string;
  recordValue: string;
  dnsTarget: {
    recordType: 'A';
    recordName: string;
    recordValue: string;
  };
}

export interface DomainCheckResponse {
  verified: boolean;
  domain_verified_at: string | null;
}

export interface DeletedResponse {
  deleted: boolean;
}

export interface Genre {
  id: string;
  platformId: string | null;
  nama: string;
  slug: string;
}

export interface Category {
  id: string;
  platformId: string;
  nama: string;
  slug: string;
  genres: Genre[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  nama: string;
  slug: string;
}

export interface UpdateCategoryPayload {
  nama?: string;
  slug?: string;
}

export interface AttachGenrePayload {
  genreId: string;
}

export interface CreateGenrePayload {
  nama: string;
  slug: string;
}

export interface UpdateGenrePayload {
  nama?: string;
  slug?: string;
}
