import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, MapPin, Clock, Phone, User, Archive } from "lucide-react";
import { useForm } from "react-hook-form";

type LocationRow = {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  contactName: string | null;
  contactPhone: string | null;
  receivingHours: string | null;
  dockInfo: string | null;
  notes: string | null;
  isActive: boolean;
};

function LocationForm({ location, onClose }: { location?: LocationRow | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const createMut = trpc.locations.create.useMutation({
    onSuccess: () => { toast.success("Location added"); utils.locations.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.locations.update.useMutation({
    onSuccess: () => { toast.success("Location updated"); utils.locations.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: location?.name ?? "",
      address: location?.address ?? "",
      city: location?.city ?? "",
      state: location?.state ?? "TX",
      zip: location?.zip ?? "",
      contactName: location?.contactName ?? "",
      contactPhone: location?.contactPhone ?? "",
      receivingHours: location?.receivingHours ?? "",
      dockInfo: location?.dockInfo ?? "",
      notes: location?.notes ?? "",
    },
  });

  const onSubmit = (data: any) => {
    const clean = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, (v as string).trim() === "" ? undefined : v])
    );
    if (location) {
      updateMut.mutate({ id: location.id, ...clean });
    } else {
      createMut.mutate(clean as any);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Location name</Label>
        <Input {...register("name", { required: true })} placeholder="Plano - Building A" className="mt-1" />
      </div>
      <div>
        <Label>Street address</Label>
        <Input {...register("address", { required: true })} placeholder="123 Warehouse Blvd" className="mt-1" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>City</Label>
          <Input {...register("city", { required: true })} placeholder="Plano" className="mt-1" />
        </div>
        <div>
          <Label>State</Label>
          <Input {...register("state", { required: true })} placeholder="TX" className="mt-1" />
        </div>
        <div>
          <Label>ZIP</Label>
          <Input {...register("zip", { required: true })} placeholder="75074" className="mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Contact name</Label>
          <Input {...register("contactName")} placeholder="Dock manager" className="mt-1" />
        </div>
        <div>
          <Label>Contact phone</Label>
          <Input {...register("contactPhone")} placeholder="(469) 555-0100" className="mt-1" />
        </div>
      </div>
      <div>
        <Label>Receiving hours</Label>
        <Input {...register("receivingHours")} placeholder="Mon-Fri 8am-5pm" className="mt-1" />
      </div>
      <div>
        <Label>Dock info</Label>
        <Textarea {...register("dockInfo")} placeholder="Dock numbers, gate codes, check-in instructions" className="mt-1 h-20" />
      </div>
      <div>
        <Label>Internal notes</Label>
        <Textarea {...register("notes")} placeholder="Notes for staff only (not shown to customers)" className="mt-1 h-16" />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
          {location ? "Save changes" : "Add location"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function Locations() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LocationRow | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const { data: locations = [], isLoading } = trpc.locations.list.useQuery(
    { includeInactive: showInactive }
  );
  const deactivateMut = trpc.locations.deactivate.useMutation({
    onSuccess: () => { toast.success("Location deactivated"); utils.locations.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (loc: LocationRow) => { setEditing(loc); setShowForm(true); };

  return (
    <DashboardLayout>
      <PageHeader
        title="Warehouse Locations"
        subtitle="Manage ship-to facilities. Assign one to each client from their client page."
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showInactive ? "default" : "outline"}
              onClick={() => setShowInactive(!showInactive)}
            >
              <Archive className="w-4 h-4 mr-1" />
              {showInactive ? "Hide inactive" : "Show inactive"}
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add Location
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading locations...</p>
      ) : locations.length === 0 ? (
        <Card className="bg-card/60 border-border/50">
          <CardContent className="py-12 text-center">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium">No warehouse locations yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Add your first facility so customers know where to send equipment.
            </p>
            <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add Location</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((loc: LocationRow) => (
            <Card key={loc.id} className={`bg-card/60 border-border/50 ${!loc.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{loc.name}</p>
                      {!loc.isActive && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400">Inactive</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(loc)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {loc.isActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                        onClick={() => {
                          if (window.confirm(`Deactivate "${loc.name}"? Customers assigned to it will no longer see it.`)) {
                            deactivateMut.mutate({ id: loc.id });
                          }
                        }}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm">{loc.address}</p>
                <p className="text-sm text-muted-foreground">{loc.city}, {loc.state} {loc.zip}</p>
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  {loc.contactName && (
                    <p className="flex items-center gap-1.5"><User className="w-3 h-3" />{loc.contactName}{loc.contactPhone && ` · ${loc.contactPhone}`}</p>
                  )}
                  {!loc.contactName && loc.contactPhone && (
                    <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{loc.contactPhone}</p>
                  )}
                  {loc.receivingHours && (
                    <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{loc.receivingHours}</p>
                  )}
                </div>
                {loc.dockInfo && (
                  <p className="mt-2 text-xs bg-black/20 border border-border/50 rounded p-2">{loc.dockInfo}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Location" : "Add Warehouse Location"}</DialogTitle>
          </DialogHeader>
          <LocationForm location={editing} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
