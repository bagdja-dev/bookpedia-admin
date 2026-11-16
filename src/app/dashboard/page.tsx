'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Eye,
  FileText,
  Heart,
  Library,
  MessageCircle,
  PanelsTopLeft,
  Settings,
  Star,
  Tag,
  UserRound,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { EmptyState } from '@/components/admin/empty-state';
import { ErrorState } from '@/components/admin/error-state';
import { StatusBadge } from '@/components/admin/status-badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlatformContext } from '@/context/platform-context';
import { useAuth } from '@/hooks/use-auth';
import { ApiError, apiClient } from '@/lib/api-client';
import type { PlatformAnalyticsResponse } from '@/lib/types';

type DashboardAnalyticsState = {
  platformId: string;
  data: PlatformAnalyticsResponse | null;
  error: string | null;
};

const stats = [
  { label: 'Total Books', key: 'totalBooks', icon: BookOpen },
  { label: 'Total Library', key: 'totalLibraries', icon: Library },
  { label: 'Books Published', key: 'publishedBooks', icon: FileText },
  { label: 'Total Readers', key: 'totalReaders', icon: UserRound },
  { label: 'Total Views', key: 'totalViews', icon: Eye },
  { label: 'Total Comments', key: 'totalComments', icon: MessageCircle },
  { label: 'Total Likes', key: 'totalLikes', icon: Heart },
  { label: 'Rata-rata Rating', key: 'averageRating', icon: Star },
] as const;

const setupLinks = [
  {
    href: '/dashboard/platform-settings',
    title: 'Identitas & pengaturan Platform',
    description: 'Nama, aset, tampilan, domain, dan aturan pembaca.',
    icon: Settings,
  },
  {
    href: '/dashboard/homepage',
    title: 'Homepage pembaca',
    description: 'Atur section dan urutan katalog di halaman utama.',
    icon: PanelsTopLeft,
  },
  {
    href: '/dashboard/genres',
    title: 'Genre',
    description: 'Kelola pengelompokan genre untuk katalog.',
    icon: Library,
  },
  {
    href: '/dashboard/categories',
    title: 'Kategori',
    description: 'Susun kategori konten Platform.',
    icon: Tag,
  },
  {
    href: '/dashboard/donations',
    title: 'Donasi Platform',
    description: 'Atur dukungan sukarela untuk operasional.',
    icon: Heart,
  },
  {
    href: '/dashboard/staff',
    title: 'Akses tim',
    description: 'Kelola staff yang membantu mengelola Platform.',
    icon: Users,
    ownerOnly: true,
  },
] as const;

const quickLinks = [
  { href: '/dashboard/homepage', label: 'Atur Homepage', icon: PanelsTopLeft },
  { href: '/dashboard/genres', label: 'Kelola Genre', icon: Library },
  { href: '/dashboard/categories', label: 'Kelola Kategori', icon: Tag },
  { href: '/dashboard/users', label: 'Lihat Pembaca', icon: Users },
] as const;

const chartTooltipStyle = {
  borderRadius: '0.75rem',
  border: '1px solid var(--border)',
  boxShadow: '0 8px 24px rgba(58, 42, 30, 0.12)',
};

