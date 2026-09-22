'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, Check, Copy, RefreshCw } from 'lucide-react';
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
import type { CatalogSectionConfig, CreatePlatformPayload, DomainVerificationResponse, Platform, PlatformColors, RatingMode, UpdatePlatformPayload } from '@/lib/types';

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
  homepageSections: CatalogSectionConfig[];
  maxFreeChapters: string;
  showBookStatus: boolean;
  maxTagsPerBook: string;
  searchConsoleVerificationFilename: string;
  searchConsoleVerificationContent: string;
  enableRating: boolean;
  ratingMode: RatingMode;
  enableLike: boolean;
  enableComment: boolean;
  enableShare: boolean;
  seoDefaultH1: string;
  seoDefaultTitle: string;
  seoDefaultDescription: string;
  seoDefaultOgTitle: string;
  seoDefaultOgDescription: string;
  seoDefaultOgType: 'website' | 'book' | 'profile';
  seoPrefix: string;
  seoSuffix: string;
}

const EMPTY_FORM: FormState = {
  nama: '',
  slug: '',
  logoUrl: '',
  faviconUrl: '',
  colors: DEFAULT_COLORS,
  lockStudio: false,
  rendererKey: 'reader',
  homepageSections: [
    { key: 'top', type: 'top', title: 'Top / Hot', enabled: true, layout: 'slider', limit: 10 },
    { key: 'new-updated', type: 'new_updated', title: 'New Updated', enabled: true, layout: 'slider', limit: 10 },
  ],
  maxFreeChapters: '0',
  showBookStatus: true,
  maxTagsPerBook: '5',
  searchConsoleVerificationFilename: '',
  searchConsoleVerificationContent: '',
  enableRating: true,
  ratingMode: 'book',
  enableLike: true,
  enableComment: true,
  enableShare: true,
  seoDefaultH1: '{{title}}',
  seoDefaultTitle: '{{title}} — {{platform}}',
  seoDefaultDescription: 'Baca {{title}} di {{platform}}.',
  seoDefaultOgTitle: '',
  seoDefaultOgDescription: '',
  seoDefaultOgType: 'website',
  seoPrefix: '',
  seoSuffix: '',
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
    homepageSections: platform.homepageSections?.length ? platform.homepageSections : EMPTY_FORM.homepageSections,
    maxFreeChapters: String(platform.maxFreeChapters ?? 0),
    showBookStatus: platform.showBookStatus ?? true,
    maxTagsPerBook: String(platform.maxTagsPerBook ?? 5),
    searchConsoleVerificationFilename: platform.searchConsoleVerificationFilename ?? '',
    searchConsoleVerificationContent: platform.searchConsoleVerificationContent ?? '',
    enableRating: platform.enableRating ?? true,
    ratingMode: platform.ratingMode ?? 'book',
    enableLike: platform.enableLike ?? true,
    enableComment: platform.enableComment ?? true,
    enableShare: platform.enableShare ?? true,
    seoDefaultH1: platform.seoDefaultH1 ?? '',
    seoDefaultTitle: platform.seoDefaultTitle ?? '',
    seoDefaultDescription: platform.seoDefaultDescription ?? '',
    seoDefaultOgTitle: platform.seoDefaultOgTitle ?? '',
    seoDefaultOgDescription: platform.seoDefaultOgDescription ?? '',
    seoDefaultOgType: platform.seoDefaultOgType ?? 'website',
    seoPrefix: platform.seoPrefix ?? '',
    seoSuffix: platform.seoSuffix ?? '',
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

const SEO_TOKENS = ['{{title}}', '{{platform}}', '{{library}}', '{{author}}', '{{bookType}}', '{{prefix}}', '{{suffix}}'];

function SeoTemplateField({
  id,
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  function appendToken(token: string) {
    const field = fieldRef.current;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${token}${value.slice(end)}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      fieldRef.current?.focus();
      const cursor = start + token.length;
      fieldRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          ref={(node) => {
            fieldRef.current = node;
          }}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
        />
      ) : (
        <Input
          ref={(node) => {
            fieldRef.current = node;
          }}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      <div className="flex flex-wrap gap-1">
        {SEO_TOKENS.map((token) => (
          <Button
            key={token}
            type="button"
            variant="outline"
            size="sm"
            className="h-3.5 px-0.5 font-mono text-[8px] leading-none"
            onClick={() => appendToken(token)}
          >
            {token}
          </Button>
        ))}
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

  function updateHomepageSection(index: number, patch: Partial<CatalogSectionConfig>) {
    setForm((prev) => ({
      ...prev,
      homepageSections: prev.homepageSections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, ...patch } : section,
      ),
    }));
  }

  function moveHomepageSection(index: number, direction: -1 | 1) {
    setForm((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.homepageSections.length) return prev;
      const homepageSections = [...prev.homepageSections];
      [homepageSections[index], homepageSections[targetIndex]] = [homepageSections[targetIndex], homepageSections[index]];
      return { ...prev, homepageSections };
    });
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
        homepageSections: form.homepageSections.map((section) => ({
          ...section,
          title: section.title.trim(),
          limit: Math.min(24, Math.max(4, Number(section.limit) || 10)),
        })),
        maxFreeChapters: Math.max(0, Number(form.maxFreeChapters) || 0),
        showBookStatus: form.showBookStatus,
        maxTagsPerBook: Math.max(0, Number(form.maxTagsPerBook) || 0),
        enableRating: form.enableRating,
        ratingMode: form.ratingMode,
        enableLike: form.enableLike,
        enableComment: form.enableComment,
        enableShare: form.enableShare,
        seoDefaultH1: form.seoDefaultH1.trim() || undefined,
        seoDefaultTitle: form.seoDefaultTitle.trim() || undefined,
        seoDefaultDescription: form.seoDefaultDescription.trim() || undefined,
        seoDefaultOgTitle: form.seoDefaultOgTitle.trim() || undefined,
        seoDefaultOgDescription: form.seoDefaultOgDescription.trim() || undefined,
        seoDefaultOgType: form.seoDefaultOgType,
        seoPrefix: form.seoPrefix.trim() || undefined,
        seoSuffix: form.seoSuffix.trim() || undefined,
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
                <Label>Homepage Sections</Label>
                <p className="text-xs text-muted-foreground">
                  Atur section slider yang tampil di halaman katalog publik. Urutan dari atas menjadi urutan tampil.
                </p>
              </div>
              <div className="space-y-3">
                {form.homepageSections.map((section, index) => (
                  <div key={section.key} className="rounded-lg border p-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={(e) => updateHomepageSection(index, { enabled: e.target.checked })}
                        className="mt-1"
                        aria-label={`Tampilkan ${section.title}`}
                      />
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{section.type === 'top' ? 'Top / Hot' : 'New Updated'}</p>
                            <p className="text-xs text-muted-foreground">Layout: slider</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              title="Naikkan section"
                              aria-label="Naikkan section"
                              disabled={index === 0}
                              onClick={() => moveHomepageSection(index, -1)}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              title="Turunkan section"
                              aria-label="Turunkan section"
                              disabled={index === form.homepageSections.length - 1}
                              onClick={() => moveHomepageSection(index, 1)}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                          <div className="space-y-1.5">
                            <Label htmlFor={`section-title-${section.key}`}>Judul section</Label>
                            <Input
                              id={`section-title-${section.key}`}
                              value={section.title}
                              onChange={(e) => updateHomepageSection(index, { title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`section-limit-${section.key}`}>Jumlah Book</Label>
                            <Input
                              id={`section-limit-${section.key}`}
                              type="number"
                              min={4}
                              max={24}
                              value={section.limit}
                              onChange={(e) => updateHomepageSection(index, { limit: Number(e.target.value) || 10 })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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

              <div className="space-y-3 pt-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="enableRating"
                    checked={form.enableRating}
                    onChange={(e) => updateField('enableRating', e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="enableRating">Aktifkan Rating</Label>
                    <p className="text-xs text-muted-foreground">
                      Izinkan pembaca yang login memberi rating 1-5 bintang. Nonaktifkan untuk
                      sembunyikan seluruh tampilan rating dari halaman publik — data lama tetap
                      tersimpan, muncul lagi begitu dinyalakan ulang.
                    </p>
                  </div>
                </div>

                {form.enableRating && (
                  <div className="space-y-1.5 pl-6">
                    <Label htmlFor="ratingMode">Mode Rating</Label>
                    <select
                      id="ratingMode"
                      value={form.ratingMode}
                      onChange={(e) => updateField('ratingMode', e.target.value as RatingMode)}
                      className="flex h-9 w-full max-w-[240px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="book">Per Book (satu rating untuk keseluruhan cerita)</option>
                      <option value="chapter">Per Chapter (tiap Chapter dirating terpisah)</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      <strong>Per Book</strong>: pembaca kasih satu rating untuk keseluruhan Book.{' '}
                      <strong>Per Chapter</strong>: pembaca kasih rating tiap Chapter yang dibaca —
                      lebih akuntabel karena kualitas naskah bisa berubah di chapter-chapter
                      berikutnya. Di kedua mode, halaman detail Book tetap menampilkan satu angka
                      rating gabungan. Mengganti mode TIDAK menghapus data rating mode sebelumnya
                      (tetap tersimpan, berhenti menerima rating baru sampai mode diganti balik).
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Engagement Bar (Fase 8) — tombol di halaman baca Chapter, gaya TikTok/Shorts.
                </p>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="enableLike"
                    checked={form.enableLike}
                    onChange={(e) => updateField('enableLike', e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="enableLike">Aktifkan Like</Label>
                    <p className="text-xs text-muted-foreground">
                      Tombol Like (sekali-tap, terpisah dari Rating bintang di atas) di halaman baca
                      Chapter. Wajib login untuk like.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="enableComment"
                    checked={form.enableComment}
                    onChange={(e) => updateField('enableComment', e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="enableComment">Aktifkan Comment</Label>
                    <p className="text-xs text-muted-foreground">
                      Tombol Comment di halaman baca Chapter. Fase 8 ini masih tampilan mock (belum
                      terhubung percakapan sungguhan) sambil menunggu Bagdja Chat Service selesai.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="enableShare"
                    checked={form.enableShare}
                    onChange={(e) => updateField('enableShare', e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="enableShare">Aktifkan Share</Label>
                    <p className="text-xs text-muted-foreground">
                      Tombol Share (bagikan link Chapter) di halaman baca Chapter.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Kalau Like, Comment, dan Share ketiganya dinonaktifkan, seluruh bar disembunyikan
                  total di halaman baca (tidak ada elemen lain yang dipertahankan sendirian).
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div>
                <Label>Default SEO</Label>
                <p className="text-xs text-muted-foreground">
                  Template default untuk halaman publik. Token: {'{{title}}'}, {'{{platform}}'}, {'{{library}}'}, {'{{author}}'}, {'{{bookType}}'}, {'{{prefix}}'}, {'{{suffix}}'}.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SeoTemplateField id="seoDefaultH1" label="Default H1" value={form.seoDefaultH1} onChange={(value) => updateField('seoDefaultH1', value)} placeholder="{{title}}" />
                <SeoTemplateField id="seoDefaultTitle" label="Default Title" value={form.seoDefaultTitle} onChange={(value) => updateField('seoDefaultTitle', value)} placeholder="{{title}} — {{platform}}" />
                <div className="sm:col-span-2">
                  <SeoTemplateField id="seoDefaultDescription" label="Default Description" value={form.seoDefaultDescription} onChange={(value) => updateField('seoDefaultDescription', value)} placeholder="Baca {{title}} di {{platform}}." multiline />
                </div>
                <SeoTemplateField id="seoDefaultOgTitle" label="Default OG Title" value={form.seoDefaultOgTitle} onChange={(value) => updateField('seoDefaultOgTitle', value)} placeholder="Kosongkan untuk memakai title" />
                <div className="space-y-1.5">
                  <Label htmlFor="seoDefaultOgType">Default OG Type</Label>
                  <select id="seoDefaultOgType" value={form.seoDefaultOgType} onChange={(e) => updateField('seoDefaultOgType', e.target.value as FormState['seoDefaultOgType'])} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="website">website</option>
                    <option value="book">book</option>
                    <option value="profile">profile</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <SeoTemplateField id="seoDefaultOgDescription" label="Default OG Description" value={form.seoDefaultOgDescription} onChange={(value) => updateField('seoDefaultOgDescription', value)} placeholder="Kosongkan untuk memakai description" multiline />
                </div>
                <SeoTemplateField id="seoPrefix" label="Prefix" value={form.seoPrefix} onChange={(value) => updateField('seoPrefix', value)} placeholder="Bagdja" />
                <SeoTemplateField id="seoSuffix" label="Suffix" value={form.seoSuffix} onChange={(value) => updateField('seoSuffix', value)} placeholder="Bookpedia" />
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
