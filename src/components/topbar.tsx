'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, Menu, Plus } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { platforms, activePlatform, switchPlatform, isOwner, canCreatePlatform } = usePlatformContext();
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

  const handleCreatePlatform = () => {
    router.push('/dashboard/platforms/new');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Platform switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="max-w-[220px] justify-between gap-2">
              <span className="truncate">
                {activePlatform ? activePlatform.nama : 'Pilih Platform'}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Platform Anda</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canCreatePlatform && (
              <>
                <DropdownMenuItem onSelect={handleCreatePlatform} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Tambah Platform</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {platforms.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                Belum ada Platform.
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
                        Aktif
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: profile menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-accent">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{displayName}</p>
              {isOwner && <p className="text-xs text-muted-foreground">Owner</p>}
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
