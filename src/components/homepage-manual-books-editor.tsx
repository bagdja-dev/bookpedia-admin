'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { CatalogBookSearchResult, HomepageSectionBook } from '@/lib/types';

export const MAX_HOMEPAGE_SECTION_BOOKS = 50;

function CoverThumb({ coverUrl, judul, className }: { coverUrl: string | null; judul: string; className?: string }) {
  return (
    <div className={cn('relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-md bg-muted', className)}>
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt={judul} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">Tanpa cover</div>
      )}
    </div>
  );
}

/**
 * Section homepage mode "manual" — pilih Book satu per satu. Pola sama editor
 * "Rekomendasi Penulis" di Studio (grid cover, ←/→ untuk urutan, popup cari judul),
 * tapi terkontrol: perubahan disimpan bersama tombol Simpan halaman Homepage.
 */
export function HomepageManualBooksEditor({
  items,
  onChange,
  platformSlug,
}: {
  items: HomepageSectionBook[];
  onChange: (items: HomepageSectionBook[]) => void;
  platformSlug: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogBookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dialogOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Kurang dari 2 huruf: tampilan sudah menampilkan petunjuk dari panjang query, tidak perlu mencari.
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    debounceRef.current = setTimeout(() => {
      setSearching(true);
      apiClient<{ items: CatalogBookSearchResult[] }>(
        `/public/platforms/${encodeURIComponent(platformSlug)}/catalog?search=${encodeURIComponent(trimmed)}&limit=10`,
      )
        .then((data) => setResults(data.items))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, platformSlug, dialogOpen]);

  const atLimit = items.length >= MAX_HOMEPAGE_SECTION_BOOKS;

  function addBook(book: CatalogBookSearchResult) {
    if (items.some((item) => item.id === book.id)) return;
    if (atLimit) {
      toast.error(`Maksimal ${MAX_HOMEPAGE_SECTION_BOOKS} Book per section.`);
      return;
    }
    onChange([...items, {
      id: book.id,
      judul: book.judul,
      slug: book.slug,
      coverUrl: book.coverUrl,
      libraryNama: book.library.nama,
      isVisible: true,
    }]);
  }

  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Pilih Book satu per satu — urutan grid = urutan tampil di homepage. Hanya Book published yang tampil.
        </p>
        <span className="shrink-0 text-xs text-muted-foreground">
          {items.length}/{MAX_HOMEPAGE_SECTION_BOOKS}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item, index) => (
          <div key={item.id} className="flex flex-col gap-1.5">
            <div className="relative">
              <CoverThumb coverUrl={item.coverUrl} judul={item.judul} className={item.isVisible ? undefined : 'opacity-50'} />
              {!item.isVisible && (
                <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Tidak published
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(items.filter((current) => current.id !== item.id))}
                title="Hapus"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="truncate text-xs font-medium">{item.judul}</p>
            <p className="truncate text-[11px] text-muted-foreground">{item.libraryNama}</p>
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="icon" className="h-7 w-7" disabled={index === 0} title="Pindah ke kiri" onClick={() => moveItem(index, -1)}>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="outline" size="icon" className="h-7 w-7" disabled={index === items.length - 1} title="Pindah ke kanan" onClick={() => moveItem(index, 1)}>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs">Tambah Book</span>
          </button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Cari Book untuk section ini</DialogTitle>
            <DialogDescription>Book published dari Library manapun di Platform ini.</DialogDescription>
          </DialogHeader>

          <Input autoFocus placeholder="Cari judul Book…" value={query} onChange={(event) => setQuery(event.target.value)} />

          <div className="flex flex-col gap-2">
            {query.trim().length < 2 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Ketik minimal 2 huruf untuk mencari.</p>
            ) : searching ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Mencari…</p>
            ) : results.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Tidak ada Book ditemukan.</p>
            ) : (
              results.map((book) => {
                const alreadyAdded = items.some((item) => item.id === book.id);
                return (
                  <button
                    key={book.id}
                    type="button"
                    disabled={alreadyAdded || atLimit}
                    onClick={() => addBook(book)}
                    className="flex items-center gap-3 rounded-lg border p-2 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CoverThumb coverUrl={book.coverUrl} judul={book.judul} className="w-14" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-muted-foreground">oleh {book.library.nama}</p>
                      <p className="truncate text-sm font-medium">{book.judul}</p>
                      {book.genre && <p className="truncate text-[11px] text-muted-foreground">{book.genre.nama}</p>}
                    </div>
                    {alreadyAdded ? (
                      <span className="shrink-0 text-[11px] text-muted-foreground">Sudah ditambah</span>
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
