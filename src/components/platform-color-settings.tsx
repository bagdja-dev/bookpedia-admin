'use client';

import { Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PlatformColors } from '@/lib/types';

type BaseColorKey = 'bg' | 'surface' | 'foreground' | 'muted' | 'border' | 'terracotta' | 'terracottaForeground' | 'mustard' | 'olive';
type SpecificColorKey = Exclude<keyof PlatformColors, BaseColorKey>;

const HEX = /^#[0-9a-fA-F]{6}$/;

const BASE_FIELDS: Array<{ key: BaseColorKey; label: string }> = [
  { key: 'bg', label: 'Background halaman' },
  { key: 'surface', label: 'Surface (panel)' },
  { key: 'foreground', label: 'Teks utama' },
  { key: 'muted', label: 'Teks redup' },
  { key: 'border', label: 'Border' },
  { key: 'terracotta', label: 'Aksen / link' },
  { key: 'terracottaForeground', label: 'Teks di atas aksen' },
  { key: 'mustard', label: 'Aksen kuning (highlight)' },
  { key: 'olive', label: 'Aksen hijau' },
];

/** Warna spesifik per bagian; `fallback` = warna umum yang dipakai bila dikosongkan (sama dengan reader). */
const SPECIFIC_GROUPS: Array<{ title: string; hint: string; fields: Array<{ key: SpecificColorKey; label: string; fallback: BaseColorKey | 'transparent' }> }> = [
  {
    title: 'Header',
    hint: 'Bar atas: logo teks, menu, garis bawah.',
    fields: [
      { key: 'headerBg', label: 'Latar header', fallback: 'surface' },
      { key: 'headerText', label: 'Teks & menu header', fallback: 'terracotta' },
      { key: 'headerBorder', label: 'Garis bawah header', fallback: 'border' },
    ],
  },
  {
    title: 'Kartu buku',
    hint: 'Kartu di katalog, homepage, dan halaman list.',
    fields: [
      { key: 'cardBg', label: 'Latar kartu', fallback: 'surface' },
      { key: 'cardBorder', label: 'Border kartu', fallback: 'border' },
      { key: 'cardTitle', label: 'Judul buku', fallback: 'foreground' },
      { key: 'cardText', label: 'Teks info (penulis, views)', fallback: 'muted' },
      { key: 'cardChipBg', label: 'Latar chip/tag', fallback: 'bg' },
    ],
  },
  {
    title: 'Footer',
    hint: 'Bagian paling bawah halaman.',
    fields: [
      { key: 'footerBg', label: 'Latar footer', fallback: 'transparent' },
      { key: 'footerText', label: 'Teks footer', fallback: 'muted' },
    ],
  },
  {
    title: 'Tombol utama',
    hint: 'Masuk, Mulai/Lanjut Baca, Berikutnya, Kirim, dsb. Link & aksen tetap memakai "Aksen / link".',
    fields: [
      { key: 'buttonBg', label: 'Latar tombol', fallback: 'terracotta' },
      { key: 'buttonText', label: 'Teks tombol', fallback: 'terracottaForeground' },
    ],
  },
  {
    title: 'Status & rating',
    hint: 'Badge status cerita dan bintang rating.',
    fields: [
      { key: 'statusOngoing', label: 'Status Ongoing', fallback: 'olive' },
      { key: 'statusCompleted', label: 'Status Tamat', fallback: 'terracotta' },
      { key: 'statusDraft', label: 'Status Draft', fallback: 'muted' },
      { key: 'ratingStar', label: 'Bintang rating', fallback: 'mustard' },
    ],
  },
  {
    title: 'Area baca chapter',
    hint: 'Halaman baca chapter & preview share — mis. latar krem/sepia khusus membaca.',
    fields: [
      { key: 'readingBg', label: 'Latar area baca', fallback: 'bg' },
      { key: 'readingText', label: 'Teks area baca', fallback: 'foreground' },
    ],
  },
];

