import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Pencil, Save, X, Mail, Phone, Briefcase, Building2, Shield, Clock, KeyRound, User as UserIcon } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  customer_admin: "Customer Admin",
  customer_viewer: "Viewer",
};

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function MyAccount() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");

  const myClientQuery = trpc.clients.myClient.useQuery(undefined, {
    enabled: !!user && (user.role === "customer_admin" || user.role === "customer_viewer"),
    retry: false,
  });

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setJobTitle(user.jobTitle ?? "");
      setDepartment(user.department ?? "");
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateMe = trpc.users.updateMe.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setEditing(false);
      toast.success("Profile updated");
    },
    onError: (err) => {
      toast.error(err.message || "Could not update profile");
    },
  });

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    updateMe.mutate({
      name: trimmed,
      phone: phone.trim() || null,
      jobTitle: jobTitle.trim() || null,
      department: department.trim() || null,
    });
  };

  const handleCancel = () => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setJobTitle(user?.jobTitle ?? "");
    setDepartment(user?.department ?? "");
    setEditing(false);
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4 max-w-3xl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const isCustomer = user.role === "customer_admin" || user.role === "customer_viewer";

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-lg font-semibold bg-primary/20 text-primary">
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.name ?? "My Account"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{ROLE_LABELS[user.role] ?? user.role}</Badge>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Editable profile */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" /> Profile
              </CardTitle>
              <CardDescription>Your contact details as they appear to the Layer One team.</CardDescription>
            </div>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={updateMe.isPending}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateMe.isPending}>
                  <Save className="mr-2 h-4 w-4" /> {updateMe.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="acct-name">Full name *</Label>
              <Input
                id="acct-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editing}
                maxLength={200}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acct-phone">Phone</Label>
              <Input
                id="acct-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!editing}
                maxLength={30}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acct-title">Job title</Label>
              <Input
                id="acct-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={!editing}
                maxLength={128}
                placeholder="e.g. IT Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acct-dept">Department</Label>
              <Input
                id="acct-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={!editing}
                maxLength={128}
                placeholder="e.g. Infrastructure"
              />
            </div>
          </CardContent>
        </Card>

        {/* Read-only account details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Account details
            </CardTitle>
            <CardDescription>Managed by Layer One — contact us if any of this needs to change.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email (sign-in)</p>
                <p className="text-sm font-medium">{user.email ?? "—"}</p>
              </div>
            </div>
            <Separator />
            {isCustomer && (
              <>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm font-medium">
                      {myClientQuery.isLoading ? "Loading…" : (myClientQuery.data?.companyName ?? "—")}
                    </p>
                  </div>
                </div>
                <Separator />
              </>
            )}
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium">{ROLE_LABELS[user.role] ?? user.role}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Sign-in method</p>
                <p className="text-sm font-medium capitalize">{user.loginMethod ?? "—"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Member since</p>
                <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Last signed in</p>
                <p className="text-sm font-medium">{formatDateTime(user.lastSignedIn)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
