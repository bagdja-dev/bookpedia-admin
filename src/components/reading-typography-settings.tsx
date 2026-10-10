'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReadingFontFamily, ReadingTypography } from '@/lib/types';

/**
 * Font kurasi — key sama dengan API & reader app. `family` = font yang benar-benar dimuat
 * (mis. "Georgia" memakai Gelasio, setara metrik Georgia & tersedia di Android); `google`
 * dipakai memuat font pratinjau.
 */
export const READING_FONTS: Array<{ key: ReadingFontFamily; label: string; family: string; google: string; fallback: 'serif' | 'sans-serif' }> = [
  { key: 'source-serif-4', label: 'Source Serif 4 (default)', family: 'Source Serif 4', google: 'Source+Serif+4:ital,wght@0,400;0,700;1,400', fallback: 'serif' },
  { key: 'merriweather', label: 'Merriweather', family: 'Merriweather', google: 'Merriweather:ital,wght@0,400;0,700;1,400', fallback: 'serif' },
  { key: 'lora', label: 'Lora', family: 'Lora', google: 'Lora:ital,wght@0,400;0,700;1,400', fallback: 'serif' },
  { key: 'literata', label: 'Literata', family: 'Literata', google: 'Literata:ital,wght@0,400;0,700;1,400', fallback: 'serif' },
  { key: 'noto-serif', label: 'Noto Serif', family: 'Noto Serif', google: 'Noto+Serif:ital,wght@0,400;0,700;1,400', fallback: 'serif' },
  { key: 'georgia', label: 'Georgia', family: 'Gelasio', google: 'Gelasio:ital,wght@0,400;0,700;1,400', fallback: 'serif' },
  { key: 'pt-serif', label: 'PT Serif', family: 'PT Serif', google: 'PT+Serif:ital,wght@0,400;0,700;1,400', fallback: 'serif' },
  { key: 'crimson-pro', label: 'Crimson Pro', family: 'Crimson Pro', google: 'Crimson+Pro:ital,wght@0,400;0,700;1,400', fallback: 'serif' },
  { key: 'eb-garamond', label: 'EB Garamond', family: 'EB Garamond', google: 'EB+Garamond:ital,wght@0,400;0,700;1,400', fallback: 'serif' },
  { key: 'libre-baskerville', label: 'Libre Baskerville', family: 'Libre Baskerville', google: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400', fallback: 'serif' },
  { key: 'inter', label: 'Inter', family: 'Inter', google: 'Inter:wght@400;700', fallback: 'sans-serif' },
  { key: 'nunito', label: 'Nunito', family: 'Nunito', google: 'Nunito:ital,wght@0,400;0,700;1,400', fallback: 'sans-serif' },
  { key: 'noto-sans', label: 'Noto Sans', family: 'Noto Sans', google: 'Noto+Sans:ital,wght@0,400;0,700;1,400', fallback: 'sans-serif' },
  { key: 'roboto', label: 'Roboto', family: 'Roboto', google: 'Roboto:ital,wght@0,400;0,700;1,400', fallback: 'sans-serif' },
  { key: 'open-sans', label: 'Open Sans', family: 'Open Sans', google: 'Open+Sans:ital,wght@0,400;0,700;1,400', fallback: 'sans-serif' },
  { key: 'plus-jakarta-sans', label: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans', google: 'Plus+Jakarta+Sans:ital,wght@0,400;0,700;1,400', fallback: 'sans-serif' },
  { key: 'atkinson-hyperlegible', label: 'Atkinson Hyperlegible', family: 'Atkinson Hyperlegible', google: 'Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400', fallback: 'sans-serif' },
];

export const DEFAULT_READING_TYPOGRAPHY: ReadingTypography = {
  fontFamily: 'source-serif-4',
  fontSize: 17,
  lineHeight: 1.9,
  paragraphSpacing: 1.25,
  firstLineIndent: 0,
};

const FIELDS: Array<{ key: Exclude<keyof ReadingTypography, 'fontFamily'>; label: string; min: number; max: number; step: number; unit: string }> = [
  { key: 'fontSize', label: 'Ukuran font', min: 14, max: 24, step: 1, unit: 'px' },
  { key: 'lineHeight', label: 'Jarak antar baris', min: 1.3, max: 2.4, step: 0.05, unit: '×' },
  { key: 'paragraphSpacing', label: 'Jarak antar paragraf', min: 0, max: 2.5, step: 0.05, unit: 'em' },
  { key: 'firstLineIndent', label: 'Indentasi baris pertama', min: 0, max: 3, step: 0.25, unit: 'em' },
];

/** Batasi ke rentang yang diterima API (input angka bisa kosong/di luar rentang saat diketik). */
export function clampReadingTypography(value: ReadingTypography): ReadingTypography {
  const next = { ...value };
  for (const field of FIELDS) {
    const numeric = Number(next[field.key]);
    const fallback = DEFAULT_READING_TYPOGRAPHY[field.key];
    next[field.key] = Number.isFinite(numeric) && numeric > 0 || (field.min === 0 && numeric === 0)
      ? Math.min(field.max, Math.max(field.min, numeric))
      : fallback;
  }
  next.fontSize = Math.round(next.fontSize);
  return next;
}

const SAMPLE_PARAGRAPHS = [
  'Hujan turun pelan di atas atap rumah tua itu ketika Laras pertama kali mendengar namanya dipanggil dari ujung lorong. Suara itu terdengar akrab, tapi ia tidak bisa mengingat kapan terakhir kali mendengarnya.',
  '“Kau masih di sini?” tanya suara itu lagi. Laras menahan napas, menggenggam surat yang belum sempat ia baca, lalu melangkah perlahan menuju cahaya lampu yang berkedip di ujung sana.',
];

/**
 * Pengaturan tipografi teks bacaan Platform (isi Chapter, sinopsis, preview share, editor
 * Studio) dengan pratinjau langsung memakai font yang sama dari Google Fonts.
 */
export function ReadingTypographySettings({
  value,
  onChange,
  disabled,
}: {
  value: ReadingTypography;
  onChange: (value: ReadingTypography) => void;
  disabled?: boolean;
}) {
  const font = READING_FONTS.find((item) => item.key === value.fontFamily) ?? READING_FONTS[0];

  function update<K extends keyof ReadingTypography>(key: K, next: ReadingTypography[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Font pratinjau saja — reader app memuat font yang sama lewat next/font. */}
      <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${font.google}&display=swap`} />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="readingFontFamily">Font</Label>
          <select
            id="readingFontFamily"
            value={value.fontFamily}
            disabled={disabled}
            onChange={(e) => update('fontFamily', e.target.value as ReadingFontFamily)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <optgroup label="Serif — novel & bacaan panjang">
              {READING_FONTS.filter((item) => item.fallback === 'serif').map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </optgroup>
            <optgroup label="Sans-serif — non-fiksi & bacaan santai">
              {READING_FONTS.filter((item) => item.fallback === 'sans-serif').map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </optgroup>
          </select>
        </div>

        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`reading-${field.key}`}>{field.label}</Label>
              <span className="font-mono text-xs text-muted-foreground">{value[field.key]}{field.unit}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                aria-label={`${field.label} (slider)`}
                min={field.min}
                max={field.max}
                step={field.step}
                value={value[field.key]}
                disabled={disabled}
                onChange={(e) => update(field.key, Number(e.target.value))}
                className="flex-1"
              />
              <Input
                id={`reading-${field.key}`}
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={value[field.key]}
                disabled={disabled}
                onChange={(e) => update(field.key, Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Berlaku untuk isi Chapter, sinopsis, preview share, dan editor Studio penulis. Judul dan tampilan aplikasi
          lain tidak berubah. Indentasi 0 = tanpa indentasi.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Pratinjau</Label>
        <div
          className="rounded-md border bg-white p-5 text-neutral-800"
          style={{
            fontFamily: `'${font.family}', ${font.fallback}`,
            fontSize: `${value.fontSize}px`,
            lineHeight: value.lineHeight,
          }}
        >
          {SAMPLE_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 12)} style={{ marginBottom: `${value.paragraphSpacing}em`, textIndent: `${value.firstLineIndent}em` }}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