function ColorInput({
  label,
  value,
  placeholder,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  /** Warna yang diwarisi saat kosong (ditampilkan di picker & placeholder). */
  placeholder?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}) {
  const shown = HEX.test(value) ? value : placeholder && HEX.test(placeholder) ? placeholder : '#000000';
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={shown}
          onChange={(e) => onChange(e.target.value)}
          className={`h-9 w-9 shrink-0 cursor-pointer rounded border p-0.5 ${value ? '' : 'opacity-50'}`}
          aria-label={`${label} picker`}
        />
        <span
          aria-hidden="true"
          className="h-7 w-7 shrink-0 rounded border"
          style={{ backgroundColor: shown }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ? `Ikut umum (${placeholder})` : '#000000'}
          className="font-mono text-xs"
          aria-label={`${label} hex`}
        />
        {onClear && value && (
          <Button type="button" variant="ghost" size="sm" className="shrink-0 px-2 text-xs" onClick={onClear}>
            Ikuti umum
          </Button>
        )}
      </div>
    </div>
  );
}

/** Warna efektif seperti di reader: spesifik bila diisi (hex valid), kalau tidak warna umum. */
function resolve(colors: PlatformColors, key: SpecificColorKey, fallback: BaseColorKey | 'transparent'): string {
  const value = colors[key];
  if (typeof value === 'string' && HEX.test(value)) return value;
  return fallback === 'transparent' ? 'transparent' : colors[fallback];
}

function ColorPreview({
  colors,
  brandName,
  tagline,
  motto,
  logoUrl,
  faviconUrl,
}: {
  colors: PlatformColors;
  brandName: string;
  tagline: string;
  motto: string;
  logoUrl: string;
  faviconUrl: string;
}) {
  const c = (key: SpecificColorKey) => {
    const field = SPECIFIC_GROUPS.flatMap((group) => group.fields).find((item) => item.key === key);
    return field ? resolve(colors, key, field.fallback) : colors.surface;
  };
  const contrastPairs = [
    { label: 'Header', foreground: c('headerText'), background: c('headerBg') },
    { label: 'Tombol utama', foreground: c('buttonText'), background: c('buttonBg') },
    { label: 'Judul kartu', foreground: c('cardTitle'), background: c('cardBg') },
    { label: 'Teks kartu', foreground: c('cardText'), background: c('cardBg') },
    { label: 'Area baca', foreground: c('readingText'), background: c('readingBg') },
    { label: 'Link aksen', foreground: colors.terracotta, background: c('readingBg') },
    { label: 'Teks sampul', foreground: colors.muted, background: colors.surface },
  ];
  const lowContrastPairs = contrastPairs.filter(({ foreground, background }) => {
    const ratio = getContrastRatio(foreground, background);
    return ratio !== null && ratio < 4.5;
  });

  return (
    <div className="overflow-hidden rounded-xl border text-xs shadow-sm" style={{ background: colors.bg, color: colors.foreground }}>
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ background: c('headerBg'), borderColor: c('headerBorder'), color: c('headerText') }}>
        <span className="flex min-w-0 items-center gap-2 font-semibold">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-7 max-w-24 object-contain" />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-current/20">
              {brandName.trim().charAt(0).toUpperCase() || 'P'}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate">{brandName.trim() || 'Nama Platform'}</span>
            {tagline.trim() && <span className="block max-w-48 truncate text-[10px] font-normal opacity-80">{tagline}</span>}
            {motto.trim() && <span className="block max-w-48 truncate text-[10px] font-normal italic opacity-75">{motto}</span>}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {faviconUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={faviconUrl} alt="" className="h-5 w-5 rounded-sm object-contain" />
          )}
          <span className="rounded-full px-3 py-1" style={{ background: c('buttonBg'), color: c('buttonText') }}>Masuk</span>
        </span>
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <div className="overflow-hidden rounded-md border" style={{ background: c('cardBg'), borderColor: c('cardBorder') }}>
          <div className="flex aspect-[3/2] items-center justify-center p-4 text-center" style={{ background: colors.surface, color: colors.muted }}>
            Sampul buku ditampilkan di sini
          </div>
          <div className="space-y-1 p-2">
            <div className="font-semibold" style={{ color: c('cardTitle') }}>Contoh judul buku</div>
            <div style={{ color: c('cardText') }}>Nama penulis · info buku</div>
            <div className="flex flex-wrap items-center gap-1">
              <span className="rounded-full px-2 py-0.5" style={{ background: c('cardChipBg'), color: c('cardText') }}>
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: c('statusOngoing') }} />Ongoing
              </span>
              <span className="rounded-full px-2 py-0.5" style={{ background: c('cardChipBg'), color: c('cardText') }}>
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: c('statusCompleted') }} />Tamat
              </span>
              <span className="flex items-center gap-0.5" style={{ color: c('cardText') }}>
                <Star className="h-3 w-3" style={{ fill: c('ratingStar'), color: c('ratingStar') }} /> 4,8
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-2 rounded-md p-3" style={{ background: c('readingBg'), color: c('readingText') }}>
          <div className="font-semibold">Area baca chapter</div>
          <p className="leading-relaxed">{tagline.trim() || 'Pratinjau teks area baca dengan warna Platform.'}</p>
          <span className="inline-block" style={{ color: colors.terracotta }}>Link aksen</span>
        </div>
      </div>
      <div className="border-t px-3 py-2 text-center" style={{ background: c('footerBg'), color: c('footerText') }}>Footer © Platform</div>
      <div className="border-t px-3 py-2 text-[11px] text-muted-foreground" style={{ borderColor: colors.border }}>
        Ilustrasi lokal dari nilai form saat ini. Konten contoh hanya untuk melihat warna; ini bukan halaman publik.
      </div>
      {lowContrastPairs.length > 0 && (
        <div
          role="status"
          className="border-t bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-950 dark:bg-amber-950 dark:text-amber-100"
        >
          Periksa kontras warna teks: {lowContrastPairs.map((pair) => pair.label).join(', ')} terdeteksi di bawah rasio 4.5:1.
        </div>
      )}
    </div>
  );
}

