'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Heart, ImagePlus, Plus, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { usePlatformContext } from '@/context/platform-context';
import { apiClient } from '@/lib/api-client';
import { uploadImage, UploadImageError } from '@/lib/upload-image';
import type {
  DonationLocation,
  DonationOption,
  DonationSettings,
  DonationSettingsResponse,
} from '@/lib/types';

const EMPTY_SETTINGS: DonationSettings = {
  enabled: false,
  title: 'Dukung operasional platform ini',
  description: 'Donasi sukarela ini membantu biaya operasional platform.',
  buttonLabel: 'Dukung platform',
  locations: [],
  options: [],
};

const LOCATIONS: Array<{ value: DonationLocation; label: string; description: string }> = [
  { value: 'home', label: 'Beranda', description: 'Kartu dukungan di katalog utama.' },
  { value: 'book_detail', label: 'Detail buku', description: 'Kartu dukungan di halaman detail buku.' },
  { value: 'chapter_end', label: 'Ujung chapter', description: 'Kartu dukungan setelah pembaca selesai membaca.' },
  { value: 'footer', label: 'Footer', description: 'Tautan ringkas di footer reader.' },
  { value: 'reader_menu', label: 'Menu reader', description: 'Tautan ringkas di navigasi reader.' },
];

function createOption(type: DonationOption['type']): DonationOption {
  return {
    id: crypto.randomUUID(),
    title: type === 'fixed' ? 'Dukungan pembaca' : 'Nominal lainnya',
    description: '',
    type,
    ...(type === 'fixed' ? { amount: 10000 } : { multiple: 5000 }),
    isActive: true,
    isPopular: false,
  };
}