const activityTones: Record<string, string> = {
  Published: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  Reading: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
  Rating: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
  Like: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200',
  Highlight: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  Updated: 'bg-muted text-muted-foreground',
};

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Waktu tidak tersedia';

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (elapsedMinutes < 1) return 'Baru saja';
  if (elapsedMinutes < 60) return `${elapsedMinutes} menit lalu`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} jam lalu`;
  return `${Math.floor(elapsedHours / 24)} hari lalu`;
}

function formatNumber(value: number, key: (typeof stats)[number]['key']): string {
  return key === 'averageRating'
    ? value.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : value.toLocaleString('id-ID');
}

export default function DashboardIndexPage() {
  const {
    activePlatform,
    loading: platformLoading,
    error: platformError,
    canCreatePlatform,
    isOwner,
  } = usePlatformContext();
  const { user } = useAuth();
  const [analyticsState, setAnalyticsState] = useState<DashboardAnalyticsState | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!activePlatform) return;

    let cancelled = false;
    void apiClient<PlatformAnalyticsResponse>(`/platforms/${activePlatform.id}/analytics?days=7`)
      .then((data) => {
        if (!cancelled) {
          setAnalyticsState({ platformId: activePlatform.id, data, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setAnalyticsState({
            platformId: activePlatform.id,
            data: null,
            error: cause instanceof ApiError ? cause.message : 'Analytics belum dapat dimuat.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activePlatform, retryCount]);

  if (platformLoading) return <LoadingSpinner label="Memuat dashboard…" />;

  if (!activePlatform) {
    return (
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <span>Platform</span><span className="mx-2">/</span><span className="font-medium text-foreground">Dashboard</span>
        </nav>
        <EmptyState
          title={platformError
            ? 'Platform tidak dapat dimuat'
            : canCreatePlatform ? 'Mulai dengan membuat Platform' : 'Belum ada Platform yang ditugaskan'}
          description={platformError
            ? 'Dashboard belum dapat menentukan Platform yang tersedia. Periksa pesan error di atas lalu coba lagi.'
            : canCreatePlatform
              ? 'Buat Platform terlebih dahulu untuk mengatur katalog, tampilan pembaca, dan memantau aktivitas.'
              : 'Akun ini belum memiliki Platform aktif. Hubungi Owner organisasi untuk mendapatkan akses.'}
          action={!platformError && canCreatePlatform ? (
            <Button asChild>
              <Link href="/dashboard/platforms/new">Buat Platform <ArrowUpRight aria-hidden="true" /></Link>
            </Button>
          ) : undefined}
        />
      </div>
    );
  }

  const hasCurrentAnalytics = analyticsState?.platformId === activePlatform.id;
  const analytics = hasCurrentAnalytics ? analyticsState.data : null;
  const analyticsLoading = !hasCurrentAnalytics;
  const analyticsError = hasCurrentAnalytics ? analyticsState.error : null;
  const chartData = analytics?.items.map((item) => ({
    day: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(new Date(`${item.date}T00:00:00`)),
    userGrowth: item.userGrowth,
    readingGrowth: item.readingGrowth,
    totalUsers: item.totalUsers,
  })) ?? [];
  const latestAnalytics = chartData.at(-1);
  const displayName = user?.username ?? user?.email?.split('@')[0];

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <span>Platform</span>
        <span className="mx-2">/</span>
        <span className="truncate">{activePlatform.nama}</span>
        <span className="mx-2">/</span>
        <span className="font-medium text-foreground">Dashboard</span>
      </nav>

      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Selamat datang{displayName ? `, ${displayName}` : ''}.
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {activePlatform.tagline || `Kelola ${activePlatform.nama} untuk pembaca Platform Anda.`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Ringkasan kerja untuk <span className="font-medium text-foreground">{activePlatform.nama}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard/platform-settings">
              Lanjutkan Setup <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          {canCreatePlatform && (
            <Button asChild variant="outline">
              <Link href="/dashboard/platforms/new">Tambah Platform</Link>
            </Button>
          )}
        </div>
      </section>

      <section aria-labelledby="setup-heading" className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Pintasan konfigurasi</p>
            <h2 id="setup-heading" className="mt-1 text-2xl font-semibold tracking-tight">Siapkan Platform</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Buka pengaturan yang relevan untuk menyiapkan pengalaman pembaca. Daftar ini bukan indikator progres atau status kesiapan Platform.
            </p>
          </div>
          <StatusBadge
            label={activePlatform.isActive ? 'Platform aktif' : 'Platform nonaktif'}
            tone={activePlatform.isActive ? 'success' : 'neutral'}
            className="w-fit"
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {setupLinks.filter((item) => !('ownerOnly' in item) || !item.ownerOnly || isOwner).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-h-28 items-start gap-3 rounded-xl border bg-background/70 p-4 transition-colors hover:border-primary/40 hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{item.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Buka pengaturan <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {analyticsError && (
        <ErrorState
          title="Analytics tidak berhasil dimuat"
          description={analyticsError}
          onRetry={() => {
            setAnalyticsState({ platformId: activePlatform.id, data: null, error: null });
            setRetryCount((count) => count + 1);
          }}
        />
      )}

      <section aria-label="Metrik Platform" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const value = analytics?.[stat.key];
          return (
            <Card key={stat.key} className="gap-4 py-5">
              <CardContent className="px-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {analyticsLoading ? '…' : value === undefined ? '—' : formatNumber(value, stat.key)}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {analyticsError ? 'Data tidak tersedia' : 'Ringkasan Platform'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section aria-label="Tren analytics" className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Pertumbuhan pembaca</CardTitle>
              <CardDescription>Perubahan jumlah pembaca harian.</CardDescription>
            </div>
            <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">7 hari</span>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{latestAnalytics ? `${latestAnalytics.userGrowth.toLocaleString('id-ID')}%` : '—'}</span>
              <span className="text-xs text-muted-foreground">perubahan terbaru</span>
            </div>
            <div className="h-52 w-full">
              {analyticsLoading ? (
                <ChartMessage>Memuat analytics…</ChartMessage>
              ) : analyticsError ? (
                <ChartMessage>Grafik tidak tersedia karena analytics gagal dimuat.</ChartMessage>
              ) : chartData.length === 0 ? (
                <ChartMessage>Belum ada data pertumbuhan.</ChartMessage>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="readerGrowthFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--border)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0].payload as (typeof chartData)[number];
                        return (
                          <div className="rounded-xl border bg-background px-3 py-2 text-xs shadow-lg">
                            <p className="mb-1 font-medium">{label}</p>
                            <p className="text-muted-foreground">Pertumbuhan: <span className="font-semibold text-foreground">{point.userGrowth.toLocaleString('id-ID')}%</span></p>
                            <p className="text-muted-foreground">Total pembaca: <span className="font-semibold text-foreground">{point.totalUsers.toLocaleString('id-ID')}</span></p>
                          </div>
                        );
                      }}
                      contentStyle={chartTooltipStyle}
                    />
                    <Area type="monotone" dataKey="userGrowth" stroke="var(--primary)" strokeWidth={3} fill="url(#readerGrowthFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Aktivitas membaca</CardTitle>
              <CardDescription>Perubahan aktivitas membaca harian.</CardDescription>
            </div>
            <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">7 hari</span>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{latestAnalytics ? `${latestAnalytics.readingGrowth.toLocaleString('id-ID')}%` : '—'}</span>
              <span className="text-xs text-muted-foreground">perubahan terbaru</span>
            </div>
            <div className="h-52 w-full">
              {analyticsLoading ? (
                <ChartMessage>Memuat analytics…</ChartMessage>
              ) : analyticsError ? (
                <ChartMessage>Grafik tidak tersedia karena analytics gagal dimuat.</ChartMessage>
              ) : chartData.length === 0 ? (
                <ChartMessage>Belum ada data aktivitas membaca.</ChartMessage>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--border)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0].payload as (typeof chartData)[number];
                        return (
                          <div className="rounded-xl border bg-background px-3 py-2 text-xs shadow-lg">
                            <p className="mb-1 font-medium">{label}</p>
                            <p className="text-muted-foreground">Perubahan membaca: <span className="font-semibold text-foreground">{point.readingGrowth.toLocaleString('id-ID')}%</span></p>
                          </div>
                        );
                      }}
                      contentStyle={chartTooltipStyle}
                    />
                    <Bar dataKey="readingGrowth" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-label="Performa dan aktivitas" className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Book teratas</CardTitle>
              <CardDescription>Book dengan jumlah pembacaan tertinggi pada data analytics.</CardDescription>
            </div>
            <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsLoading ? (
              <p className="text-sm text-muted-foreground">Memuat performa konten…</p>
            ) : analyticsError ? (
              <p className="text-sm text-destructive">Data performa tidak tersedia.</p>
            ) : !analytics?.topBooks.length ? (
              <p className="text-sm text-muted-foreground">Belum ada data performa konten.</p>
            ) : analytics.topBooks.map((book, index) => (
              <div key={`${book.title}-${book.author}-${index}`} className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{book.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium">{book.views.toLocaleString('id-ID')} views</span>
                </div>
                <div className="ml-11 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, book.progress))}%` }}
                    role="progressbar"
                    aria-label={`Progress ${book.title}`}
                    aria-valuenow={Math.min(100, Math.max(0, book.progress))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas terbaru</CardTitle>
            <CardDescription>Aktivitas yang dikembalikan analytics Platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {analyticsLoading ? (
              <p className="text-sm text-muted-foreground">Memuat aktivitas…</p>
            ) : analyticsError ? (
              <p className="text-sm text-destructive">Aktivitas tidak tersedia.</p>
            ) : !analytics?.recentActivities.length ? (
              <p className="text-sm text-muted-foreground">Belum ada aktivitas terbaru.</p>
            ) : analytics.recentActivities.map((activity, index) => (
              <div key={`${activity.title}-${activity.activityAt}-${index}`} className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                  {activity.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activity.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <time className="shrink-0 text-xs text-muted-foreground" dateTime={activity.activityAt}>
                      {formatRelativeTime(activity.activityAt)}
                    </time>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{activity.userName} · {activity.detail}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${activityTones[activity.type] ?? 'bg-muted text-muted-foreground'}`}>
                    {activity.type}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="shortcuts-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="shortcuts-heading" className="text-xl font-semibold tracking-tight">Pintasan</h2>
            <p className="mt-1 text-sm text-muted-foreground">Akses cepat ke halaman operasional yang tersedia.</p>
          </div>
          {canCreatePlatform && (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/platforms/new">Tambah Platform <ArrowUpRight aria-hidden="true" /></Link>
            </Button>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            );
          })}
          {isOwner && (
            <Link
              href="/dashboard/staff"
              className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium">Kelola Staff</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function ChartMessage({ children }: { children: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
