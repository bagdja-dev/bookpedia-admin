'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, Menu, Plus } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlatformContext } from '@/context/platform-context';
import { useAuth } from '@/hooks/use-auth';

interface TopbarProps {
  menuOpen: boolean;
  onMenuToggle: () => void;
}

export function Topbar({ menuOpen, onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { platforms, activePlatform, switchPlatform, isOwner, canCreatePlatform, loading } = usePlatformContext();
  const platformGroups = Array.from(
    platforms.reduce((groups, platform) => {
      const key = platform.ownerOrgId ?? 'unassigned';
      const group = groups.get(key) ?? {
        id: key,
        name: platform.ownerOrgName
          || (platform.ownerOrgId ? `Organisasi ${platform.ownerOrgId.slice(0, 8)}` : 'Belum terhubung ke organisasi'),
        platforms: [],
      };
      group.platforms.push(platform);
      groups.set(key, group);
      return groups;
    }, new Map<string, { id: string; name: string; platforms: typeof platforms }>()),
  ).map(([, group]) => group);
  platformGroups.sort((a, b) => a.name.localeCompare(b.name, 'id'));

  const displayName = user?.username ?? user?.email ?? 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/90 px-3 backdrop-blur-md sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={onMenuToggle}
          aria-label={menuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="min-w-0 max-w-[min(44vw,15rem)] justify-between gap-2 border-border bg-card/80 px-2.5 sm:max-w-[260px] sm:px-3"
              aria-label={activePlatform ? `Platform aktif: ${activePlatform.nama}` : 'Pilih Platform'}
            >
              <span className="truncate">
                {activePlatform?.nama ?? (loading ? 'Memuat Platform…' : 'Pilih Platform')}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[min(20rem,calc(100vw-2rem))]">
            <DropdownMenuLabel>Platform Anda</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canCreatePlatform && (
              <>
                <DropdownMenuItem
                  onSelect={() => router.push('/dashboard/platforms/new')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Tambah Platform</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {platforms.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {loading ? 'Memuat daftar Platform…' : 'Belum ada Platform.'}
              </div>
            )}
            {platformGroups.map((group, groupIndex) => (
              <DropdownMenuGroup key={group.id}>
                {groupIndex > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="max-w-full truncate text-xs text-muted-foreground">
                  {group.name}
                </DropdownMenuLabel>
                {group.platforms.map((platform) => (
                  <DropdownMenuItem
                    key={platform.id}
                    onSelect={() => switchPlatform(platform.id)}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">{platform.nama}</span>
                    {activePlatform?.id === platform.id && (
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        Dipilih
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {activePlatform && (
          <StatusBadge
            label={activePlatform.isActive ? 'Aktif' : 'Nonaktif'}
            tone={activePlatform.isActive ? 'success' : 'neutral'}
            className="hidden shrink-0 sm:inline-flex"
          />
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1.5 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring sm:px-2"
            aria-label={`Menu akun ${displayName}`}
          >
            <div className="hidden text-right sm:block">
              <p className="max-w-40 truncate text-sm font-medium leading-tight">{displayName}</p>
              {isOwner && <p className="mt-0.5 text-xs text-muted-foreground">Owner</p>}
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-semibold">{displayName}</p>
            {user?.email && <p className="text-xs font-normal text-muted-foreground">{user.email}</p>}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild variant="destructive">
            <a href="/auth/logout">Keluar</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
