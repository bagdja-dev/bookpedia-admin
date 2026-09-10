/**
 * Kontrak `novelo-api` untuk Platform/Staff/Domain — persis
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
}

// Catatan: `PATCH /platforms/:id` TIDAK menerima `slug` (kontrak backend) —
// slug hanya ditentukan saat create.
export interface UpdatePlatformPayload {
  nama?: string;
  logoUrl?: string;
  faviconUrl?: string;
  colors?: PlatformColors;
  lockStudio?: boolean;
  rendererKey?: string;
  isActive?: boolean;
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
