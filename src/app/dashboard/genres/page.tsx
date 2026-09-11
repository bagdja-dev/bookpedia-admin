'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/loading-spinner';
import { usePlatformContext } from '@/context/platform-context';
import { ApiError, apiClient, slugify } from '@/lib/api-client';
import type { CreateGenrePayload, Genre, UpdateGenrePayload } from '@/lib/types';

interface GenreFormState {
  nama: string;
  slug: string;
}

const EMPTY_FORM: GenreFormState = { nama: '', slug: '' };

export default function GenresPage() {
  const { activePlatform, isOwner, loading: platformLoading } = usePlatformContext();

  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Genre | null>(null);
  const [form, setForm] = useState<GenreFormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Genre | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadGenres = useCallback(async () => {
    if (!activePlatform) {
      setGenres([]);
      return;
    }
    setGenresLoading(true);
    try {
      const data = await apiClient<Genre[]>(`/platforms/${activePlatform.id}/genres`);
      setGenres(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal memuat daftar genre.');
    } finally {
      setGenresLoading(false);
    }
  }, [activePlatform]);

  useEffect(() => {
    void loadGenres();
  }, [loadGenres]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setDialogOpen(true);
  }

  function openEdit(genre: Genre) {
    setEditing(genre);
    setForm({ nama: genre.nama, slug: genre.slug });
    setSlugTouched(true);
    setDialogOpen(true);
  }

  function updateField<K extends keyof GenreFormState>(key: K, value: GenreFormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'nama' && !slugTouched) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activePlatform) return;

    setSaving(true);
    try {
      if (editing) {
        const payload: UpdateGenrePayload = { nama: form.nama.trim(), slug: form.slug.trim() };
        await apiClient<Genre>(`/platforms/${activePlatform.id}/genres/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Genre berhasil diperbarui.');
      } else {
        const payload: CreateGenrePayload = { nama: form.nama.trim(), slug: form.slug.trim() };
        await apiClient<Genre>(`/platforms/${activePlatform.id}/genres`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Genre berhasil dibuat.');
      }
      setDialogOpen(false);
      await loadGenres();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal menyimpan genre.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!activePlatform || !pendingDelete) return;
    const genre = pendingDelete;

    setDeleting(true);
    try {
      await apiClient(`/platforms/${activePlatform.id}/genres/${genre.id}`, { method: 'DELETE' });
      toast.success(`Genre "${genre.nama}" dihapus.`);
      setPendingDelete(null);
      await loadGenres();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal menghapus genre.');
    } finally {
      setDeleting(false);
    }
  }

  if (platformLoading) {
    return <LoadingSpinner label="Memuat…" />;
  }

  if (!activePlatform) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Belum ada Platform aktif</CardTitle>
          <CardDescription>Buat atau pilih Platform dulu di Platform Settings.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Genres</CardTitle>
            <CardDescription>
              Kelola Genre milik Platform <strong>{activePlatform.nama}</strong>. Kelompokkan lewat menu Categories.
            </CardDescription>
          </div>
          {isOwner && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah Genre
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {genresLoading ? (
            <LoadingSpinner />
          ) : genres.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada genre dibuat untuk Platform ini.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Slug</TableHead>
                  {isOwner && <TableHead className="w-24 text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {genres.map((genre) => (
                  <TableRow key={genre.id}>
                    <TableCell>{genre.nama}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{genre.slug}</Badge>
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" aria-label={`Edit ${genre.nama}`} onClick={() => openEdit(genre)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Hapus ${genre.nama}`}
                          onClick={() => setPendingDelete(genre)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Genre' : 'Tambah Genre'}</DialogTitle>
            <DialogDescription>Genre dipakai di form Book & filter katalog pembaca.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="genre-nama">Nama</Label>
              <Input
                id="genre-nama"
                required
                value={form.nama}
                onChange={(e) => updateField('nama', e.target.value)}
                placeholder="Fantasi"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="genre-slug">Slug</Label>
              <Input
                id="genre-slug"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  updateField('slug', slugify(e.target.value));
                }}
                placeholder="fantasi"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus genre?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `Book yang memakai "${pendingDelete.nama}" akan kehilangan genre-nya (jadi tanpa genre), dan kaitannya ke Category ikut hilang. Tindakan ini tidak bisa dibatalkan.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Batal
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={confirmDelete}>
              {deleting ? 'Menghapus…' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
