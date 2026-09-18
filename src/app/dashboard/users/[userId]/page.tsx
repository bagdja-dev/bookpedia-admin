'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, UserRound } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { LoadingSpinner } from '@/components/loading-spinner';
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

  useEffect(() => {
    if (!activePlatform) return;
    let cancelled = false;
    setLoading(true);
    apiClient<PlatformUserReadingResponse>(
      `/platforms/${activePlatform.id}/users/${encodeURIComponent(userId)}/reading`,
    )
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof ApiError ? error.message : 'Gagal memuat statistik user.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activePlatform, userId]);

  if (platformLoading || loading) return <LoadingSpinner label="Memuat statistik user…" />;

  if (!activePlatform || !profile) {
    return <p className="text-sm text-destructive">Statistik user tidak tersedia.</p>;
  }

  const displayName = profile.displayName || profile.username || profile.email || 'User';

  return (
    <div className="space-y-6">
      <Link href="/dashboard/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Users
      </Link>

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
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada reading list di Platform ini.</p>
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
  );
}
