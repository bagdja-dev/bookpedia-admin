'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, UserRound } from 'lucide-react';
import { use, useCallback, useEffect, useRef, useState } from 'react';

import { LoadingSpinner } from '@/components/loading-spinner';
import { EmptyState } from '@/components/admin/empty-state';
import { ErrorState } from '@/components/admin/error-state';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlatformContext } from '@/context/platform-context';
import { ApiError, apiClient } from '@/lib/api-client';
import type { PlatformUserReadingResponse } from '@/lib/types';

function formatDate(value: string): string {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function getInitials(profile: PlatformUserReadingResponse): string {
  const label = profile.displayName || profile.username || profile.email || 'U';
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getPublicBookUrl(platform: { slug: string; domain: string | null }, bookSlug: string): string {
  const host = platform.domain || `${platform.slug}.bookpedia.bagdja.com`;
  return `https://${host}/book/${encodeURIComponent(bookSlug)}`;
}

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { activePlatform, loading: platformLoading } = usePlatformContext();
  const [profile, setProfile] = useState<PlatformUserReadingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadProfile = useCallback(async () => {
    if (!activePlatform) return;
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiClient<PlatformUserReadingResponse>(
        `/platforms/${activePlatform.id}/users/${encodeURIComponent(userId)}/reading`,
      );
      if (currentRequestId !== requestId.current) return;
      setProfile(data);
    } catch (error) {
      if (currentRequestId !== requestId.current) return;
      setLoadError(error instanceof ApiError ? error.message : 'Gagal memuat statistik user.');
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [activePlatform, userId]);

  useEffect(() => {
    void loadProfile();
    return () => {
      requestId.current += 1;
    };
  }, [loadProfile]);

  if (platformLoading || (activePlatform && loading)) return <LoadingSpinner label="Memuat statistik user…" />;

  if (!activePlatform) {
    return <EmptyState title="Belum ada Platform aktif" description="Pilih Platform terlebih dahulu untuk melihat aktivitas pengguna." />;
  }

  const displayName = profile ? profile.displayName || profile.username || profile.email || 'User' : 'Detail User';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aktivitas pengguna"
        description={`Riwayat ${displayName} di Platform ${activePlatform.nama}.`}
        actions={
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/users"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Users</Link>
          </Button>
        }
      />

      {loadError ? (
        <ErrorState title="Statistik pengguna gagal dimuat" description={loadError} onRetry={() => void loadProfile()} />
      ) : !profile ? (
        <EmptyState title="Data pengguna tidak tersedia" description="Pengguna mungkin tidak lagi memiliki aktivitas di Platform ini." />
      ) : (
      <div className="space-y-6">

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-semibold text-muted-foreground">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={`Avatar ${displayName}`} className="h-full w-full object-cover" />
              ) : (
                getInitials(profile)
              )}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5" /> {displayName}</CardTitle>
              <CardDescription>{profile.email || profile.username || profile.userId}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">User ID: {profile.userId}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Reading List</CardTitle>
          <CardDescription>{profile.readingList.length} Book yang pernah dibaca di {activePlatform.nama}.</CardDescription>
        </CardHeader>
        <CardContent>
          {profile.readingList.length === 0 ? (
            <EmptyState title="Belum ada reading list" description="Book yang pernah dibaca pengguna akan muncul di sini." />
          ) : (
            <div className="space-y-3">
              {profile.readingList.map((item) => (
                <a
                  key={item.bookId}
                  href={getPublicBookUrl(activePlatform, item.bookSlug)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-muted text-xs text-muted-foreground">
                    {item.bookCoverUrl ? (
                      <img src={item.bookCoverUrl} alt={`Sampul ${item.bookTitle}`} className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.bookTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      Terakhir dibaca: Bab {item.lastChapterOrderIndex}. {item.lastChapterTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.lastReadAt)}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">Bab {item.lastChapterOrderIndex}</span>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
      )}
    </div>
  );
}
