'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Search, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/loading-spinner';
import { usePlatformContext } from '@/context/platform-context';
import { ApiError, apiClient } from '@/lib/api-client';
import type { PlatformUserActivity, PlatformUserActivityResponse } from '@/lib/types';

function formatDate(value: string): string {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function getInitials(item: PlatformUserActivity): string {
  const label = item.displayName || item.username || item.email || 'U';
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function UsersPage() {
  const { activePlatform, loading: platformLoading } = usePlatformContext();
  const [items, setItems] = useState<PlatformUserActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!activePlatform) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (query.trim()) params.set('search', query.trim());
      const response = await apiClient<PlatformUserActivityResponse>(
        `/platforms/${activePlatform.id}/users?${params.toString()}`,
      );
      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal memuat daftar user.');
    } finally {
      setLoading(false);
    }
  }, [activePlatform, query]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  if (platformLoading) return <LoadingSpinner label="Memuat…" />;

  if (!activePlatform) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Belum ada Platform aktif</CardTitle>
          <CardDescription>Buat atau pilih Platform dulu di Platform Settings.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function copyUserId(userId: string) {
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedUserId(userId);
      toast.success('User ID berhasil disalin.');
      window.setTimeout(() => setCopiedUserId((current) => (current === userId ? null : current)), 1500);
    } catch {
      toast.error('User ID gagal disalin.');
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5" /> Users</CardTitle>
          <CardDescription>
            User yang berinteraksi dengan Platform <strong>{activePlatform.nama}</strong>. Total {total} user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(search);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, email, username, atau user ID" className="pl-9" />
            </div>
            <button type="submit" className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Cari</button>
          </form>

          {loading ? <LoadingSpinner /> : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada user yang berinteraksi di Platform ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">User</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Aktivitas</th>
                    <th className="px-3 py-2 font-medium">Aktivitas terakhir</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.userId} className="border-b last:border-0">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                            {item.avatarUrl ? (
                              <img
                                src={item.avatarUrl}
                                alt={item.displayName || item.username || 'Avatar user'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getInitials(item)
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{item.displayName || item.username || 'User'}</div>
                          <div className="flex max-w-[240px] items-center gap-1 text-xs text-muted-foreground">
                            <span className="truncate">{item.userId}</span>
                            <button
                              type="button"
                              onClick={() => void copyUserId(item.userId)}
                              className="shrink-0 rounded p-1 hover:bg-muted hover:text-foreground"
                              aria-label={`Salin User ID ${item.userId}`}
                              title="Salin User ID"
                            >
                              {copiedUserId === item.userId ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{item.email || '—'}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary">Baca {item.readingCount}</Badge>
                          <Badge variant="secondary">Like {item.likeCount}</Badge>
                          <Badge variant="secondary">Rating {item.ratingCount}</Badge>
                          <Badge variant="secondary">Highlight {item.highlightCount}</Badge>
                          {item.libraryCount > 0 && <Badge>Penulis</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{formatDate(item.lastActivityAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
