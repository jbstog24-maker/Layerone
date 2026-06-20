import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Users as UsersIcon, Search, Plus, Pencil, Trash2, Shield, User, Building2, Clock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin:           { label: "Admin",           color: "bg-red-500/20 text-red-300 border-red-500/30" },
  staff:           { label: "Staff",           color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  customer_admin:  { label: "Customer Admin",  color: "bg-green-500/20 text-green-300 border-green-500/30" },
  customer_viewer: { label: "Customer Viewer", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, color: "bg-slate-500/20 text-slate-300" };
  return (
    <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
  );
}

type EditState = {
  id: number;
  name: string;
  email: string;
  role: string;
  clientId: number | null;
};

// ─── Edit/Add User Dialog ─────────────────────────────────────────────────────
function UserDialog({
  open, onClose, user, clients, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  user: EditState | null; // null = create mode (not used for now — users are created via OAuth)
  clients: { id: number; companyName: string }[];
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<EditState>(
    user ?? { id: 0, name: "", email: "", role: "customer_viewer", clientId: null }
  );

  // Keep form in sync when user prop changes
  const resetForm = (u: EditState | null) =>
    setForm(u ?? { id: 0, name: "", email: "", role: "customer_viewer", clientId: null });

  const updateMut = trpc.users.update.useMutation({
    onSuccess: () => { toast.success("User updated"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const isCustomer = form.role === "customer_admin" || form.role === "customer_viewer";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); resetForm(user); } }}>
      <DialogContent className="max-w-md bg-[#07111f] border-[#1e3a5f] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{user ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-slate-300">Full Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Smith"
              className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <Label className="text-slate-300">Email Address</Label>
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jane@example.com"
              type="email"
              className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              The user must log in via the Manus OAuth portal using this email to activate their account.
            </p>
          </div>
          <div>
            <Label className="text-slate-300">Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v, clientId: null })}>
              <SelectTrigger className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1f35] border-[#1e3a5f]">
                <SelectItem value="admin">Admin — Full access</SelectItem>
                <SelectItem value="staff">Staff — Operations access</SelectItem>
                <SelectItem value="customer_admin">Customer Admin — Client portal (manage)</SelectItem>
                <SelectItem value="customer_viewer">Customer Viewer — Client portal (read-only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isCustomer && (
            <div>
              <Label className="text-slate-300">Linked Client Account</Label>
              <Select
                value={form.clientId?.toString() ?? ""}
                onValueChange={(v) => setForm({ ...form, clientId: v ? parseInt(v) : null })}
              >
                <SelectTrigger className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white">
                  <SelectValue placeholder="Select a client…" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1f35] border-[#1e3a5f]">
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Customer users can only see data for their linked client account.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#1e3a5f] text-slate-300">
            Cancel
          </Button>
          <Button
            onClick={() => updateMut.mutate({
              userId: form.id,
              name: form.name || undefined,
              email: form.email || undefined,
              role: form.role as any,
              clientId: isCustomer ? form.clientId : null,
            })}
            disabled={updateMut.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {updateMut.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Users Page ──────────────────────────────────────────────────────────
export default function Users() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editUser, setEditUser] = useState<EditState | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery({});

  const deleteMut = trpc.users.delete.useMutation({
    onSuccess: () => { toast.success("User removed"); utils.users.list.invalidate(); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const clientMap = useMemo(() => {
    const m: Record<number, string> = {};
    clients.forEach((c: any) => { m[c.id] = c.companyName; });
    return m;
  }, [clients]);

  const handleEdit = (u: any) => {
    setEditUser({ id: u.id, name: u.name ?? "", email: u.email ?? "", role: u.role, clientId: u.clientId ?? null });
  };

  const roleCounts = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc: Record<string, number>, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {});
  }, [users]);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <UsersIcon className="w-7 h-7 text-blue-400" />
              User Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage user accounts, roles, and client access
            </p>
          </div>
          <p className="text-xs text-slate-500 sm:text-right max-w-xs">
            New users are created automatically when they log in via the Manus OAuth portal. Use this page to assign roles and link them to client accounts.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
            <Card key={role} className="bg-[#0d1f35] border-[#1e3a5f]">
              <CardContent className="p-3 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cfg.color.includes("red") ? "bg-red-400" : cfg.color.includes("blue") ? "bg-blue-400" : cfg.color.includes("green") ? "bg-green-400" : "bg-slate-400"}`} />
                <div>
                  <p className="text-lg font-bold text-white">{roleCounts[role] ?? 0}</p>
                  <p className="text-xs text-slate-400">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9 bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-52 bg-[#0d1f35] border-[#1e3a5f] text-white">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1f35] border-[#1e3a5f]">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="customer_admin">Customer Admin</SelectItem>
              <SelectItem value="customer_viewer">Customer Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-[#0d1f35]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-[#0d1f35] border-[#1e3a5f]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <UsersIcon className="w-12 h-12 opacity-30" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm text-center">
                {search || roleFilter !== "all"
                  ? "Try adjusting your search or filter."
                  : "Users appear here automatically after they log in via the portal."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => (
              <Card key={u.id} className="bg-[#0d1f35] border-[#1e3a5f] hover:border-blue-500/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 shrink-0 border border-[#1e3a5f]">
                      <AvatarFallback className="text-sm font-semibold bg-blue-500/20 text-blue-300">
                        {u.name?.slice(0, 2).toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white truncate">{u.name ?? "Unnamed User"}</span>
                        <RoleBadge role={u.role} />
                        {u.id === me?.id && (
                          <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-300 border-yellow-500/30">You</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        {u.email && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {u.email}
                          </span>
                        )}
                        {u.clientId && clientMap[u.clientId] && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {clientMap[u.clientId]}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Last login: {new Date(u.lastSignedIn).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(u)}
                        className="border-[#1e3a5f] text-slate-300 hover:text-white gap-1 h-8 px-2"
                      >
                        <Pencil className="w-3 h-3" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      {u.id !== me?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteId(u.id)}
                          className="border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-400 gap-1 h-8 px-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info banner */}
        <Card className="bg-[#0d1f35] border-[#1e3a5f]">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-400">
              <p className="text-white font-medium mb-1">How user accounts work</p>
              <p>Users are created automatically the first time they log in via the Manus OAuth portal. Use this page to assign them a role and link customer accounts to a specific client. Passwords are managed by Manus OAuth — they cannot be set or changed here.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <UserDialog
        open={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        clients={clients as any}
        onSuccess={() => utils.users.list.invalidate()}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-[#07111f] border-[#1e3a5f] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remove User</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently remove the user account from the portal. The user will no longer be able to log in. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e3a5f] text-slate-300 bg-transparent hover:bg-[#0d1f35]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate({ userId: deleteId })}
              disabled={deleteMut.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMut.isPending ? "Removing…" : "Remove User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
