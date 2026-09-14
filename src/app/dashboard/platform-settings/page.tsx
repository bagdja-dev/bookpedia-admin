'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/image-upload';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ACTIVE_PLATFORM_STORAGE_KEY, usePlatformContext } from '@/context/platform-context';
import { ApiError, apiClient, slugify } from '@/lib/api-client';
import type { CreatePlatformPayload, DomainVerificationResponse, Platform, PlatformColors, UpdatePlatformPayload } from '@/lib/types';

const DEFAULT_COLORS: PlatformColors = {
  bg: '#fbf6ee',
  surface: '#fffdf8',
  foreground: '#2c2114',
  muted: '#7a6c57',
  border: '#e6d9c3',
  terracotta: '#c1502e',
  terracottaForeground: '#fdf8f0',
  mustard: '#d79a2c',
  olive: '#6b7a4c',
};

/** Label manusiawi + urutan tampil untuk tiap key `PlatformColors`. */
const COLOR_FIELD_LABELS: Array<{ key: keyof PlatformColors; label: string }> = [
  { key: 'bg', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'foreground', label: 'Foreground (teks)' },
  { key: 'muted', label: 'Muted (teks redup)' },
  { key: 'border', label: 'Border' },
  { key: 'terracotta', label: 'Terracotta (aksen utama)' },
  { key: 'terracottaForeground', label: 'Terracotta Foreground' },
  { key: 'mustard', label: 'Mustard (aksen)' },
  { key: 'olive', label: 'Olive (aksen)' },
];

interface FormState {
  nama: string;
  slug: string;
  logoUrl: string;
  faviconUrl: string;
  colors: PlatformColors;
  lockStudio: boolean;
  rendererKey: string;
  maxFreeChapters: string;
  showBookStatus: boolean;
  maxTagsPerBook: string;
  searchConsoleVerificationFilename: string;
  searchConsoleVerificationContent: string;
}

const EMPTY_FORM: FormState = {
  nama: '',
  slug: '',
  logoUrl: '',
  faviconUrl: '',
  colors: DEFAULT_COLORS,
  lockStudio: false,
  rendererKey: 'reader',
  maxFreeChapters: '0',
  showBookStatus: true,
  maxTagsPerBook: '5',
  searchConsoleVerificationFilename: '',
  searchConsoleVerificationContent: '',
};

function platformToForm(platform: Platform): FormState {
  return {
    nama: platform.nama ?? '',
    slug: platform.slug ?? '',
    logoUrl: platform.logoUrl ?? '',
    faviconUrl: platform.faviconUrl ?? '',
    colors: { ...DEFAULT_COLORS, ...platform.colors },
    lockStudio: platform.lockStudio ?? false,
    rendererKey: platform.rendererKey || 'reader',
    maxFreeChapters: String(platform.maxFreeChapters ?? 0),
    showBookStatus: platform.showBookStatus ?? true,
    maxTagsPerBook: String(platform.maxTagsPerBook ?? 5),
    searchConsoleVerificationFilename: platform.searchConsoleVerificationFilename ?? '',
    searchConsoleVerificationContent: platform.searchConsoleVerificationContent ?? '',
  };
}

/** Swatch native `<input type="color">` + input hex teks berdampingan, dua arah saling sinkron. */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValidHex ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded border p-0.5"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

