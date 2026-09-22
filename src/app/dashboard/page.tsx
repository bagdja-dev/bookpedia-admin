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
  Plus,
  Settings,
  Star,
  Tag,
  TrendingUp,
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

import { LoadingSpinner } from '@/components/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlatformContext } from '@/context/platform-context';
import { ApiError, apiClient } from '@/lib/api-client';
import type { PlatformAnalyticsBook, PlatformAnalyticsItem, PlatformAnalyticsResponse, PlatformRecentActivity } from '@/lib/types';

const stats = [
  { label: 'Total Books', key: 'totalBooks', icon: BookOpen, tone: 'text-blue-600 bg-blue-100' },
  { label: 'Total Library', key: 'totalLibraries', icon: Library, tone: 'text-cyan-600 bg-cyan-100' },
  { label: 'Books Published', key: 'publishedBooks', icon: FileText, tone: 'text-emerald-600 bg-emerald-100' },
  { label: 'Total Readers', key: 'totalReaders', icon: UserRound, tone: 'text-violet-600 bg-violet-100' },
  { label: 'Total Views', key: 'totalViews', icon: Eye, tone: 'text-amber-600 bg-amber-100' },
  { label: 'Total Comments', key: 'totalComments', icon: MessageCircle, tone: 'text-rose-600 bg-rose-100' },
  { label: 'Total Likes', key: 'totalLikes', icon: Heart, tone: 'text-pink-600 bg-pink-100' },
  { label: 'Rata-rata Rating', key: 'averageRating', icon: Star, tone: 'text-yellow-600 bg-yellow-100' },
] as const;

const quickActions = [
  { href: '/dashboard/platform-settings', label: 'Atur platform', description: 'Branding & konfigurasi', icon: Settings },
  { href: '/dashboard/genres', label: 'Kelola genre', description: 'Atur katalog genre', icon: Library },
  { href: '/dashboard/categories', label: 'Kelola kategori', description: 'Susun kategori konten', icon: Tag },
  { href: '/dashboard/users', label: 'Lihat users', description: 'Pantau aktivitas reader', icon: Users },
];

const chartTooltipStyle = {
  borderRadius: '0.75rem',
  border: '1px solid hsl(var(--border))',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
};

const activityTones: Record<string, string> = {
  Published: 'bg-emerald-100 text-emerald-700',
  Reading: 'bg-blue-100 text-blue-700',
  Rating: 'bg-violet-100 text-violet-700',
  Like: 'bg-rose-100 text-rose-700',
  Highlight: 'bg-amber-100 text-amber-700',
  Updated: 'bg-slate-100 text-slate-700',
};

