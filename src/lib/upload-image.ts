/**
 * Helper client-side untuk upload gambar (logo/favicon Platform) lewat route
 * BFF `app/api/uploads/image/route.ts` (bukan `apiClient`/`app/api/proxy`
 * biasa — itu JSON-only, di sini kirim `FormData`). Port persis dari
 * `bagdja-novelo-app/src/lib/upload-image.ts`.
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB — sama dengan limit backend

export interface UploadImageResult {
  url: string;
  path: string;
}

export class UploadImageError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'UploadImageError';
  }
}

export async function uploadImage(file: File, folder = 'platforms'): Promise<UploadImageResult> {
  // Validasi DULU sebelum upload — biar user tidak menunggu request yang
  // pasti ditolak backend.
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadImageError('Format gambar harus JPEG, PNG, WebP, atau GIF', 0);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadImageError('Ukuran gambar maksimal 5 MB', 0);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch('/api/uploads/image', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? body.error ?? message;
    } catch {
      message = await res.text().catch(() => message);
    }
    throw new UploadImageError(message, res.status);
  }

  return res.json() as Promise<UploadImageResult>;
}
