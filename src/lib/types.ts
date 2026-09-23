/**
 * Kontrak `bookpedia-api` untuk Platform/Staff/Domain — persis
 * `PlatformResponseDto`/`PlatformStaffResponseDto`/dst yang sudah dibangun
 * di backend (§4.1). JANGAN diubah sepihak dari sisi admin; kontrak ini
 * ditentukan backend.
 */

/** Fase 7 — grain rating: "book" = satu rating per Book, "chapter" = rating terpisah tiap Chapter (diagregasi ke Book saat ditampilkan). */
export type RatingMode = 'book' | 'chapter';

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

export interface CatalogSectionConfig {
  key: string;
  title: string;
  enabled: boolean;
  type?: 'top' | 'new_updated';
  queryType?: 'predefined' | 'custom';
  predefinedQuery?: 'top' | 'new_updated';
  customQuery?: {
    genre?: string | string[];
    category?: string | string[];
    tag?: string;
    library?: string;
    search?: string;
    sort?: 'updated' | 'views' | 'title';
    sortRules?: Array<{
      field: 'updated' | 'views' | 'title';
      direction: 'asc' | 'desc';
    }>;
  };
  layout: 'grid' | 'slider';
  limit: number;
  lazyLoad?: boolean;
  pageSize?: number;
}

export interface Platform {
  id: string;
  nama: string;
  slug: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  notificationSoundUrl: string | null;
  colors: PlatformColors;
  lockStudio: boolean;
  rendererKey: string;
  homepageSections: CatalogSectionConfig[];
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
  /** Fase 7 — nyala/mati fitur rating Book/Chapter. */
  enableRating: boolean;
  /** Fase 7 — grain rating saat ini. */
  ratingMode: RatingMode;
  /** Fase 8 — nyala/mati tombol Like di ChapterEngagementBar. */
  enableLike: boolean;
  /** Fase 8 — nyala/mati tombol Comment (mock) di ChapterEngagementBar. */
  enableComment: boolean;
  /** Fase 8 — nyala/mati tombol Share di ChapterEngagementBar. */
  enableShare: boolean;
  seoDefaultH1: string | null;
  seoDefaultTitle: string | null;
  seoDefaultDescription: string | null;
  seoDefaultOgTitle: string | null;
  seoDefaultOgDescription: string | null;
  seoDefaultOgType: 'website' | 'book' | 'profile' | null;
  seoPrefix: string | null;
  seoSuffix: string | null;
}

export interface PlatformsResponse {
  isOwner: boolean;
  platforms: Platform[];
}

export interface PlatformAnalyticsItem {
  date: string;
  userGrowth: number;
  readingGrowth: number;
  totalUsers: number;
}

export interface PlatformAnalyticsBook {
  title: string;
  author: string;
  views: number;
  progress: number;
}

export interface PlatformRecentActivity {
  title: string;
  detail: string;
  activityAt: string;
  type: string;
  userName: string;
  avatarUrl: string | null;
}

export interface PlatformAnalyticsResponse {
  items: PlatformAnalyticsItem[];
  topBooks: PlatformAnalyticsBook[];
  recentActivities: PlatformRecentActivity[];
  totalBooks: number;
  totalLibraries: number;
  publishedBooks: number;
  totalReaders: number;
  totalViews: number;
  totalComments: number;
  totalLikes: number;
  averageRating: number;
}

export interface PlatformUserActivity {
  userId: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  readingCount: number;
  ratingCount: number;
  likeCount: number;
  highlightCount: number;
  libraryCount: number;
  lastActivityAt: string;
}

export interface PlatformUserActivityResponse {
  items: PlatformUserActivity[];
  total: number;
  page: number;
  limit: number;
}

export interface PlatformUserReadingItem {
  bookId: string;
  bookSlug: string;
  bookTitle: string;
  bookCoverUrl: string | null;
  lastChapterId: string;
  lastChapterOrderIndex: number;
  lastChapterTitle: string;
  lastReadAt: string;
}

export interface PlatformUserReadingResponse {
  userId: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  readingList: PlatformUserReadingItem[];
}

export interface CreatePlatformPayload {
  nama: string;
  slug: string;
  logoUrl?: string;
  faviconUrl?: string;
  notificationSoundUrl?: string;
  colors: PlatformColors;
  lockStudio?: boolean;
  rendererKey?: string;
  homepageSections?: CatalogSectionConfig[];
  maxFreeChapters?: number;
  showBookStatus?: boolean;
  maxTagsPerBook?: number;
  enableRating?: boolean;
  ratingMode?: RatingMode;
  enableLike?: boolean;
  enableComment?: boolean;
  enableShare?: boolean;
  seoDefaultH1?: string;
  seoDefaultTitle?: string;
  seoDefaultDescription?: string;
  seoDefaultOgTitle?: string;
  seoDefaultOgDescription?: string;
  seoDefaultOgType?: 'website' | 'book' | 'profile';
  seoPrefix?: string;
  seoSuffix?: string;
}

export interface UpdatePlatformPayload {
  nama?: string;
  slug?: string;
  logoUrl?: string;
  faviconUrl?: string;
  notificationSoundUrl?: string;
  colors?: PlatformColors;
  lockStudio?: boolean;
  rendererKey?: string;
  homepageSections?: CatalogSectionConfig[];
  isActive?: boolean;
  maxFreeChapters?: number;
  showBookStatus?: boolean;
  maxTagsPerBook?: number;
  searchConsoleVerificationFilename?: string | null;
  searchConsoleVerificationContent?: string | null;
  enableRating?: boolean;
  ratingMode?: RatingMode;
  enableLike?: boolean;
  enableComment?: boolean;
  enableShare?: boolean;
  seoDefaultH1?: string | null;
  seoDefaultTitle?: string | null;
  seoDefaultDescription?: string | null;
  seoDefaultOgTitle?: string | null;
  seoDefaultOgDescription?: string | null;
  seoDefaultOgType?: 'website' | 'book' | 'profile' | null;
  seoPrefix?: string | null;
  seoSuffix?: string | null;
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
