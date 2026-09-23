'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { uploadAudio, UploadAudioError } from '@/lib/upload-audio';

interface AudioUploadProps {
  id?: string;
  label: string;
  /** Dipakai sebagai metadata `folder` saat forward ke storage-service, mis. 'platforms'. */
  folder: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
}

/**
 * Upload suara notifikasi Platform — port dari `ImageUpload`, preview-nya
 * `<audio controls>` (bisa langsung diputar admin buat cek) alih-alih
 * thumbnail gambar. Lihat `lib/upload-audio.ts` untuk kontrak
 * `POST /api/uploads/audio`. Kosong (`value` string kosong) berarti Platform
 * pakai suara default sintesis client-side (lihat `RealtimeProvider`
 * bookpedia-app), bukan error.
 */
export function AudioUpload({
  id = 'audio',
  label,
  folder,
  value,
  onChange,
  disabled,
  onUploadingChange,
}: AudioUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError('');

    if (preview) URL.revokeObjectURL(preview);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    setUploading(true);
    try {
      const result = await uploadAudio(file, folder);
      onChange(result.url);
    } catch (err) {
      setPreview(null);
      URL.revokeObjectURL(localPreview);
      setError(err instanceof UploadAudioError ? err.message : 'Gagal mengunggah audio.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleRemove() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onChange('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  const playableSrc = preview || value;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col gap-3">
        {playableSrc && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio controls src={playableSrc} className="h-10 w-full max-w-sm" />
        )}

        <input
          id={id}
          ref={inputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/webm"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Mengunggah…' : value ? 'Ganti Suara' : 'Pilih Suara'}
          </Button>
          {(value || preview) && !uploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
            >
              Hapus (pakai default)
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          MP3, OGG, WAV, atau WebM — maks. 1 MB. Kosongkan untuk pakai nada default bawaan.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