/** Satu baris tabel DNS record (mis. TXT/A) — pola tampilan mirip panel "Domains" Vercel, dengan tombol salin per baris. Port persis bagdja-auction-admin. */
function DomainRecordRow({
  type,
  name,
  value,
  placeholder,
  fieldKey,
  copiedField,
  onCopy,
  last = false,
}: {
  type: string;
  name: string;
  value: string;
  placeholder?: string;
  fieldKey: string;
  copiedField: string | null;
  onCopy: (field: string, value: string) => void;
  last?: boolean;
}) {
  const isEmpty = !value;
  const copied = copiedField === fieldKey;

  return (
    <tr className={last ? '' : 'border-b'}>
      <td className="px-3 py-2 align-top font-mono text-xs">{type}</td>
      <td className="px-3 py-2 align-top font-mono text-xs break-all">{name}</td>
      <td className={`px-3 py-2 align-top font-mono text-xs break-all ${isEmpty ? 'text-muted-foreground' : ''}`}>
        {isEmpty ? (placeholder ?? '—') : value}
      </td>
      <td className="px-3 py-2 align-top">
        {!isEmpty && (
          <button
            type="button"
            onClick={() => onCopy(fieldKey, value)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Salin nilai"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </td>
    </tr>
  );
}

export default function PlatformSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { platforms, activePlatform, isOwner, loading, refresh } = usePlatformContext();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [removingDomain, setRemovingDomain] = useState(false);
  const [domainVerifyInfo, setDomainVerifyInfo] = useState<DomainVerificationResponse | null>(null);
  const [domainMessage, setDomainMessage] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Domain custom belum ada di form Platform (kolom `domain` di-set lewat
  // endpoint verify/check, bukan field yang diedit langsung di sini — beda
  // dari Market yang punya field `domain` di form utama). Verifikasi
  // menargetkan `selectedPlatform.domain` yang SUDAH persisted.
  const [domainInput, setDomainInput] = useState('');

  const isCreating = isOwner && selectedId === null;

  const selectedPlatform = useMemo(
    () => platforms.find((p) => p.id === selectedId) ?? null,
    [platforms, selectedId],
  );

  const savedDomain = selectedPlatform?.domain ?? '';

  // Selalu ikuti `activePlatform` (di-set Topbar switcher) — BUKAN cuma
  // sekali saat `selectedId` masih null (bug: ganti Platform lewat dropdown
  // sebelumnya tidak pernah men-sinkronkan ulang form ini). Dikunci ke
  // `activePlatform?.id` (bukan objeknya) supaya refresh() akibat aksi lain
  // (simpan form, verifikasi domain) TIDAK menimpa diam-diam edit yang
  // sedang berjalan kalau id-nya tidak berubah — panel domain sendiri sudah
  // baca `selectedPlatform` langsung (live dari `platforms`), tidak perlu
  // effect ini refire untuk itu.
  useEffect(() => {
    if (loading) return;

    const wantsCreate = searchParams.get('mode') === 'create';
    if (wantsCreate) {
      setSelectedId(null);
      setForm(EMPTY_FORM);
      setSlugTouched(false);
      return;
    }

    if (activePlatform) {
      setSelectedId(activePlatform.id);
      setForm(platformToForm(activePlatform));
      setSlugTouched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, activePlatform?.id, searchParams]);

  // Ganti Platform yang diedit -> instruksi verifikasi domain Platform
  // sebelumnya tidak relevan lagi, jangan biarkan nyangkut di layar.
  useEffect(() => {
    setDomainVerifyInfo(null);
    setDomainMessage(null);
    setDomainError(null);
    setDomainInput(selectedPlatform?.domain ?? '');
  }, [selectedId, selectedPlatform?.domain]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'nama' && !slugTouched) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  function updateColorField(key: keyof PlatformColors, value: string) {
    setForm((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmitting(true);
    try {
      const payload: CreatePlatformPayload & Partial<UpdatePlatformPayload> = {
        nama: form.nama.trim(),
        slug: form.slug.trim(),
        logoUrl: form.logoUrl.trim() || undefined,
        faviconUrl: form.faviconUrl.trim() || undefined,
        colors: form.colors,
        lockStudio: form.lockStudio,
        rendererKey: form.rendererKey.trim() || 'reader',
        maxFreeChapters: Math.max(0, Number(form.maxFreeChapters) || 0),
        showBookStatus: form.showBookStatus,
        maxTagsPerBook: Math.max(0, Number(form.maxTagsPerBook) || 0),
        // Cuma relevan saat edit (Platform belum punya id saat create) —
        // dikirim null kalau dikosongkan supaya bisa "dihapus" dari form ini.
        ...(!isCreating
          ? {
              searchConsoleVerificationFilename: form.searchConsoleVerificationFilename.trim() || null,
              searchConsoleVerificationContent: form.searchConsoleVerificationContent.trim() || null,
            }
          : {}),
      };

      if (isCreating) {
        const created = await apiClient<Platform>('/platforms', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success(`Platform "${created.nama}" berhasil dibuat.`);

        // Jadikan Platform baru ini aktif SEBELUM refresh() — refresh()
        // baca localStorage lalu cocokkan ke daftar Platform hasil fetch
        // terbaru (yang sudah termasuk Platform ini). Keluar dari
        // `?mode=create` juga wajib — kalau tidak, klik "Tambah Platform"
        // berikutnya tidak memicu navigasi sama sekali (URL sudah identik),
        // dan form tertinggal berisi data yang baru saja disubmit alih-alih
        // kosong (bug yang dilaporkan).
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(ACTIVE_PLATFORM_STORAGE_KEY, created.id);
        }
        router.replace('/dashboard/platform-settings');
      } else if (selectedPlatform) {
        const updated = await apiClient<Platform>(`/platforms/${selectedPlatform.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success(`Platform "${updated.nama}" berhasil disimpan.`);
      }

      await refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.status === 403 ? 'Hanya Owner yang boleh membuat Platform baru.' : err.message);
      } else {
        toast.error(err instanceof Error ? err.message : 'Gagal menyimpan Platform.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDomain() {
    if (!selectedPlatform || !domainInput.trim()) return;
    setSubmitting(true);
    try {
      await apiClient<Platform>(`/platforms/${selectedPlatform.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ domain: domainInput.trim() }),
      });
      await refresh();
      // `savedDomain` (dari selectedPlatform.domain) baru ter-update setelah
      // refresh() selesai me-refetch — useEffect auto-verify di bawah akan
      // langsung jalan begitu itu terjadi.
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal menyimpan domain.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyDomain() {
    if (!selectedPlatform) return;
    setVerifyingDomain(true);
    setDomainError(null);
    setDomainMessage(null);
    try {
      const info = await apiClient<DomainVerificationResponse>(
        `/platforms/${selectedPlatform.id}/domain/verify`,
        { method: 'POST' },
      );
      setDomainVerifyInfo(info);
    } catch (err) {
      setDomainError(err instanceof ApiError ? err.message : 'Gagal memulai verifikasi domain.');
    } finally {
      setVerifyingDomain(false);
    }
  }

  async function handleCheckDomain() {
    if (!selectedPlatform) return;
    setCheckingDomain(true);
    setDomainError(null);
    setDomainMessage(null);
    try {
      await apiClient(`/platforms/${selectedPlatform.id}/domain/check`, { method: 'POST' });
      setDomainMessage('Domain berhasil diverifikasi.');
      await refresh();
    } catch (err) {
      setDomainError(err instanceof ApiError ? err.message : 'Gagal memeriksa status verifikasi.');
    } finally {
      setCheckingDomain(false);
    }
  }

  async function handleRemoveDomain() {
    if (!selectedPlatform) return;
    if (!window.confirm('Hapus domain kustom Platform ini? Verifikasi yang sudah ada juga akan direset.')) {
      return;
    }
    setRemovingDomain(true);
    setDomainError(null);
    setDomainMessage(null);
    try {
      await apiClient(`/platforms/${selectedPlatform.id}/domain`, { method: 'DELETE' });
      setDomainVerifyInfo(null);
      setDomainInput('');
      await refresh();
      toast.success('Domain kustom berhasil dihapus.');
    } catch (err) {
      setDomainError(err instanceof ApiError ? err.message : 'Gagal menghapus domain.');
    } finally {
      setRemovingDomain(false);
    }
  }

  // Auto-tampilkan record DNS begitu domain tersimpan & belum terverifikasi
  // — pola sama Vercel (langsung tampil record begitu domain ditambahkan,
  // bukan nunggu user klik tombol "Verify" dulu). Idempotent di sisi backend
  // (reuse token lama), jadi aman dipanggil ulang tiap kali efek ini jalan.
  useEffect(() => {
    if (!savedDomain || !selectedPlatform || selectedPlatform.domainVerifiedAt) return;
    if (domainVerifyInfo || verifyingDomain) return;
    void handleVerifyDomain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedDomain, selectedPlatform, domainVerifyInfo, verifyingDomain]);

  async function handleCopy(field: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField((prev) => (prev === field ? null : prev)), 1500);
    } catch {
      // Clipboard API bisa gagal (context tidak secure/permission ditolak) —
      // non-kritikal, user masih bisa select-and-copy manual dari tabel.
    }
  }

  if (loading) {
    return <LoadingSpinner label="Memuat data Platform…" />;
  }

  if (!isOwner && !activePlatform) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Belum ada Platform</CardTitle>
          <CardDescription>
            Anda belum terdaftar sebagai staff di Platform manapun. Hubungi Owner untuk mendapatkan undangan.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{isCreating ? 'Tambah Platform Baru' : `Edit Platform — ${form.nama || '...'}`}</CardTitle>
          <CardDescription>
            {isCreating
              ? 'Isi detail Platform baru. Slug dipakai untuk subdomain publik (mis. {slug}.bookpedia.bagdja.com).'
              : 'Perbarui pengaturan Platform ini. Slug bisa diubah manual, tapi hati-hati — itu mengubah subdomain publik yang sedang aktif.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nama">Nama Platform</Label>
                <Input
                  id="nama"
                  value={form.nama}
                  onChange={(e) => updateField('nama', e.target.value)}
                  placeholder="Teknobuku"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    updateField('slug', slugify(e.target.value));
                  }}
                  placeholder="teknobuku"
                  required
                />
                {!isCreating && (
                  <p className="text-xs text-amber-600">
                    Mengubah slug langsung mengubah subdomain publik Platform ini — link/bookmark lama ke
                    subdomain sebelumnya akan berhenti berfungsi.
                  </p>
                )}
              </div>
              <ImageUpload
                id="logoUrl"
                label="Logo"
                folder="platforms"
                value={form.logoUrl}
                onChange={(url) => updateField('logoUrl', url)}
                disabled={submitting}
                onUploadingChange={setLogoUploading}
                previewWidth={144}
                previewHeight={64}
              />
              <ImageUpload
                id="faviconUrl"
                label="Favicon"
                folder="platforms"
                value={form.faviconUrl}
                onChange={(url) => updateField('faviconUrl', url)}
                disabled={submitting}
                onUploadingChange={setFaviconUploading}
                previewWidth={64}
                previewHeight={64}
              />
              <div className="space-y-1.5">
                <Label htmlFor="rendererKey">Renderer Key</Label>
                <Input
                  id="rendererKey"
                  value={form.rendererKey}
                  onChange={(e) => updateField('rendererKey', e.target.value)}
                  placeholder="reader"
                />
                <p className="text-xs text-muted-foreground">
                  Satu-satunya template yang ada saat ini adalah &ldquo;reader&rdquo;. Renderer baru
                  (mis. musik) ditambahkan nanti begitu benar-benar dibutuhkan.
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div>
                <Label>Colors</Label>
                <p className="text-xs text-muted-foreground">Skema warna reader Platform ini.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {COLOR_FIELD_LABELS.map(({ key, label }) => (
                  <ColorField
                    key={key}
                    label={label}
                    value={form.colors[key]}
                    onChange={(value) => updateColorField(key, value)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 border-t pt-4">
              <input
                type="checkbox"
                id="lockStudio"
                checked={form.lockStudio}
                onChange={(e) => updateField('lockStudio', e.target.checked)}
                className="mt-1"
              />
              <div>
                <Label htmlFor="lockStudio">Kunci Pendaftaran Penulis</Label>
                <p className="text-xs text-muted-foreground">
                  Kalau aktif, POST /libraries ditutup untuk Platform ini — TANPA pengecualian.
                  Satu-satunya jalur saat terkunci adalah insert manual ke DB oleh tim Bagdja.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 border-t pt-4">
              <Label htmlFor="maxFreeChapters">Maximum Free Chapter</Label>
              <Input
                id="maxFreeChapters"
                type="number"
                min={0}
                value={form.maxFreeChapters}
                onChange={(e) => updateField('maxFreeChapters', e.target.value)}
                className="max-w-[160px]"
              />
              <p className="text-xs text-muted-foreground">
                Jumlah Chapter pertama tiap Book (di Platform ini) yang bisa dibaca TANPA login — untuk
                SEO & memberi calon pembaca &ldquo;coba baca&rdquo; sebelum daftar.{' '}
                <strong>Isi 0 = SEMUA Chapter gratis</strong> (bukan &ldquo;nol Chapter gratis&rdquo;).
                Penulis bisa override nilai ini per-Book (harus 0 atau lebih besar dari nilai di sini).
              </p>

              <div className="flex items-start gap-2 pt-3">
                <input
                  type="checkbox"
                  id="showBookStatus"
                  checked={form.showBookStatus}
                  onChange={(e) => updateField('showBookStatus', e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="showBookStatus">Tampilkan Status Cerita</Label>
                  <p className="text-xs text-muted-foreground">
                    Tampilkan badge status (Draft/Berlanjut/Tamat) di katalog, profil Library, dan detail
                    Book yang dilihat pembaca. Nonaktifkan kalau tidak ingin status ini terlihat publik —
                    penulis di Studio tetap bisa melihat & mengubah status seperti biasa.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-3">
                <Label htmlFor="maxTagsPerBook">Maximum Tag per Book</Label>
                <Input
                  id="maxTagsPerBook"
                  type="number"
                  min={0}
                  value={form.maxTagsPerBook}
                  onChange={(e) => updateField('maxTagsPerBook', e.target.value)}
                  className="max-w-[160px]"
                />
                <p className="text-xs text-muted-foreground">
                  batas jumlah Tag bebas yang boleh dilekatkan penulis ke satu Book (autocomplete
                  Tag dari yang sudah pernah dipakai penulis lain di Platform ini).
                </p>
              </div>
            </div>

            {!isCreating && (
              <div className="space-y-3 border-t pt-4">
                <div>
                  <Label>Verifikasi Google Search Console</Label>
                  <p className="text-xs text-muted-foreground">
                    Metode &ldquo;HTML file&rdquo; dari Search Console — paste nama file & isinya persis dari
                    Google. Dibalas otomatis oleh app di domain manapun (subdomain atau custom domain) yang
                    resolve ke Platform ini.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="searchConsoleVerificationFilename">Nama File</Label>
                  <Input
                    id="searchConsoleVerificationFilename"
                    value={form.searchConsoleVerificationFilename}
                    onChange={(e) => updateField('searchConsoleVerificationFilename', e.target.value)}
                    placeholder="google9bbe81680154a078.html"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="searchConsoleVerificationContent">Isi File</Label>
                  <Textarea
                    id="searchConsoleVerificationContent"
                    value={form.searchConsoleVerificationContent}
                    onChange={(e) => updateField('searchConsoleVerificationContent', e.target.value)}
                    placeholder="google-site-verification: google9bbe81680154a078.html"
                    className="font-mono text-xs"
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" disabled={submitting || logoUploading || faviconUploading}>
                {submitting
                  ? 'Menyimpan…'
                  : logoUploading || faviconUploading
                    ? 'Menunggu upload…'
                    : isCreating
                      ? 'Buat Platform'
                      : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!isCreating && selectedPlatform && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Domain Kustom</CardTitle>
            <CardDescription>
              Domain milik Anda sendiri untuk Platform ini (mis. teknobuku.com). Isi lalu klik
              &ldquo;Simpan &amp; Verifikasi&rdquo;.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="teknobuku.com"
                  disabled={Boolean(savedDomain)}
                />
              </div>
              {!savedDomain && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!domainInput.trim() || submitting}
                  onClick={handleSaveDomain}
                >
                  {submitting ? 'Menyimpan…' : 'Simpan & Verifikasi'}
                </Button>
              )}
            </div>

            {savedDomain && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{savedDomain}</span>
                  {selectedPlatform.domainVerifiedAt ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Terverifikasi
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Verifikasi Diperlukan
                    </span>
                  )}
                  <div className="ml-auto flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={checkingDomain}
                      onClick={handleCheckDomain}
                    >
                      <RefreshCw className={`mr-1 h-4 w-4 ${checkingDomain ? 'animate-spin' : ''}`} />
                      {checkingDomain ? 'Memeriksa…' : 'Refresh'}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={removingDomain}
                      onClick={handleRemoveDomain}
                    >
                      {removingDomain ? 'Menghapus…' : 'Hapus'}
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {selectedPlatform.domainVerifiedAt
                    ? `Terverifikasi sejak ${new Date(selectedPlatform.domainVerifiedAt).toLocaleString('id-ID')}. TLS/HTTPS domain ini tetap tanggung jawab Anda lewat akun Cloudflare sendiri.`
                    : 'Perbarui DNS record di penyedia domain Anda agar sesuai dengan yang tercantum di bawah. Ini memverifikasi kepemilikan domain sekaligus mengarahkannya ke platform kami.'}
                </p>

                {domainMessage && <p className="text-sm text-emerald-600">{domainMessage}</p>}
                {domainError && (
                  <p className="text-sm text-destructive">
                    {domainError}{' '}
                    {!domainVerifyInfo && (
                      <button type="button" onClick={handleVerifyDomain} className="underline">
                        Coba lagi
                      </button>
                    )}
                  </p>
                )}

                {verifyingDomain && !domainVerifyInfo && (
                  <p className="text-sm text-muted-foreground">Memuat record DNS…</p>
                )}

                {domainVerifyInfo && (
                  <>
                    <div className="overflow-x-auto rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                            <th className="px-3 py-2 font-medium">Tipe</th>
                            <th className="px-3 py-2 font-medium">Nama</th>
                            <th className="px-3 py-2 font-medium">Nilai</th>
                            <th className="px-3 py-2 font-medium" />
                          </tr>
                        </thead>
                        <tbody>
                          <DomainRecordRow
                            type="TXT"
                            name={domainVerifyInfo.recordName}
                            value={domainVerifyInfo.recordValue}
                            fieldKey="txt"
                            copiedField={copiedField}
                            onCopy={handleCopy}
                          />
                          <DomainRecordRow
                            type={domainVerifyInfo.dnsTarget.recordType}
                            name={domainVerifyInfo.dnsTarget.recordName}
                            value={domainVerifyInfo.dnsTarget.recordValue}
                            placeholder="(gagal deteksi otomatis — muat ulang halaman ini untuk coba lagi)"
                            fieldKey="a"
                            copiedField={copiedField}
                            onCopy={handleCopy}
                            last
                          />
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Perubahan DNS bisa perlu beberapa menit untuk propagasi. Klik &ldquo;Refresh&rdquo; di
                      atas untuk cek ulang setelah menambahkan record.
                    </p>
                    <div className="rounded-md border bg-muted/30 p-3 text-sm">
                      <p className="font-medium">Aktifkan HTTPS lewat Cloudflare Anda sendiri</p>
                      <p className="mt-1 text-muted-foreground">
                        Daftarkan domain ini di akun Cloudflare Anda, aktifkan proxy (awan oranye), lalu set
                        mode SSL/TLS ke &ldquo;Full&rdquo;. Cloudflare akan otomatis mengurus sertifikat HTTPS
                        untuk pengunjung Anda — bukan tanggung jawab kami.
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
