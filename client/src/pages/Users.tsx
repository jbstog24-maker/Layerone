import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, LoadingRows } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Users as UsersIcon } from "lucide-react";

export default function Users() {
  const [editUser, setEditUser] = useState<{ id: number; role: string; clientId?: number | null } | null>(null);
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery({});
  const updateMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => { toast.success("User updated"); utils.users.list.invalidate(); setEditUser(null); },
    onError: (e) => toast.error(e.message),
  });

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    staff: "Staff",
    customer_admin: "Customer Admin",
    customer_viewer: "Customer Viewer",
  };

  return (
    <DashboardLayout>
      <PageHeader title="Users" subtitle="Manage user roles and client assignments" />
      <Card className="bg-card/60 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={6} /> : users?.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={UsersIcon} title="No users yet" /></td></tr>
              ) : users?.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {u.name?.slice(0, 2).toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{u.name ?? "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{(u as any).clientName ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(u.lastSignedIn).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Button variant="outline" size="sm" onClick={() => setEditUser({ id: u.id, role: u.role, clientId: (u as any).clientId })}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit User Role</DialogTitle></DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div>
                <Label>Role</Label>
                <Select defaultValue={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="customer_admin">Customer Admin</SelectItem>
                    <SelectItem value="customer_viewer">Customer Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(editUser.role === "customer_admin" || editUser.role === "customer_viewer") && (
                <div>
                  <Label>Assign to Client</Label>
                  <Select
                    defaultValue={editUser.clientId?.toString() ?? ""}
                    onValueChange={(v) => setEditUser({ ...editUser, clientId: parseInt(v) })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button
                  onClick={() => updateMutation.mutate({ userId: editUser.id, role: editUser.role as any, clientId: editUser.clientId ?? undefined })}
                  disabled={updateMutation.isPending}
                >
                  Save
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
