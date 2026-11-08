'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, RefreshCw, Search, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/loading-spinner';
import { usePlatformContext } from '@/context/platform-context';
import { ApiError, apiClient } from '@/lib/api-client';
import type { PlatformDonation, PlatformDonationListResponse } from '@/lib/types';

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: 'PAID', label: 'Berhasil' },
  { value: 'PENDING', label: 'Menunggu pembayaran' },
  { value: 'INITIALIZING', label: 'Sedang diproses' },
  { value: 'FAILED', label: 'Gagal' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function getStatusLabel(status: string): string {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function DonationStatusBadge({ status }: { status: string }) {
  if (status === 'PAID') return <Badge>Berhasil</Badge>;
  if (status === 'PENDING' || status === 'INITIALIZING') {
    return <Badge variant="secondary">{getStatusLabel(status)}</Badge>;
  }
  return <Badge variant="outline">{getStatusLabel(status)}</Badge>;
}

function DonationRow({ donation }: { donation: PlatformDonation }) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-3 py-3">
        <div className="font-medium">{donation.donorName || 'Donatur'}</div>
        <div className="text-xs text-muted-foreground">{donation.donorEmail || 'Identitas tidak tersedia'}</div>
      </td>
      <td className="px-3 py-3 font-medium">{formatCurrency(donation.amount, donation.currency)}</td>
      <td className="px-3 py-3">{donation.optionTitle}</td>
      <td className="px-3 py-3"><DonationStatusBadge status={donation.status} /></td>
      <td className="px-3 py-3 text-muted-foreground">{formatDate(donation.paidAt || donation.createdAt)}</td>
    </tr>
  );
}

export default function DonationHistoryPage() {
  const { activePlatform, loading: platformLoading } = usePlatformContext();
  const [items, setItems] = useState<PlatformDonation[]>([]);
  const [summary, setSummary] = useState<PlatformDonationListResponse['summary']>({
    paidCount: 0,
    paidAmount: 0,
    uniqueDonorCount: 0,
    pendingCount: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDonations = useCallback(async () => {
    if (!activePlatform) {
      setItems([]);
      setTotal(0);
      setSummary({ paidCount: 0, paidAmount: 0, uniqueDonorCount: 0, pendingCount: 0 });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (submittedSearch) params.set('search', submittedSearch);
      if (status) params.set('status', status);
      const response = await apiClient<PlatformDonationListResponse>(
        `/platforms/${activePlatform.id}/donations?${params.toString()}`,
      );
      setItems(response.items);
      setTotal(response.total);
      setSummary(response.summary);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal memuat riwayat donasi.');
    } finally {
      setLoading(false);
    }
  }, [activePlatform, page, status, submittedSearch]);

  useEffect(() => {
    // This starts an async API request; state updates happen when its response arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDonations();
  }, [loadDonations]);

  if (platformLoading) return <LoadingSpinner label="Memuat…" />;

  if (!activePlatform) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Belum ada Platform aktif</CardTitle>
          <CardDescription>Buat atau pilih Platform terlebih dahulu.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Riwayat Donasi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau donatur dan pembayaran untuk <strong>{activePlatform.nama}</strong>.
          </p>
        </div>
        <Button type="button" variant="outline" disabled={loading} onClick={() => void loadDonations()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Muat ulang
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total donasi berhasil</CardDescription>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-xl font-semibold">{formatCurrency(summary.paidAmount, 'IDR')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Transaksi berhasil</CardDescription>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-xl font-semibold">{summary.paidCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Donatur berhasil</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-xl font-semibold">{summary.uniqueDonorCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Menunggu pembayaran</CardDescription>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-xl font-semibold">{summary.pendingCount}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaksi donasi</CardTitle>
          <CardDescription>
            Identitas donatur dicatat untuk transaksi baru setelah migrasi database diterapkan. Data transaksi lama mungkin belum memiliki nama atau email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSubmittedSearch(search.trim());
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama atau email donatur"
                className="pl-9"
              />
            </div>
            <select
              aria-label="Filter status donasi"
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Button type="submit">Cari</Button>
          </form>

          {loading ? <LoadingSpinner label="Memuat donasi…" /> : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada transaksi donasi yang cocok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Donatur</th>
                    <th className="px-3 py-2 font-medium">Nominal</th>
                    <th className="px-3 py-2 font-medium">Pilihan</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Waktu</th>
                  </tr>
                </thead>
                <tbody>{items.map((item) => <DonationRow key={item.id} donation={item} />)}</tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {total === 0 ? '0 transaksi' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} dari ${total} transaksi`}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {pageCount}</span>
              <Button type="button" variant="outline" size="sm" disabled={page >= pageCount || loading} onClick={() => setPage((current) => current + 1)}>
                Berikutnya <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