function formatRelativeTime(date: string): string {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (elapsedMinutes < 1) return 'Baru saja';
  if (elapsedMinutes < 60) return `${elapsedMinutes} menit lalu`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} jam lalu`;
  return `${Math.floor(elapsedHours / 24)} hari lalu`;
}

export default function DashboardIndexPage() {
  const { activePlatform, loading } = usePlatformContext();
  const [analyticsState, setAnalyticsState] = useState<{
    platformId: string | null;
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
    error: string | null;
  }>({ platformId: null, items: [], topBooks: [], recentActivities: [], totalBooks: 0, totalLibraries: 0, publishedBooks: 0, totalReaders: 0, totalViews: 0, totalComments: 0, totalLikes: 0, averageRating: 0, error: null });

  useEffect(() => {
    if (!activePlatform) {
      return;
    }

    let cancelled = false;

    void apiClient<PlatformAnalyticsResponse>(`/platforms/${activePlatform.id}/analytics?days=7`)
      .then((data) => {
        if (!cancelled) {
          setAnalyticsState({
            platformId: activePlatform.id,
            items: data.items,
            topBooks: data.topBooks,
            recentActivities: data.recentActivities,
            totalBooks: data.totalBooks,
            totalLibraries: data.totalLibraries,
            publishedBooks: data.publishedBooks,
            totalReaders: data.totalReaders,
            totalViews: data.totalViews,
            totalComments: data.totalComments,
            totalLikes: data.totalLikes,
            averageRating: data.averageRating,
            error: null,
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAnalyticsState({
            platformId: activePlatform.id,
            items: [],
            topBooks: [],
            recentActivities: [],
            totalBooks: 0,
            totalLibraries: 0,
            publishedBooks: 0,
            totalReaders: 0,
            totalViews: 0,
            totalComments: 0,
            totalLikes: 0,
            averageRating: 0,
            error: error instanceof ApiError ? error.message : 'Analytics belum dapat dimuat.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activePlatform]);

  if (loading) return <LoadingSpinner label="Memuat dashboard…" />;

  const analytics = activePlatform?.id === analyticsState.platformId ? analyticsState.items : [];
  const topBooks = activePlatform?.id === analyticsState.platformId ? analyticsState.topBooks : [];
  const recentActivities = activePlatform?.id === analyticsState.platformId ? analyticsState.recentActivities : [];
  const analyticsLoading = Boolean(activePlatform && activePlatform.id !== analyticsState.platformId);
  const analyticsError = activePlatform?.id === analyticsState.platformId ? analyticsState.error : null;
  const analyticsStats = activePlatform?.id === analyticsState.platformId
    ? {
        totalBooks: analyticsState.totalBooks,
        totalLibraries: analyticsState.totalLibraries,
        publishedBooks: analyticsState.publishedBooks,
        totalReaders: analyticsState.totalReaders,
        totalViews: analyticsState.totalViews,
        totalComments: analyticsState.totalComments,
        totalLikes: analyticsState.totalLikes,
        averageRating: analyticsState.averageRating,
      }
    : null;
  const chartData = analytics.map((item) => ({
    day: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(new Date(`${item.date}T00:00:00`)),
    userGrowth: item.userGrowth,
    readingGrowth: item.readingGrowth,
    totalUsers: item.totalUsers,
  }));
  const latestAnalytics = chartData.at(-1);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Pertumbuhan user</CardTitle>
              <CardDescription>Perubahan jumlah user dibanding hari sebelumnya.</CardDescription>
            </div>
            <Badge className="border-0 bg-emerald-100 text-emerald-700">
              {latestAnalytics ? `+${latestAnalytics.userGrowth.toLocaleString('id-ID')}% hari ini` : '7 hari'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-end justify-between">
              <span className="text-3xl font-semibold tracking-tight">
                {latestAnalytics ? `${latestAnalytics.userGrowth.toLocaleString('id-ID')}%` : '-'}
              </span>
              <span className="text-xs text-muted-foreground">pertumbuhan harian</span>
            </div>
            <div className="h-52 w-full">
              {analyticsLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Memuat analytics...</div>
              ) : analyticsError ? (
                <div className="flex h-full items-center justify-center text-sm text-destructive">{analyticsError}</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0].payload as (typeof chartData)[number];

                      return (
                        <div className="rounded-xl border bg-background px-3 py-2 text-xs shadow-lg">
                          <p className="mb-1 font-medium">{label}</p>
                          <p className="text-muted-foreground">
                            Pertumbuhan: <span className="font-semibold text-blue-600">{point.userGrowth.toLocaleString('id-ID')}%</span>
                          </p>
                          <p className="text-muted-foreground">
                            Total user: <span className="font-semibold text-foreground">{point.totalUsers.toLocaleString('id-ID')}</span>
                          </p>
                        </div>
                      );
                    }}
                    contentStyle={chartTooltipStyle}
                  />
                    <Area type="monotone" dataKey="userGrowth" stroke="#2563eb" strokeWidth={3} fill="url(#userGrowthFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Aktivitas membaca</CardTitle>
              <CardDescription>Perubahan aktivitas membaca dibanding hari sebelumnya.</CardDescription>
            </div>
            <Badge variant="outline">{analytics.length || 7} hari</Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-end justify-between">
              <span className="text-3xl font-semibold tracking-tight">
                {latestAnalytics ? `${latestAnalytics.readingGrowth.toLocaleString('id-ID')}%` : '-'}
              </span>
              <span className="text-xs text-muted-foreground">pertumbuhan harian</span>
            </div>
            <div className="h-52 w-full">
              {analyticsLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Memuat analytics...</div>
              ) : analyticsError ? (
                <div className="flex h-full items-center justify-center text-sm text-destructive">{analyticsError}</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0].payload as (typeof chartData)[number];

                      return (
                        <div className="rounded-xl border bg-background px-3 py-2 text-xs shadow-lg">
                          <p className="mb-1 font-medium">{label}</p>
                          <p className="text-muted-foreground">
                            Pertumbuhan: <span className="font-semibold text-amber-600">{point.readingGrowth.toLocaleString('id-ID')}%</span>
                          </p>
                          <p className="text-muted-foreground">
                            Total user: <span className="font-semibold text-foreground">{point.totalUsers.toLocaleString('id-ID')}</span>
                          </p>
                        </div>
                      );
                    }}
                    contentStyle={chartTooltipStyle}
                  />
                    <Bar dataKey="readingGrowth" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const value = analyticsStats?.[stat.key];
          const formattedValue = value === undefined
            ? '-'
            : stat.key === 'averageRating'
              ? value.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
              : value.toLocaleString('id-ID');
          return (
            <Card key={stat.label} className="gap-4 py-5">
              <CardContent className="px-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {formattedValue}
                    </p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Data real-time dari platform</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Performa konten</CardTitle>
              <CardDescription>Book dengan pembacaan tertinggi di platform ini.</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1 whitespace-nowrap">
              <TrendingUp className="h-3.5 w-3.5" /> 30 hari
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {analyticsLoading ? (
              <p className="text-sm text-muted-foreground">Memuat performa konten...</p>
            ) : topBooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data performa konten.</p>
            ) : topBooks.map((book, index) => (
              <div key={book.title} className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                    0{index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{book.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium">{book.views.toLocaleString('id-ID')}</span>
                </div>
                <div className="ml-11 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${book.progress}%` }} />
                </div>
              </div>
            ))}
            <Button asChild variant="ghost" className="mt-1 w-full justify-between">
              <Link href="/dashboard/users">
                Lihat aktivitas lengkap
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas terbaru</CardTitle>
            <CardDescription>Perubahan terakhir di platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {analyticsLoading ? (
              <p className="text-sm text-muted-foreground">Memuat aktivitas...</p>
            ) : recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada aktivitas terbaru.</p>
            ) : recentActivities.map((activity) => (
              <div key={`${activity.title}-${activity.activityAt}`} className="flex gap-3">
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-blue-700"
                  title={activity.userName}
                >
                  {activity.avatarUrl ? (
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${activity.avatarUrl})` }}
                    />
                  ) : (
                    <UserRound className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{activity.title}</p>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(activity.activityAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{activity.userName} · {activity.detail}</p>
                  <Badge className={`mt-2 border-0 text-[10px] ${activityTones[activity.type] ?? 'bg-muted text-muted-foreground'}`}>{activity.type}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Akses pengaturan yang paling sering digunakan.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/60">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{action.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{action.description}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
          <CardContent className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold">Platform siap dikembangkan</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-blue-50">
                Dashboard ini sudah disiapkan sebagai pusat monitoring. Data analytics, laporan reader, dan notifikasi bisa dihubungkan ke API pada tahap berikutnya.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-white text-blue-700 hover:bg-blue-50">
                <Link href="/dashboard/platform-settings">
                  <Plus className="h-4 w-4" />
                  Konfigurasi platform
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/dashboard/staff">
                  Kelola tim <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
