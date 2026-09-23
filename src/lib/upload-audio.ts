/**
 * Helper client-side untuk upload suara notifikasi Platform lewat route BFF
 * `app/api/uploads/audio/route.ts`. Port dari `lib/upload-image.ts`, beda
 * whitelist mimetype & limit ukuran (audio notifikasi cukup pendek).
 */
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm'];
const MAX_AUDIO_BYTES = 1 * 1024 * 1024; // 1 MB — sama dengan limit backend

export interface UploadAudioResult {
  url: string;
  path: string;
}

export class UploadAudioError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'UploadAudioError';
  }
}

export async function uploadAudio(file: File, folder = 'platforms'): Promise<UploadAudioResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadAudioError('Format audio harus MP3, OGG, WAV, atau WebM', 0);
  }
  if (file.size > MAX_AUDIO_BYTES) {
    throw new UploadAudioError('Ukuran audio maksimal 1 MB', 0);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch('/api/uploads/audio', {
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
    throw new UploadAudioError(message, res.status);
  }

  return res.json() as Promise<UploadAudioResult>;
}
