'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { uploadImage, UploadImageError } from '@/lib/upload-image';

interface ImageUploadProps {
  id?: string;
  label: string;
  /** Dipakai sebagai metadata `folder` saat forward ke storage-service, mis. 'platforms'. */
  folder: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
  /** Dimensi preview dalam px. */
  previewWidth?: number;
  previewHeight?: number;
}

/**
 * Upload gambar generik (logo/favicon Platform) — port dari
 * `bagdja-bookpedia-app/src/components/cover-image-upload.tsx` (dulu khusus
 * cover Library/Book), digeneralisasi namanya karena di sini dipakai untuk
 * logo & favicon Platform. Lihat `lib/upload-image.ts` untuk kontrak
 * `POST /api/uploads/image`.
 */
export function ImageUpload({
  id = 'image',
  label,
  folder,
  value,
  onChange,
  disabled,
  onUploadingChange,
  previewWidth = 96,
  previewHeight = 96,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Preview object URL (dari file lokal sebelum upload selesai) harus di-
  // revoke saat komponen unmount supaya tidak bocor memory.
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

    // Preview lokal dulu supaya user langsung lihat gambar terpilih sambil
    // menunggu upload — ganti object URL lama kalau ada.
    if (preview) URL.revokeObjectURL(preview);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    setUploading(true);
    try {
      const result = await uploadImage(file, folder);
      onChange(result.url);
    } catch (err) {
      setPreview(null);
      URL.revokeObjectURL(localPreview);
      setError(err instanceof UploadImageError ? err.message : 'Gagal mengunggah gambar.');
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

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-input bg-muted"
          style={{ width: previewWidth, height: previewHeight }}
        >
          {preview || value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview || value} alt={`Preview ${label}`} className="h-full w-full object-cover" />
          ) : (
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            id={id}
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
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
              {uploading ? 'Mengunggah…' : value ? 'Ganti Gambar' : 'Pilih Gambar'}
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
                Hapus
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, atau GIF — maks. 5 MB</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
