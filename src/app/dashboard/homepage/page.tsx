'use client';

import { useEffect, useState } from 'react';
import { GripVertical, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlatformContext } from '@/context/platform-context';
import { ApiError, apiClient } from '@/lib/api-client';
import type { Category, CatalogSectionConfig, Genre, UpdatePlatformPayload } from '@/lib/types';

const DEFAULT_SECTIONS: CatalogSectionConfig[] = [
  { key: 'top', title: 'Top / Hot', enabled: true, queryType: 'predefined', predefinedQuery: 'top', layout: 'slider', limit: 10, pageSize: 10, lazyLoad: true },
  { key: 'new-updated', title: 'New Updated', enabled: true, queryType: 'predefined', predefinedQuery: 'new_updated', layout: 'slider', limit: 10, pageSize: 10, lazyLoad: true },
];

function normalizeSections(sections: CatalogSectionConfig[] | undefined): CatalogSectionConfig[] {
  return (sections?.length ? sections : DEFAULT_SECTIONS).map((section) => ({
    ...section,
    queryType: section.queryType ?? 'predefined',
    predefinedQuery: section.predefinedQuery ?? section.type ?? 'new_updated',
    layout: section.layout ?? 'slider',
    pageSize: section.pageSize ?? section.limit ?? 10,
    lazyLoad: section.lazyLoad ?? true,
    customQuery: section.customQuery ?? {},
  }));
}

