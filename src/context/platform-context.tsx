'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiClient } from '@/lib/api-client';
import type { Platform, PlatformsResponse } from '@/lib/types';

/**
 * Platform switcher TANPA routing berbasis URL — port persis
 * `MarketProvider`/`useMarketContext` (bagdja-auction-admin). Owner bisa
 * punya banyak Platform; "yang aktif" disimpan di React Context +
 * `localStorage`, dipilih lewat dropdown Topbar — bukan navigasi
 * `/dashboard/[platformId]/...`. Semua halaman platform-scoped
 * (`platform-settings`, `staff`) flat route, ambil `activePlatform` dari
 * context ini.
 */
export const ACTIVE_PLATFORM_STORAGE_KEY = 'na_active_platform';

interface PlatformContextValue {
  platforms: Platform[];
  activePlatform: Platform | null;
  platformId: string | null;
  isOwner: boolean;
  loading: boolean;
  switchPlatform: (platformId: string) => void;
  refresh: () => Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiClient<PlatformsResponse>('/platforms');
      setPlatforms(data.platforms);
      setIsOwner(data.isOwner);

      const savedId =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem(ACTIVE_PLATFORM_STORAGE_KEY)
          : null;
      const found = data.platforms.find((p) => p.id === savedId);
      setActivePlatform(found ?? data.platforms[0] ?? null);
    } catch {
      setPlatforms([]);
      setIsOwner(false);
      setActivePlatform(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const switchPlatform = useCallback(
    (platformId: string) => {
      const found = platforms.find((p) => p.id === platformId);
      if (found) {
        setActivePlatform(found);
        localStorage.setItem(ACTIVE_PLATFORM_STORAGE_KEY, platformId);
      }
    },
    [platforms],
  );

  const value = useMemo(
    () => ({
      platforms,
      activePlatform,
      platformId: activePlatform?.id ?? null,
      isOwner,
      loading,
      switchPlatform,
      refresh,
    }),
    [platforms, activePlatform, isOwner, loading, switchPlatform, refresh],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatformContext() {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    throw new Error('usePlatformContext must be used within PlatformProvider');
  }
  return ctx;
}
