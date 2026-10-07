/**
 * Kontrak `bookpedia-api` untuk Platform/Staff/Domain — persis
 * `PlatformResponseDto`/`PlatformStaffResponseDto`/dst yang sudah dibangun
 * di backend (§4.1). JANGAN diubah sepihak dari sisi admin; kontrak ini
 * ditentukan backend.
 */

/** Fase 7 — grain rating: "book" = satu rating per Book, "chapter" = rating terpisah tiap Chapter (diagregasi ke Book saat ditampilkan). */
export type RatingMode = 'book' | 'chapter';
export type StudioEditMode = 'auto' | 'manual';

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
  studioEditMode: StudioEditMode;
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
  /** TWA Digital Asset Links — package name app Android (dibalas di /.well-known/assetlinks.json). */
  androidPackageName: string | null;
  /** TWA Digital Asset Links — SHA-256 sertifikat penanda tangan, format AA:BB:... */
  androidSha256CertFingerprints: string[];
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
  studioEditMode?: StudioEditMode;
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
  studioEditMode?: StudioEditMode;
  rendererKey?: string;
  homepageSections?: CatalogSectionConfig[];
  isActive?: boolean;
  maxFreeChapters?: number;
  showBookStatus?: boolean;
  maxTagsPerBook?: number;
  searchConsoleVerificationFilename?: string | null;
  searchConsoleVerificationContent?: string | null;
  androidPackageName?: string | null;
  androidSha256CertFingerprints?: string[];
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

export type PlatformBuildJobStatus =
  | 'queued'
  | 'validating'
  | 'building'
  | 'signing'
  | 'uploading'
  | 'success'
  | 'failed'
  | 'cancelled';

export type PlatformBuildType = 'release' | 'debug';
export type PlatformBuildOutputFormat = 'aab' | 'apk';

export interface PlatformBuildConfig {
  id: string;
  platform_id: string;
  environment: 'dev' | 'staging' | 'prod';
  version_name: string;
  version_code: number;
  keystore_profile_id: string | null;
  build_flags: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PlatformKeystoreProfile {
  id: string;
  platform_id: string | null;
  name: string;
  alias: string;
  file_ref: string;
  password_secret_ref: string;
  key_password_secret_ref: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface PlatformBuildJob {
  id: string;
  platform_id: string;
  config_id: string | null;
  external_job_id: string | null;
  status: PlatformBuildJobStatus;
  progress: number;
  stage: string | null;
  build_type?: PlatformBuildType | null;
  output_format?: PlatformBuildOutputFormat | null;
  bundle_id?: string | null;
  /** SHA-256 sertifikat penanda tangan artifact; otomatis masuk ke Android App Links Platform. */
  signing_cert_sha256?: string | null;
  artifact_url: string | null;
  log_url: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  config?: PlatformBuildConfig | null;
}

export interface CreatePlatformBuildJobPayload {
  platformId: string;
  configId?: string | null;
  buildType?: PlatformBuildType;
  outputFormat?: PlatformBuildOutputFormat;
  appName?: string;
  bundleId?: string;
  targetUrl?: string;
  iconUrl?: string;
  splashImageUrl?: string;
  versionName?: string;
  versionCode?: number;
  theme?: Record<string, unknown>;
  buildConfig?: Record<string, unknown>;
  signing?: Record<string, unknown>;
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
