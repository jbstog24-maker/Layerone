import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Users as UsersIcon, Search, Plus, Pencil, Trash2, Shield, Building2,
  Clock, Mail, Phone, MapPin, Send, Briefcase, ToggleLeft, ToggleRight,
  CheckCircle2, XCircle, Info, UserCog, Users2,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; dot: string; description: string; permissions: string[] }> = {
  admin: {
    label: "Admin",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    dot: "bg-red-400",
    description: "Full system access — can manage all users, clients, billing, and settings.",
    permissions: ["All operations access", "User management", "Client management", "Billing & invoices", "System settings", "All reports"],
  },
  staff: {
    label: "Staff",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    dot: "bg-blue-400",
    description: "Operations access — can manage devices, staging, shipments, and leads.",
    permissions: ["Device & inventory management", "Staging tasks", "Shipment processing", "Lead management", "Drip sequences", "Content studio"],
  },
  customer_admin: {
    label: "Customer Admin",
    color: "bg-green-500/20 text-green-300 border-green-500/30",
    dot: "bg-green-400",
    description: "Customer portal — can view and manage their account, submit requests, and invite viewers.",
    permissions: ["View own device inventory", "Submit shipment requests", "View staging progress", "Manage support tickets", "View invoices & billing"],
  },
  customer_viewer: {
    label: "Customer Viewer",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    dot: "bg-slate-400",
    description: "Read-only customer portal — can view their account data but cannot submit requests.",
    permissions: ["View own device inventory", "View staging progress", "View support tickets (read-only)", "View invoices (read-only)"],
  },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, color: "bg-slate-500/20 text-slate-300 border-slate-500/30", dot: "bg-slate-400" };
  return <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>;
}

// ─── Departments ──────────────────────────────────────────────────────────────
const DEPARTMENTS = ["Operations", "Sales & Marketing", "Finance", "IT", "Logistics", "Customer Success", "Management", "Other"];

// ─── Form types ───────────────────────────────────────────────────────────────
type FormState = {
  id: number;
  name: string;
  email: string;
  role: string;
  clientId: number | null;
  businessName: string;
  phone: string;
  location: string;
  notes: string;
  jobTitle: string;
  department: string;
};

const EMPTY_FORM: FormState = {
  id: 0, name: "", email: "", role: "staff", clientId: null,
  businessName: "", phone: "", location: "", notes: "",
  jobTitle: "", department: "",
};