function DonationOptionImageUpload({
  option,
  disabled,
  onChange,
}: {
  option: DonationOption;
  disabled: boolean;
  onChange: (imageUrl: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadImage(file, 'platform-donations');
      onChange(result.url);
    } catch (cause) {
      setError(cause instanceof UploadImageError ? cause.message : 'Gagal mengunggah ilustrasi.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-1.5 text-sm">
      <span className="block font-medium">Ilustrasi nominal</span>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-background text-muted-foreground">
          {option.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={option.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Heart className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <input
          ref={inputRef}
          id={`donation-option-image-${option.id}`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(event) => void handleUpload(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          {uploading ? 'Mengunggah…' : option.imageUrl ? 'Ganti gambar' : 'Upload gambar'}
        </Button>
        {option.imageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => {
              onChange(undefined);
              setError(null);
            }}
          >
            <X className="mr-1 h-4 w-4" />
            Hapus
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, atau GIF — maks. 5 MB.</p>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function DonationsSettingsPage() {
  const { activePlatform, loading: platformLoading } = usePlatformContext();
  const [settings, setSettings] = useState<DonationSettings>(EMPTY_SETTINGS);
  const [recipientConfigured, setRecipientConfigured] = useState(false);
  const [loadedPlatformId, setLoadedPlatformId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!activePlatform) return;

    let cancelled = false;
    apiClient<DonationSettingsResponse>(`/platforms/${activePlatform.id}/donation-settings`)
      .then((response) => {
        if (cancelled) return;
        setSettings(response.settings);
        setRecipientConfigured(response.recipientConfigured);
        setError(null);
        setLoadFailed(false);
        setLoadedPlatformId(activePlatform.id);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setSettings(EMPTY_SETTINGS);
        setRecipientConfigured(false);
        setLoadFailed(true);
        setError(cause instanceof Error ? cause.message : 'Pengaturan donasi gagal dimuat.');
        setLoadedPlatformId(activePlatform.id);
      });

    return () => {
      cancelled = true;
    };
  }, [activePlatform]);

  function updateOption(id: string, patch: Partial<DonationOption>) {
    setSettings((current) => ({
      ...current,
      options: current.options.map((option) => option.id === id ? { ...option, ...patch } : option),
    }));
  }

  function toggleLocation(location: DonationLocation) {
    setSettings((current) => ({
      ...current,
      locations: current.locations.includes(location)
        ? current.locations.filter((item) => item !== location)
        : [...current.locations, location],
    }));
  }

  async function saveSettings() {
    if (!activePlatform) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await apiClient<DonationSettingsResponse>(
        `/platforms/${activePlatform.id}/donation-settings`,
        { method: 'PATCH', body: JSON.stringify(settings) },
      );
      setSettings(response.settings);
      setRecipientConfigured(response.recipientConfigured);
      setNotice('Pengaturan donasi berhasil disimpan.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Pengaturan donasi gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  if (platformLoading || (activePlatform && loadedPlatformId !== activePlatform.id)) {
    return <LoadingSpinner label="Memuat pengaturan donasi…" />;
  }
  if (!activePlatform) {
    return <p className="text-sm text-muted-foreground">Pilih Platform terlebih dahulu.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Donasi Platform</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atur dukungan sukarela untuk biaya operasional {activePlatform.nama}. Donasi ini bukan untuk penulis atau buku tertentu.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5" /> Status dan ajakan</CardTitle>
          <CardDescription>Fitur nonaktif sampai Anda memilih untuk mengaktifkannya.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="font-medium">Aktifkan donasi</p>
              <p className="text-sm text-muted-foreground">Pembaca dapat memilih nominal dan checkout.</p>
            </div>
            <input
              aria-label="Aktifkan donasi"
              type="checkbox"
              checked={settings.enabled}
              disabled={!recipientConfigured}
              onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
              className="h-4 w-4 accent-primary"
            />
          </div>
          {!recipientConfigured && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Wallet penerima belum diatur. Owner Platform perlu menautkan wallet organisasi di{' '}
              <Link className="font-medium underline" href="/dashboard/platform-settings">Platform Settings</Link> sebelum donasi bisa diaktifkan.
            </p>
          )}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Judul ajakan</span>
            <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" maxLength={100} value={settings.title} onChange={(event) => setSettings((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Deskripsi</span>
            <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" maxLength={500} value={settings.description} onChange={(event) => setSettings((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Label tombol</span>
            <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" maxLength={40} value={settings.buttonLabel} onChange={(event) => setSettings((current) => ({ ...current, buttonLabel: event.target.value }))} />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lokasi kemunculan</CardTitle>
          <CardDescription>Pilih satu atau beberapa lokasi reader. Lokasi kosong membuat ajakan tidak tampil di reader.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {LOCATIONS.map((location) => (
            <label key={location.value} className="flex cursor-pointer gap-3 rounded-lg border p-3">
              <input type="checkbox" checked={settings.locations.includes(location.value)} onChange={() => toggleLocation(location.value)} className="mt-1 h-4 w-4 accent-primary" />
              <span>
                <span className="block text-sm font-medium">{location.label}</span>
                <span className="text-xs text-muted-foreground">{location.description}</span>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Pilihan nominal</CardTitle>
            <CardDescription className="mt-1">Maksimal 10 pilihan, termasuk satu nominal kustom. Kelipatan pertama menjadi nominal minimum; batas maksimum checkout Rp100.000.000.</CardDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" disabled={settings.options.length >= 10} onClick={() => setSettings((current) => ({ ...current, options: [...current.options, createOption('fixed')] }))}>
              <Plus className="mr-1 h-4 w-4" /> Tetap
            </Button>
            {!settings.options.some((option) => option.type === 'custom') && (
              <Button type="button" variant="outline" size="sm" disabled={settings.options.length >= 10} onClick={() => setSettings((current) => ({ ...current, options: [...current.options, createOption('custom')] }))}>
                <Plus className="mr-1 h-4 w-4" /> Kustom
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.options.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pilihan nominal.</p>}
          {settings.options.map((option) => (
            <div key={option.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={option.isActive} onChange={(event) => updateOption(option.id, { isActive: event.target.checked })} />
                    Tampilkan
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={option.isPopular} onChange={(event) => setSettings((current) => ({ ...current, options: current.options.map((item) => ({ ...item, isPopular: item.id === option.id && event.target.checked })) }))} />
                    Tandai populer
                  </label>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{option.type === 'fixed' ? 'Nominal tetap' : 'Nominal kustom'}</span>
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label="Hapus pilihan" onClick={() => setSettings((current) => ({ ...current, options: current.options.filter((item) => item.id !== option.id) }))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Label</span>
                  <input className="w-full rounded-md border bg-background px-3 py-2" maxLength={80} value={option.title} onChange={(event) => updateOption(option.id, { title: event.target.value })} />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">{option.type === 'fixed' ? 'Nominal (Rp)' : 'Kelipatan sekaligus minimum (Rp)'}</span>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2"
                    type="number"
                    min={1}
                    max={100000000}
                    step={1}
                    value={option.type === 'fixed' ? option.amount ?? '' : option.multiple ?? ''}
                    onChange={(event) => {
                      const value = event.target.value ? Number(event.target.value) : undefined;
                      updateOption(option.id, option.type === 'fixed' ? { amount: value } : { multiple: value });
                    }}
                  />
                </label>
              </div>
              <DonationOptionImageUpload
                option={option}
                disabled={saving || loadFailed}
                onChange={(imageUrl) => updateOption(option.id, { imageUrl })}
              />
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Deskripsi pilihan</span>
                <input className="w-full rounded-md border bg-background px-3 py-2" maxLength={240} value={option.description} onChange={(event) => updateOption(option.id, { description: event.target.value })} />
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <div className="flex justify-end">
        <Button type="button" onClick={saveSettings} disabled={saving || loadFailed}>
          {saving ? 'Menyimpan…' : 'Simpan pengaturan'}
        </Button>
      </div>
    </div>
  );
}
