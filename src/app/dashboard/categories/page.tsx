'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { AttachGenrePayload, Category, CreateCategoryPayload, Genre, UpdateCategoryPayload } from '@/lib/types';

interface CategoryFormState {
  nama: string;
  slug: string;
}

const EMPTY_FORM: CategoryFormState = { nama: '', slug: '' };

export default function CategoriesPage() {
  const { activePlatform, isOwner, loading: platformLoading } = usePlatformContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [genreBusyId, setGenreBusyId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!activePlatform) {
      setCategories([]);
      return;
    }
    setCategoriesLoading(true);
    try {
      const data = await apiClient<Category[]>(`/platforms/${activePlatform.id}/categories`);
      setCategories(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal memuat daftar category.');
    } finally {
      setCategoriesLoading(false);
    }
  }, [activePlatform]);

  const loadGenres = useCallback(async () => {
    if (!activePlatform) {
      setGenres([]);
      return;
    }
    try {
      // Endpoint publik (tanpa auth) — satu-satunya sumber daftar Genre milik
      // Platform ini, dipanggil lewat proxy yang sama (token ekstra diabaikan
      // backend karena controller ini memang tidak pakai guard).
      const data = await apiClient<Genre[]>(`/public/platforms/${activePlatform.slug}/genres`);
      setGenres(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal memuat daftar genre.');
    }
  }, [activePlatform]);

  useEffect(() => {
    void loadCategories();
    void loadGenres();
  }, [loadCategories, loadGenres]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({ nama: category.nama, slug: category.slug });
    setSlugTouched(true);
    setDialogOpen(true);
  }

  function updateField<K extends keyof CategoryFormState>(key: K, value: CategoryFormState[K]) {
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
        const payload: UpdateCategoryPayload = { nama: form.nama.trim(), slug: form.slug.trim() };
        await apiClient<Category>(`/platforms/${activePlatform.id}/categories/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Category berhasil diperbarui.');
      } else {
        const payload: CreateCategoryPayload = { nama: form.nama.trim(), slug: form.slug.trim() };
        await apiClient<Category>(`/platforms/${activePlatform.id}/categories`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Category berhasil dibuat.');
      }
      setDialogOpen(false);
      await loadCategories();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal menyimpan category.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!activePlatform || !pendingDelete) return;
    const category = pendingDelete;

    setDeleting(true);
    try {
      await apiClient(`/platforms/${activePlatform.id}/categories/${category.id}`, { method: 'DELETE' });
      toast.success(`Category "${category.nama}" dihapus.`);
      setPendingDelete(null);
      await loadCategories();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal menghapus category.');
    } finally {
      setDeleting(false);
    }
  }

  async function toggleGenre(category: Category, genre: Genre, checked: boolean) {
    if (!activePlatform) return;

    setGenreBusyId(genre.id);
    try {
      if (checked) {
        const payload: AttachGenrePayload = { genreId: genre.id };
        await apiClient(`/platforms/${activePlatform.id}/categories/${category.id}/genres`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient(`/platforms/${activePlatform.id}/categories/${category.id}/genres/${genre.id}`, {
          method: 'DELETE',
        });
      }
      await loadCategories();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal mengubah kaitan genre.');
    } finally {
      setGenreBusyId(null);
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
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Kelompokkan Genre milik Platform <strong>{activePlatform.nama}</strong> ke dalam Category.
            </CardDescription>
          </div>
          {isOwner && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah Category
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <LoadingSpinner />
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada category dibuat untuk Platform ini.</p>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{category.nama}</h3>
                        <Badge variant="outline">{category.slug}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {category.genres.length} genre terkait
                      </p>
                    </div>
                    {isOwner && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" aria-label={`Edit ${category.nama}`} onClick={() => openEdit(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Hapus ${category.nama}`}
                          onClick={() => setPendingDelete(category)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {genres.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {genres.map((genre) => {
                        const checked = category.genres.some((g) => g.id === genre.id);
                        return (
                          <label
                            key={genre.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              disabled={!isOwner || genreBusyId === genre.id}
                              onCheckedChange={(value) => toggleGenre(category, genre, value === true)}
                            />
                            {genre.nama}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'Tambah Category'}</DialogTitle>
            <DialogDescription>
              Category dipakai untuk mengelompokkan Genre milik Platform ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="category-nama">Nama</Label>
              <Input
                id="category-nama"
                required
                value={form.nama}
                onChange={(e) => updateField('nama', e.target.value)}
                placeholder="Fiksi"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category-slug">Slug</Label>
              <Input
                id="category-slug"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  updateField('slug', slugify(e.target.value));
                }}
                placeholder="fiksi"
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
            <DialogTitle>Hapus category?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `Kaitan ke ${pendingDelete.genres.length} genre akan ikut terhapus. Genre-nya sendiri tidak terhapus. Tindakan ini tidak bisa dibatalkan.`
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