function getContrastRatio(foreground: string, background: string): number | null {
  const luminance = (hex: string) => {
    if (!HEX.test(hex)) return null;
    const channels = hex.slice(1).match(/.{2}/g);
    if (!channels) return null;
    const linear = channels.map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  if (foregroundLuminance === null || backgroundLuminance === null) return null;
  const brightest = Math.max(foregroundLuminance, backgroundLuminance);
  const darkest = Math.min(foregroundLuminance, backgroundLuminance);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Warna Platform: palet umum + warna spesifik per bagian (opsional — kosong = ikut umum,
 * persis seperti fallback `var(--spesifik, var(--umum))` di reader), dengan pratinjau.
 */
export function PlatformColorSettings({
  colors,
  onChange,
  brandName = '',
  tagline = '',
  motto = '',
  logoUrl = '',
  faviconUrl = '',
}: {
  colors: PlatformColors;
  onChange: (key: keyof PlatformColors, value: string) => void;
  brandName?: string;
  tagline?: string;
  motto?: string;
  logoUrl?: string;
  faviconUrl?: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">Warna umum</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BASE_FIELDS.map(({ key, label }) => (
            <ColorInput key={key} label={label} value={colors[key]} onChange={(value) => onChange(key, value)} />
          ))}
        </div>
      </div>

      {SPECIFIC_GROUPS.map((group) => (
        <div key={group.title} className="border-t pt-4">
          <p className="text-sm font-medium">{group.title}</p>
          <p className="mb-2 text-xs text-muted-foreground">{group.hint} Kosong = mengikuti warna umum.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.fields.map(({ key, label, fallback }) => (
              <ColorInput
                key={key}
                label={label}
                value={colors[key] ?? ''}
                placeholder={fallback === 'transparent' ? undefined : colors[fallback]}
                onChange={(value) => onChange(key, value)}
                onClear={() => onChange(key, '')}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="border-t pt-4">
        <p className="mb-2 text-sm font-medium">Pratinjau</p>
        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold">Pratinjau lokal reader</h3>
            <p className="text-xs text-muted-foreground">
              Mengikuti warna dan identitas yang sedang diedit. Belum disimpan dan bukan preview situs publik.
            </p>
          </div>
          <ColorPreview
            colors={colors}
            brandName={brandName}
            tagline={tagline}
            motto={motto}
            logoUrl={logoUrl}
            faviconUrl={faviconUrl}
          />
        </div>
      </div>
    </div>
  );
}