export default function HomepageSettingsPage() {
  const { activePlatform, loading, refresh } = usePlatformContext();
  const [sectionState, setSectionState] = useState<{ platformId: string | null; sections: CatalogSectionConfig[] }>({
    platformId: null,
    sections: [],
  });
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    if (!activePlatform) {
      return;
    }

    let cancelled = false;
    void Promise.all([
      apiClient<Category[]>(`/platforms/${activePlatform.id}/categories`),
      apiClient<Genre[]>(`/public/platforms/${activePlatform.slug}/genres`),
    ]).then(([categoryData, genreData]) => {
      if (!cancelled) {
        setCategories(categoryData);
        setGenres(genreData);
      }
    }).catch(() => {
      if (!cancelled) {
        setCategories([]);
        setGenres([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activePlatform]);

  if (loading) return <LoadingSpinner label="Memuat pengaturan homepage..." />;

  if (!activePlatform) {
    return <p className="text-sm text-muted-foreground">Belum ada platform aktif.</p>;
  }

  const activePlatformId = activePlatform.id;
  const sections = sectionState.platformId === activePlatformId
    ? sectionState.sections
    : normalizeSections(activePlatform.homepageSections);

  function setSections(update: CatalogSectionConfig[] | ((current: CatalogSectionConfig[]) => CatalogSectionConfig[])) {
    setSectionState((current) => ({
      platformId: activePlatformId,
      sections: typeof update === 'function' ? update(current.platformId === activePlatformId ? current.sections : sections) : update,
    }));
  }

  function updateSection(index: number, patch: Partial<CatalogSectionConfig>) {
    setSections((current) => current.map((section, itemIndex) => itemIndex === index ? { ...section, ...patch } : section));
  }

  function updateCustomQuery(index: number, key: string, value: string) {
    setSections((current) => current.map((section, itemIndex) => itemIndex === index
      ? { ...section, customQuery: { ...section.customQuery, [key]: value || undefined } }
      : section));
  }

  function toggleCustomQueryValue(index: number, key: 'genre' | 'category', value: string) {
    setSections((current) => current.map((section, itemIndex) => {
      if (itemIndex !== index) return section;
      const currentValue = section.customQuery?.[key];
      const selected = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
      const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
      return { ...section, customQuery: { ...section.customQuery, [key]: next } };
    }));
  }

  function selectedQueryValues(section: CatalogSectionConfig, key: 'genre' | 'category'): string[] {
    const value = section.customQuery?.[key];
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  function sortRules(section: CatalogSectionConfig) {
    return section.customQuery?.sortRules?.length
      ? section.customQuery.sortRules
      : section.customQuery?.sort
        ? [{ field: section.customQuery.sort, direction: section.customQuery.sort === 'title' ? 'asc' as const : 'desc' as const }]
        : [{ field: 'updated' as const, direction: 'desc' as const }];
  }

  function updateSortRules(index: number, rules: CatalogSectionConfig['customQuery']['sortRules']) {
    setSections((current) => current.map((section, itemIndex) => itemIndex === index
      ? { ...section, customQuery: { ...section.customQuery, sortRules: rules } }
      : section));
  }

  function addSection() {
    setSections((current) => [
      ...current,
      {
        key: `section-${Date.now()}`,
        title: 'Section baru',
        enabled: true,
        queryType: 'predefined',
        predefinedQuery: 'new_updated',
        layout: 'grid',
        limit: 10,
        pageSize: 10,
        lazyLoad: true,
        customQuery: {},
      },
    ]);
  }

  function removeSection(index: number) {
    if (editingIndex === index) setEditingIndex(null);
    setSections((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function dropSection(targetIndex: number) {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    setSections((current) => {
      const next = [...current];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggedIndex(null);
  }

  async function save() {
    setSaving(true);
    try {
      const payload: UpdatePlatformPayload = {
        homepageSections: sections.map((section) => ({
          ...section,
          title: section.title.trim() || 'Section tanpa judul',
          limit: Math.min(50, Math.max(4, Number(section.limit) || 10)),
          pageSize: Math.min(50, Math.max(4, Number(section.pageSize) || Number(section.limit) || 10)),
        })),
      };
      await apiClient(`/platforms/${activePlatformId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      await refresh();
      toast.success('Pengaturan homepage berhasil disimpan.');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan pengaturan homepage.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Homepage</h1>
          <p className="mt-2 text-sm text-muted-foreground">Susun section katalog publik untuk {activePlatform.nama}.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={addSection}>
            <Plus className="h-4 w-4" />
            Tambah section
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {sections.length === 0 && (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Belum ada section homepage.</CardContent></Card>
        )}
        {sections.map((section, index) => (
          <Card
            key={section.key}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropSection(index)}
            className="border-2 transition-colors hover:border-primary/40"
          >
            <CardHeader className="flex flex-row items-start gap-3 space-y-0">
              <div className="cursor-grab pt-1 text-muted-foreground" title="Drag untuk mengubah urutan">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">{section.title || `Section ${index + 1}`}</CardTitle>
                <CardDescription>
                  {section.queryType === 'custom'
                    ? `Custom: ${section.customQuery?.search || 'Filter terstruktur'}`
                    : `Predefined: ${section.predefinedQuery === 'top' ? 'Top / Hot' : 'New Updated'}`}
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingIndex(index)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button type="button" variant="ghost" size="icon" title="Hapus section" aria-label="Hapus section" onClick={() => removeSection(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-1">{section.enabled ? 'Aktif' : 'Nonaktif'}</span>
              <span className="rounded-full bg-muted px-2 py-1">{section.layout === 'grid' ? 'Grid' : 'Slider'}</span>
              <span className="rounded-full bg-muted px-2 py-1">{section.pageSize ?? section.limit} book</span>
              <span className="ml-auto">Tarik card untuk mengubah urutan</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
        {editingIndex !== null && sections[editingIndex] && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit section homepage</DialogTitle>
              <DialogDescription>Atur judul, query, layout, dan pagination section ini.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Judul section</Label>
                <Input value={sections[editingIndex].title} onChange={(event) => updateSection(editingIndex, { title: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={sections[editingIndex].enabled ? 'enabled' : 'disabled'} onValueChange={(value) => updateSection(editingIndex, { enabled: value === 'enabled' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="enabled">Aktif</SelectItem><SelectItem value="disabled">Nonaktif</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Layout</Label>
                <Select value={sections[editingIndex].layout} onValueChange={(value: 'grid' | 'slider') => updateSection(editingIndex, { layout: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="grid">Grid</SelectItem><SelectItem value="slider">Slider</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Query</Label>
                <Select value={sections[editingIndex].queryType ?? 'predefined'} onValueChange={(value: 'predefined' | 'custom') => updateSection(editingIndex, { queryType: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="predefined">Predefined</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent>
                </Select>
              </div>
              {sections[editingIndex].queryType !== 'custom' ? (
                <div className="space-y-1.5">
                  <Label>Predefined query</Label>
                  <Select value={sections[editingIndex].predefinedQuery ?? 'new_updated'} onValueChange={(value: 'top' | 'new_updated') => updateSection(editingIndex, { predefinedQuery: value, type: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="top">Top / Hot</SelectItem><SelectItem value="new_updated">New Updated</SelectItem></SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-4 md:col-span-2">
                  <div className="space-y-1.5">
                    <Label>Custom search</Label>
                    <Input value={sections[editingIndex].customQuery?.search ?? ''} placeholder="Cari judul book" onChange={(event) => updateCustomQuery(editingIndex, 'search', event.target.value)} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <div className="max-h-36 space-y-2 overflow-y-auto rounded-md border p-3">
                        {categories.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Belum ada category.</p>
                        ) : categories.map((category) => (
                          <label key={category.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedQueryValues(sections[editingIndex], 'category').includes(category.slug)}
                              onChange={() => toggleCustomQueryValue(editingIndex, 'category', category.slug)}
                            />
                            {category.nama}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Genre</Label>
                      <div className="max-h-36 space-y-2 overflow-y-auto rounded-md border p-3">
                        {genres.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Belum ada genre.</p>
                        ) : genres.map((genre) => (
                          <label key={genre.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedQueryValues(sections[editingIndex], 'genre').includes(genre.slug)}
                              onChange={() => toggleCustomQueryValue(editingIndex, 'genre', genre.slug)}
                            />
                            {genre.nama}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Urutan sort</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateSortRules(editingIndex, [...sortRules(sections[editingIndex]), { field: 'updated', direction: 'desc' }])}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah sort
                      </Button>
                    </div>
                    <div className="space-y-2 rounded-md border p-3">
                      {sortRules(sections[editingIndex]).map((rule, ruleIndex) => (
                        <div key={`${rule.field}-${ruleIndex}`} className="flex flex-wrap items-center gap-2">
                          <span className="w-8 text-xs text-muted-foreground">{ruleIndex + 1}.</span>
                          <Select
                            value={rule.field}
                            onValueChange={(value: 'updated' | 'views' | 'title') => {
                              const next = sortRules(sections[editingIndex]).map((item, currentIndex) => currentIndex === ruleIndex ? { ...item, field: value } : item);
                              updateSortRules(editingIndex, next);
                            }}
                          >
                            <SelectTrigger className="min-w-36 flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="updated">Terakhir diperbarui</SelectItem>
                              <SelectItem value="views">Jumlah views</SelectItem>
                              <SelectItem value="title">Judul</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={rule.direction}
                            onValueChange={(value: 'asc' | 'desc') => {
                              const next = sortRules(sections[editingIndex]).map((item, currentIndex) => currentIndex === ruleIndex ? { ...item, direction: value } : item);
                              updateSortRules(editingIndex, next);
                            }}
                          >
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="desc">DESC</SelectItem>
                              <SelectItem value="asc">ASC</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Hapus aturan sort"
                            aria-label="Hapus aturan sort"
                            disabled={sortRules(sections[editingIndex]).length === 1}
                            onClick={() => updateSortRules(editingIndex, sortRules(sections[editingIndex]).filter((_, currentIndex) => currentIndex !== ruleIndex))}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Page size</Label>
                <Input type="number" min={4} max={50} value={sections[editingIndex].pageSize ?? sections[editingIndex].limit} onChange={(event) => updateSection(editingIndex, { pageSize: Number(event.target.value) || 10, limit: Number(event.target.value) || 10 })} />
              </div>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input type="checkbox" checked={sections[editingIndex].lazyLoad ?? true} onChange={(event) => updateSection(editingIndex, { lazyLoad: event.target.checked })} />
                Lazy load section
              </label>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setEditingIndex(null)}>Selesai</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