// ─── Add / Edit User Dialog ───────────────────────────────────────────────────
function UserDialog({
  open, onClose, initial, clients, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  initial: FormState | null;
  clients: { id: number; companyName: string }[];
  onSuccess: () => void;
}) {
  const isCreate = !initial || initial.id === 0;
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM);

  useEffect(() => { setForm(initial ?? EMPTY_FORM); }, [initial, open]);

  const utils = trpc.useUtils();

  const createMut = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("User account created. They can now log in via the portal.");
      utils.users.list.invalidate();
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully.");
      utils.users.list.invalidate();
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const isCustomer = form.role === "customer_admin" || form.role === "customer_viewer";
  const isStaff = form.role === "admin" || form.role === "staff";
  const isPending = createMut.isPending || updateMut.isPending;

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Full name is required"); return; }
    if (!form.email.trim()) { toast.error("Email address is required"); return; }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role as any,
      clientId: isCustomer ? form.clientId : null,
      businessName: form.businessName.trim() || null,
      phone: form.phone.trim() || null,
      location: form.location.trim() || null,
      jobTitle: isStaff ? (form.jobTitle.trim() || null) : null,
      department: isStaff ? (form.department.trim() || null) : null,
    };
    if (isCreate) {
      createMut.mutate(payload);
    } else {
      updateMut.mutate({ userId: form.id, ...payload });
    }
  };

  const roleInfo = ROLE_CONFIG[form.role];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg bg-[#07111f] border-[#1e3a5f] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">
            {isCreate ? "Add New User" : "Edit User"}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            {isCreate
              ? "Create a pre-provisioned account. The user logs in via the portal using this email to activate it."
              : "Update this user's profile, role, and access settings."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs uppercase tracking-wide">Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Smith" className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs uppercase tracking-wide">Email Address *</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@company.com" type="email" className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500" />
            </div>
          </div>

          {/* Role */}
          <div>
            <Label className="text-slate-300 text-xs uppercase tracking-wide">Role *</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v, clientId: null, jobTitle: "", department: "" })}>
              <SelectTrigger className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1f35] border-[#1e3a5f]">
                <SelectItem value="admin">Admin — Full access</SelectItem>
                <SelectItem value="staff">Staff — Operations access</SelectItem>
                <SelectItem value="customer_admin">Customer Admin — Portal (manage)</SelectItem>
                <SelectItem value="customer_viewer">Customer Viewer — Portal (read-only)</SelectItem>
              </SelectContent>
            </Select>
            {roleInfo && (
              <p className="text-xs text-slate-500 mt-1">{roleInfo.description}</p>
            )}
          </div>

          {/* Staff-specific fields */}
          {isStaff && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs uppercase tracking-wide">Job Title</Label>
                <Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  placeholder="e.g. Operations Manager" className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs uppercase tracking-wide">Department</Label>
                <Select value={form.department || "none"} onValueChange={(v) => setForm({ ...form, department: v === "none" ? "" : v })}>
                  <SelectTrigger className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white">
                    <SelectValue placeholder="Select department…" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1f35] border-[#1e3a5f]">
                    <SelectItem value="none">— None —</SelectItem>
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Phone + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs uppercase tracking-wide">Phone (optional)</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(555) 000-0000" type="tel" className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs uppercase tracking-wide">Location (optional)</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Dallas, TX" className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500" />
            </div>
          </div>

          {/* Business name (customer only) */}
          {isCustomer && (
            <div>
              <Label className="text-slate-300 text-xs uppercase tracking-wide">Business Name (optional)</Label>
              <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Acme Networks LLC" className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500" />
            </div>
          )}

          {/* Client link (customer only) */}
          {isCustomer && (
            <div>
              <Label className="text-slate-300 text-xs uppercase tracking-wide">Linked Client Account</Label>
              <Select value={form.clientId?.toString() ?? "none"} onValueChange={(v) => setForm({ ...form, clientId: v && v !== "none" ? parseInt(v) : null })}>
                <SelectTrigger className="mt-1 bg-[#0d1f35] border-[#1e3a5f] text-white">
                  <SelectValue placeholder="Select a client…" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1f35] border-[#1e3a5f]">
                  <SelectItem value="none">— No client linked —</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">Customer users can only see data for their linked client account. They cannot access the portal until a client is linked.</p>
            </div>
          )}

          <Separator className="bg-[#1e3a5f]" />

          <div>
            <Label className="text-slate-300 text-xs uppercase tracking-wide">Internal Notes (optional)</Label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Primary contact for Acme Networks, prefers email…"
              rows={2}
              className="mt-1 w-full rounded-md bg-[#0d1f35] border border-[#1e3a5f] text-white placeholder:text-slate-500 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <p className="text-xs text-slate-500 mt-1">Not visible to the user — for staff reference only.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="border-[#1e3a5f] text-slate-300">Cancel</Button>
          <Button onClick={handleSave} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
            {isPending ? (isCreate ? "Creating…" : "Saving…") : (isCreate ? "Create User" : "Save Changes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({
  u, me, clientMap, onEdit, onDelete, onResendInvite, onToggleActive, resendPending,
}: {
  u: any; me: any; clientMap: Record<number, string>;
  onEdit: (u: any) => void; onDelete: (u: any) => void;
  onResendInvite: (u: any) => void; onToggleActive: (u: any) => void;
  resendPending: boolean;
}) {
  const isStaff = u.role === "admin" || u.role === "staff";
  return (
    <Card className={`border transition-colors ${u.isActive === false ? "bg-[#0a1825] border-[#1e3a5f]/50 opacity-60" : "bg-[#0d1f35] border-[#1e3a5f] hover:border-blue-500/30"}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar className="w-10 h-10 border border-[#1e3a5f]">
              <AvatarFallback className={`text-sm font-semibold ${isStaff ? "bg-blue-500/20 text-blue-300" : "bg-green-500/20 text-green-300"}`}>
                {u.name?.slice(0, 2).toUpperCase() ?? "??"}
              </AvatarFallback>
            </Avatar>
            {u.isActive === false && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#07111f] flex items-center justify-center">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white truncate">{u.name ?? "Unnamed User"}</span>
              <RoleBadge role={u.role} />
              {u.id === me?.id && (
                <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-300 border-yellow-500/30">You</Badge>
              )}
              {u.isActive === false && (
                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">Inactive</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              {u.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</span>}
              {isStaff && u.jobTitle && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {u.jobTitle}</span>}
              {isStaff && u.department && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {u.department}</span>}
              {!isStaff && u.businessName && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {u.businessName}</span>}
              {u.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {u.phone}</span>}
              {u.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {u.location}</span>}
              {u.clientId && clientMap[u.clientId] && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {clientMap[u.clientId]}</span>}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last login: {new Date(u.lastSignedIn).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 ml-1">
            <Button size="sm" variant="outline" onClick={() => onEdit(u)}
              className="border-[#1e3a5f] text-slate-300 hover:text-white gap-1 h-8 px-3">
              <Pencil className="w-3.5 h-3.5" /><span>Edit</span>
            </Button>
            {u.email && (
              <Button size="sm" variant="outline" disabled={resendPending} onClick={() => onResendInvite(u)}
                className="border-blue-500/30 text-blue-400 hover:text-blue-300 hover:border-blue-400 gap-1 h-8 px-3">
                <Send className="w-3.5 h-3.5" /><span>Invite</span>
              </Button>
            )}
            {u.id !== me?.id && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => onToggleActive(u)}
                      className={`gap-1 h-8 px-3 ${u.isActive === false ? "border-green-500/30 text-green-400 hover:text-green-300" : "border-yellow-500/30 text-yellow-400 hover:text-yellow-300"}`}>
                      {u.isActive === false ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                      <span>{u.isActive === false ? "Activate" : "Deactivate"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#0d1f35] border-[#1e3a5f] text-white text-xs">
                    {u.isActive === false ? "Re-enable portal access for this user" : "Suspend portal access without deleting the account"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {u.id !== me?.id && (
              <Button size="sm" variant="outline" onClick={() => onDelete(u)}
                className="border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-400 gap-1 h-8 px-3">
                <Trash2 className="w-3.5 h-3.5" /><span>Remove</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Role Permissions Reference Card ─────────────────────────────────────────
function RolePermissionsCard() {
  return (
    <Card className="bg-[#0d1f35] border-[#1e3a5f]">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" /> Role Permissions Reference
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
            <div key={role} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-xs font-semibold text-white">{cfg.label}</span>
              </div>
              <p className="text-xs text-slate-500">{cfg.description}</p>
              <ul className="space-y-1">
                {cfg.permissions.map((p) => (
                  <li key={p} className="flex items-start gap-1.5 text-xs text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Users Page ──────────────────────────────────────────────────────────
export default function Users() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("staff");
  const [dialogUser, setDialogUser] = useState<FormState | null | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery({});

  const deleteMut = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User account removed.");
      utils.users.list.invalidate();
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const setActiveMut = trpc.users.setActive.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? "User account activated." : "User account deactivated.");
      utils.users.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resendInvite = trpc.users.resendInvite.useMutation({
    onSuccess: () => toast.success("Invite email sent successfully"),
    onError: (err) => toast.error(err.message ?? "Failed to send invite"),
  });

  // Unnamed-account cleanup (bot/junk rows): preview count, then purge.
  const [purgeConfirm, setPurgeConfirm] = useState(false);
  const { data: unnamedCount } = trpc.users.unnamedCount.useQuery();
  const purgeMut = trpc.users.purgeUnnamed.useMutation({
    onSuccess: (res) => {
      toast.success(`Removed ${res.deleted} unnamed account${res.deleted === 1 ? "" : "s"}.`);
      utils.users.list.invalidate();
      utils.users.unnamedCount.invalidate();
      setPurgeConfirm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const clientMap = useMemo(() => {
    const m: Record<number, string> = {};
    (clients as any[]).forEach((c) => { m[c.id] = c.companyName; });
    return m;
  }, [clients]);

  const staffUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const isStaffRole = u.role === "admin" || u.role === "staff";
      const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
      return isStaffRole && matchSearch;
    });
  }, [users, search]);

  const customerUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const isCustRole = u.role === "customer_admin" || u.role === "customer_viewer";
      const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
      return isCustRole && matchSearch;
    });
  }, [users, search]);

  const roleCounts = useMemo(() => {
    if (!users) return {} as Record<string, number>;
    return users.reduce((acc: Record<string, number>, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {});
  }, [users]);

  const handleEdit = (u: any) => {
    setDialogUser({
      id: u.id, name: u.name ?? "", email: u.email ?? "", role: u.role,
      clientId: u.clientId ?? null, businessName: u.businessName ?? "",
      phone: u.phone ?? "", location: u.location ?? "", notes: "",
      jobTitle: u.jobTitle ?? "", department: u.department ?? "",
    });
  };

  const handleDelete = (u: any) => {
    setDeleteId(u.id);
    setDeleteName(u.name ?? u.email ?? `User #${u.id}`);
  };

  const handleToggleActive = (u: any) => {
    setActiveMut.mutate({ userId: u.id, isActive: u.isActive === false ? true : false });
  };

  const defaultRole = activeTab === "staff" ? "staff" : "customer_viewer";

  const renderUserList = (list: any[]) => {
    if (isLoading) return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl bg-[#0d1f35]" />)}
      </div>
    );
    if (list.length === 0) return (
      <Card className="bg-[#0d1f35] border-[#1e3a5f]">
        <CardContent className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
          <UsersIcon className="w-10 h-10 opacity-30" />
          <p className="text-base font-medium">No users found</p>
          <p className="text-sm text-center">
            {search ? "Try adjusting your search." : `Click "Add New User" to create the first ${activeTab === "staff" ? "staff member" : "customer account"}.`}
          </p>
        </CardContent>
      </Card>
    );
    return (
      <div className="space-y-2">
        {list.map((u) => (
          <UserCard key={u.id} u={u} me={me} clientMap={clientMap}
            onEdit={handleEdit} onDelete={handleDelete}
            onResendInvite={resendInvite.mutate.bind(null, { userId: u.id })}
            onToggleActive={handleToggleActive}
            resendPending={resendInvite.isPending} />
        ))}
      </div>
    );
  };

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
              Manage staff roles and customer portal access
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            {(unnamedCount?.count ?? 0) > 0 && (
              <Button
                variant="outline"
                onClick={() => setPurgeConfirm(true)}
                className="gap-2 border-amber-600/50 text-amber-300 hover:bg-amber-600/10"
              >
                <Trash2 className="w-4 h-4" />
                Clean up {unnamedCount!.count} unnamed
              </Button>
            )}
            <Button onClick={() => {
              setDialogUser({ ...EMPTY_FORM, role: defaultRole });
            }} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" />
              Add New User
            </Button>
          </div>
        </div>

        {/* Role stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
            <Card key={role} className="bg-[#0d1f35] border-[#1e3a5f]">
              <CardContent className="p-3 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                <div>
                  <p className="text-lg font-bold text-white">{roleCounts[role] ?? 0}</p>
                  <p className="text-xs text-slate-400">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9 bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500" />
        </div>

        {/* Tabs: Staff vs Customers */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#0d1f35] border border-[#1e3a5f] p-1">
            <TabsTrigger value="staff" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
              <UserCog className="w-4 h-4" />
              Staff & Admins
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-300 border-blue-500/30 ml-1">
                {(roleCounts["admin"] ?? 0) + (roleCounts["staff"] ?? 0)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-400">
              <Users2 className="w-4 h-4" />
              Customer Accounts
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-300 border-green-500/30 ml-1">
                {(roleCounts["customer_admin"] ?? 0) + (roleCounts["customer_viewer"] ?? 0)}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="mt-4 space-y-4">
            {/* Staff info banner */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Staff members have access to the internal operations dashboard. <strong>Admins</strong> have full system access including user management and billing. <strong>Staff</strong> can manage devices, staging, shipments, and leads.</span>
            </div>
            {renderUserList(staffUsers)}
          </TabsContent>

          <TabsContent value="customers" className="mt-4 space-y-4">
            {/* Customer info banner */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Customer accounts must be linked to an approved client record before they can access the portal. Unlinked accounts see a "Pending Approval" screen. <strong>Customer Admins</strong> can submit requests; <strong>Viewers</strong> have read-only access.</span>
            </div>
            {renderUserList(customerUsers)}
          </TabsContent>
        </Tabs>

        {/* Role Permissions Reference */}
        <RolePermissionsCard />

      </div>

      {/* Add / Edit Dialog */}
      <UserDialog
        open={dialogUser !== undefined}
        onClose={() => setDialogUser(undefined)}
        initial={dialogUser ?? null}
        clients={clients as any}
        onSuccess={() => {}}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-[#07111f] border-[#1e3a5f] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remove User</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently remove <strong className="text-white">{deleteName}</strong> from the portal. They will no longer be able to log in. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e3a5f] text-slate-300 bg-transparent hover:bg-[#0d1f35]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate({ userId: deleteId })}
              disabled={deleteMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {deleteMut.isPending ? "Removing…" : "Remove User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Purge Unnamed Confirm */}
      <AlertDialog open={purgeConfirm} onOpenChange={(o) => !o && setPurgeConfirm(false)}>
        <AlertDialogContent className="bg-[#07111f] border-[#1e3a5f] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Unnamed Accounts</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete <strong className="text-white">{unnamedCount?.count ?? 0} unnamed account{unnamedCount?.count === 1 ? "" : "s"}</strong> (no name on file, not staff/admin, not linked to a client). Legitimate accounts always have names, so these are junk rows. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e3a5f] text-slate-300 bg-transparent hover:bg-[#0d1f35]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => purgeMut.mutate()}
              disabled={purgeMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {purgeMut.isPending ? "Deleting…" : `Delete ${unnamedCount?.count ?? 0} accounts`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
