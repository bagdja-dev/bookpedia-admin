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

function ColorPreview({ colors }: { colors: PlatformColors }) {
  const c = (key: SpecificColorKey) => {
    const field = SPECIFIC_GROUPS.flatMap((group) => group.fields).find((item) => item.key === key);
    return field ? resolve(colors, key, field.fallback) : colors.surface;
  };
  return (
    <div className="overflow-hidden rounded-md border text-xs" style={{ background: colors.bg, color: colors.foreground }}>
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ background: c('headerBg'), borderColor: c('headerBorder'), color: c('headerText') }}>
        <span className="font-semibold">Logo</span>
        <span className="rounded-full px-3 py-1" style={{ background: c('buttonBg'), color: c('buttonText') }}>Masuk</span>
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <div className="overflow-hidden rounded-md border" style={{ background: c('cardBg'), borderColor: c('cardBorder') }}>
          <div className="aspect-[3/2]" style={{ background: colors.bg }} />
          <div className="space-y-1 p-2">
            <div className="font-semibold" style={{ color: c('cardTitle') }}>Judul Buku Contoh</div>
            <div style={{ color: c('cardText') }}>oleh Penulis · 1,2rb views</div>
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
          <p className="leading-relaxed">Hujan turun pelan di atas atap rumah tua itu ketika Laras mendengar namanya dipanggil.</p>
          <span className="inline-block" style={{ color: colors.terracotta }}>Link aksen</span>
        </div>
      </div>
      <div className="border-t px-3 py-2 text-center" style={{ background: c('footerBg'), color: c('footerText') }}>Footer © Platform</div>
    </div>
  );
}

/**
 * Warna Platform: palet umum + warna spesifik per bagian (opsional — kosong = ikut umum,
 * persis seperti fallback `var(--spesifik, var(--umum))` di reader), dengan pratinjau.
 */
export function PlatformColorSettings({
  colors,
  onChange,
}: {
  colors: PlatformColors;
  onChange: (key: keyof PlatformColors, value: string) => void;
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
        <ColorPreview colors={colors} />
      </div>
    </div>
  );
}
