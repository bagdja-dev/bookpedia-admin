'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Trash2 } from 'lucide-react';
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
import { EmptyState } from '@/components/admin/empty-state';
import { ErrorState } from '@/components/admin/error-state';
import { PageHeader } from '@/components/admin/page-header';
import { usePlatformContext } from '@/context/platform-context';
import { ApiError, apiClient } from '@/lib/api-client';
import type { PlatformStaff, PlatformStaffInvitationListItem } from '@/lib/types';

const INVITATION_STATUS_LABEL: Record<PlatformStaffInvitationListItem['status'], string> = {
  pending: 'Menunggu',
  expired: 'Kedaluwarsa',
};

function InvitationStatusBadge({ status }: { status: PlatformStaffInvitationListItem['status'] }) {
  if (status === 'expired') {
    return (
      <Badge variant="outline" className="border-destructive text-destructive">
        {INVITATION_STATUS_LABEL[status]}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-blue-600 text-blue-600">
      {INVITATION_STATUS_LABEL[status]}
    </Badge>
  );
}

export default function StaffPage() {
  const { activePlatform, isOwner, loading: platformLoading } = usePlatformContext();

  const [staff, setStaff] = useState<PlatformStaff[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<PlatformStaffInvitationListItem[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<PlatformStaff | null>(null);

  const loadStaff = useCallback(async () => {
    if (!activePlatform) {
      setStaff([]);
      return;
    }
    setStaffLoading(true);
    setStaffError(null);
    try {
      const data = await apiClient<PlatformStaff[]>(`/platforms/${activePlatform.id}/staff`);
      setStaff(data);
    } catch (err) {
      setStaffError(err instanceof ApiError ? err.message : 'Gagal memuat daftar staff.');
    } finally {
      setStaffLoading(false);
    }
  }, [activePlatform]);

  const loadInvitations = useCallback(async () => {
    if (!activePlatform) {
      setInvitations([]);
      return;
    }
    setInvitationsLoading(true);
    setInvitationsError(null);
    try {
      const data = await apiClient<PlatformStaffInvitationListItem[]>(
        `/platforms/${activePlatform.id}/staff/invitations`,
      );
      setInvitations(data);
    } catch (err) {
      setInvitationsError(err instanceof ApiError ? err.message : 'Gagal memuat daftar undangan.');
    } finally {
      setInvitationsLoading(false);
    }
  }, [activePlatform]);

  useEffect(() => {
    void loadStaff();
    void loadInvitations();
  }, [loadStaff, loadInvitations]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!activePlatform) return;

    setInviting(true);
    setLastInviteToken(null);
    try {
      // Versi sederhana (§4.1 koreksi 10 Sep 2026) — TANPA email otomatis.
      // Response berisi `token`, Owner share link accept-nya sendiri secara
      // manual (mis. lewat chat) — beda dari pola auction yang mengirim
      // email otomatis lewat MessagingService.
      const invitation = await apiClient<{ token: string }>(`/platforms/${activePlatform.id}/staff`, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setLastInviteToken(invitation.token);
      toast.success(`Undangan dibuat untuk ${email.trim()} — copy link accept di bawah.`);
      setEmail('');
      await loadInvitations();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal mengundang staff.');
    } finally {
      setInviting(false);
    }
  }

  async function confirmRemove() {
    if (!activePlatform || !pendingRemoval) return;
    const staffMember = pendingRemoval;

    setRemovingId(staffMember.id);
    try {
      await apiClient(`/platforms/${activePlatform.id}/staff/${staffMember.id}`, {
        method: 'DELETE',
      });
      toast.success(`${staffMember.email} dihapus dari Platform.`);
      setPendingRemoval(null);
      await loadStaff();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal menghapus staff.');
    } finally {
      setRemovingId(null);
    }
  }

  async function copyInvitationLink() {
    if (!lastInviteToken) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invite/accept?token=${lastInviteToken}`);
      toast.success('Link undangan berhasil disalin.');
    } catch {
      toast.error('Link undangan gagal disalin. Salin tautan yang ditampilkan secara manual.');
    }
  }

  if (platformLoading) {
    return <LoadingSpinner label="Memuat…" />;
  }

  // Backend adalah penjaga sebenarnya (403 kalau bukan Owner) — pengecekan
  // di sini murni UX supaya Staff tidak melihat halaman yang bukan haknya.
  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Akses Ditolak</CardTitle>
          <CardDescription>
            Halaman ini hanya untuk Owner. Staff Platform tidak dapat menambah atau menghapus staff lain.
          </CardDescription>
        </CardHeader>
      </Card>
    );
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
      <PageHeader
        title="Staff"
        description={`Kelola akses tim untuk Platform ${activePlatform.nama}. Undangan dibagikan secara manual; tidak ada email otomatis.`}
      />
      <Card>
        <CardHeader>
          <CardTitle>Undang Staff</CardTitle>
          <CardDescription>
            Kelola staff untuk Platform <strong>{activePlatform.nama}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">Email Staff</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@contoh.com"
              />
            </div>
            <Button type="submit" disabled={inviting}>
              {inviting ? 'Mengundang…' : 'Undang'}
            </Button>
          </form>

          {lastInviteToken && (
            <div role="status" className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">Link undangan — bagikan manual kepada calon staff</p>
                <Button type="button" size="sm" variant="outline" onClick={() => void copyInvitationLink()}>
                  <Copy className="mr-2 h-4 w-4" /> Salin link
                </Button>
              </div>
              <code className="mt-2 block break-all text-xs text-muted-foreground">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/accept?token=${lastInviteToken}`}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Staff</CardTitle>
        </CardHeader>
        <CardContent>
          {staffLoading ? (
            <LoadingSpinner />
          ) : staffError ? (
            <ErrorState title="Daftar staff gagal dimuat" description={staffError} onRetry={() => void loadStaff()} />
          ) : staff.length === 0 ? (
            <EmptyState title="Belum ada staff" description="Undang anggota tim melalui formulir di atas. Link penerimaan perlu dibagikan secara manual." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="w-16 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{new Date(member.createdAt).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={removingId === member.id}
                        onClick={() => setPendingRemoval(member)}
                        aria-label={`Hapus ${member.email}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Undangan Tertunda</CardTitle>
          <CardDescription>Staff yang sudah diundang tapi belum menerima undangan.</CardDescription>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <LoadingSpinner />
          ) : invitationsError ? (
            <ErrorState title="Daftar undangan gagal dimuat" description={invitationsError} onRetry={() => void loadInvitations()} />
          ) : invitations.length === 0 ? (
            <EmptyState title="Tidak ada undangan tertunda" description="Undangan yang masih menunggu penerimaan atau sudah kedaluwarsa akan dicatat di sini." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Diundang</TableHead>
                  <TableHead>Kedaluwarsa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <InvitationStatusBadge status={invitation.status} />
                    </TableCell>
                    <TableCell>{new Date(invitation.createdAt).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{new Date(invitation.expiresAt).toLocaleDateString('id-ID')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus staff?</DialogTitle>
            <DialogDescription>
              {pendingRemoval
                ? `${pendingRemoval.email} akan kehilangan akses ke Platform "${activePlatform.nama}". Tindakan ini tidak bisa dibatalkan.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRemoval(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={removingId === pendingRemoval?.id}
              onClick={confirmRemove}
            >
              {removingId === pendingRemoval?.id ? 'Menghapus…' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
