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
import type { Platform, PlatformsResponse, PlatformOwnerOrganization } from '@/lib/types';

/**
 * Platform switcher TANPA routing berbasis URL. Owner melihat Platform
 * organisasi yang dimilikinya; staff melihat Platform yang ditugaskan.
 * "Yang aktif" disimpan di React Context +
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
  canCreatePlatform: boolean;
  ownedOrganizations: PlatformOwnerOrganization[];
  loading: boolean;
  switchPlatform: (platformId: string) => void;
  refresh: () => Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);
  const [canCreatePlatform, setCanCreatePlatform] = useState(false);
  const [ownedOrganizations, setOwnedOrganizations] = useState<PlatformOwnerOrganization[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiClient<PlatformsResponse>('/platforms');
      setPlatforms(data.platforms);
      setCanCreatePlatform(data.isOwner);
      setOwnedOrganizations(data.ownedOrganizations ?? []);

      const savedId =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem(ACTIVE_PLATFORM_STORAGE_KEY)
          : null;
      const found = data.platforms.find((p) => p.id === savedId);
      setActivePlatform(found ?? data.platforms[0] ?? null);
    } catch {
      setPlatforms([]);
      setCanCreatePlatform(false);
      setOwnedOrganizations([]);
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
      isOwner: Boolean(activePlatform?.ownerOrgId && ownedOrganizations.some((organization) => organization.id === activePlatform.ownerOrgId)),
      canCreatePlatform,
      ownedOrganizations,
      loading,
      switchPlatform,
      refresh,
    }),
    [platforms, activePlatform, canCreatePlatform, ownedOrganizations, loading, switchPlatform, refresh],
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
