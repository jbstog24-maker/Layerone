import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Truck, Plus, CheckCircle2, CreditCard } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatCents } from "../../../shared/delivery-pricing";

const TIME_WINDOW_LABELS: Record<string, string> = {
  morning: "Morning (8 AM - 12 PM)",
  afternoon: "Afternoon (12 PM - 5 PM)",
  custom: "Custom",
};

export function DeliveryRequestsList() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const canRequest = role === "admin" || role === "staff" || role === "customer_admin";

  const { data: requests, isLoading } = trpc.deliveryRequests.list.useQuery({});

  return (
    <DashboardLayout>
      <PageHeader
        title="Delivery Requests"
        subtitle="Outbound deliveries to your sites. Payment is collected up front at booking."
        action={
          canRequest ? (
            <Button onClick={() => setLocation("/delivery-request")}>
              <Plus className="w-4 h-4 mr-2" /> New delivery request
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="animate-pulse h-32 bg-muted/50 rounded" />
      ) : !requests || requests.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No delivery requests yet"
          description="Book your first delivery and it will show up here with its tracking number."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3 font-medium">Tracking #</th>
                    <th className="p-3 font-medium">Site</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Load</th>
                    <th className="p-3 font-medium">Total</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r: any) => (
                    <tr
                      key={r.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setLocation(`/delivery-requests/${r.id}`)}
                    >
                      <td className="p-3 font-mono font-medium">{r.trackingNumber ?? `#${r.id}`}</td>
                      <td className="p-3">
                        <div className="font-medium">{r.siteName}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.addressCity}, {r.addressState}
                        </div>
                      </td>
                      <td className="p-3">
                        {r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString("en-US") : "-"}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {[r.palletCount > 0 && `${r.palletCount} plt`, r.packageCount > 0 && `${r.packageCount} pkg`, r.largeItemCount > 0 && `${r.largeItemCount} lrg`, r.looseDeviceCount > 0 && `${r.looseDeviceCount} dev`]
                          .filter(Boolean)
                          .join(" · ") || "-"}
                      </td>
                      <td className="p-3 font-medium">{formatCents(r.totalCents ?? 0)}</td>
                      <td className="p-3">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {isStaff && (
        <p className="text-xs text-muted-foreground mt-4">
          Staff view: showing delivery requests for all clients.
        </p>
      )}
    </DashboardLayout>
  );
}

function ProofOfDeliveryDialog({
  requestId,
  trackingNumber,
  onClose,
}: {
  requestId: number;
  trackingNumber: string;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const completeMutation = trpc.deliveryRequests.completeDelivery.useMutation({
    onSuccess: () => {
      toast.success("Delivery marked complete");
      utils.deliveryRequests.get.invalidate({ id: requestId });
      utils.deliveryRequests.list.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const valid = firstName.trim() && lastName.trim() && phone.trim() && /.+@.+\..+/.test(email);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete delivery {trackingNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Record who received the delivery on site. This is the proof of delivery.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Receiver first name *</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Receiver last name *</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Receiver phone *</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="(555) 123-4567" />
          </div>
          <div>
            <Label>Receiver email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="name@company.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!valid || completeMutation.isPending}
            onClick={() =>
              completeMutation.mutate({
                id: requestId,
                receiverFirstName: firstName.trim(),
                receiverLastName: lastName.trim(),
                receiverPhone: phone.trim(),
                receiverEmail: email.trim(),
              })
            }
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {completeMutation.isPending ? "Saving..." : "Mark delivered"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeliveryRequestDetail() {
  const [, params] = useRoute("/delivery-requests/:id");
  const id = parseInt(params?.id ?? "0");
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const utils = trpc.useUtils();
  const [showPod, setShowPod] = useState(false);

  const { data: r, isLoading } = trpc.deliveryRequests.get.useQuery({ id });
  const payment = new URLSearchParams(window.location.search).get("payment");

  const setStatusMutation = trpc.deliveryRequests.setStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.deliveryRequests.get.invalidate({ id });
      utils.deliveryRequests.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse h-32 bg-muted/50 rounded" />
      </DashboardLayout>
    );
  }
  if (!r) {
    return (
      <DashboardLayout>
        <EmptyState icon={Truck} title="Delivery request not found" />
      </DashboardLayout>
    );
  }

  const canComplete = isStaff && ["paid", "scheduled", "in_transit"].includes(r.status);
  const needsPayment = r.status === "pending_payment";

  return (
    <DashboardLayout>
      <PageHeader
        title={r.trackingNumber ?? `Delivery #${r.id}`}
        subtitle={`${r.siteName} - ${r.addressCity}, ${r.addressState}`}
        action={
          isStaff ? (
            <div className="flex gap-2">
              {r.status === "paid" && (
                <Button
                  variant="outline"
                  onClick={() => setStatusMutation.mutate({ id, status: "scheduled" })}
                  disabled={setStatusMutation.isPending}
                >
                  Mark scheduled
                </Button>
              )}
              {r.status === "scheduled" && (
                <Button
                  variant="outline"
                  onClick={() => setStatusMutation.mutate({ id, status: "in_transit" })}
                  disabled={setStatusMutation.isPending}
                >
                  Mark in transit
                </Button>
              )}
              {canComplete && <Button onClick={() => setShowPod(true)}>Complete delivery</Button>}
            </div>
          ) : undefined
        }
      />

      {payment === "success" && (
        <Card className="mb-6 border-green-500/40 bg-green-500/5">
          <CardContent className="pt-4 text-sm">
            Payment received. Your delivery request is confirmed and our team will be in touch to
            coordinate the details.
          </CardContent>
        </Card>
      )}
      {payment === "cancelled" && needsPayment && (
        <Card className="mb-6 border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-4 text-sm">
            Payment was cancelled. This request is still awaiting payment and is not scheduled yet.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Delivery details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={r.status} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Time window</span><span>{r.timeWindow === "custom" ? r.customTimeWindow || "Custom" : TIME_WINDOW_LABELS[r.timeWindow]}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Deliver to</span><span className="text-right">{r.addressStreet}<br />{r.addressCity}, {r.addressState} {r.addressZip}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Est. miles (one-way)</span><span>{r.estimatedMiles}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Packages</span><span>{r.packageCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Large items</span><span>{r.largeItemCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pallets</span><span>{r.palletCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Loose devices</span><span>{r.looseDeviceCount}</span></div>
            {r.specialInstructions && (
              <div className="pt-2"><span className="text-muted-foreground">Instructions</span><p className="mt-1 whitespace-pre-wrap">{r.specialInstructions}</p></div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Trip charge</span><span>{formatCents(r.tripCents ?? 0)}</span></div>
              {(r.packageCents ?? 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Packages</span><span>{formatCents(r.packageCents ?? 0)}</span></div>}
              {(r.largeItemCents ?? 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Large items</span><span>{formatCents(r.largeItemCents ?? 0)}</span></div>}
              {(r.palletCents ?? 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Pallets</span><span>{formatCents(r.palletCents ?? 0)}</span></div>}
              {(r.deviceCents ?? 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Loose devices</span><span>{formatCents(r.deviceCents ?? 0)}</span></div>}
              <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>{formatCents(r.totalCents ?? 0)}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Payment</span><span>{r.paidAt ? `Paid ${new Date(r.paidAt).toLocaleDateString("en-US")}` : "Not yet paid"}</span></div>
            </CardContent>
          </Card>

          {r.status === "delivered" && (
            <Card>
              <CardHeader>
                <CardTitle>Proof of delivery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Received by</span><span>{r.receiverFirstName} {r.receiverLastName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{r.receiverPhone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{r.receiverEmail}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivered at</span><span>{r.deliveredAt ? new Date(r.deliveredAt).toLocaleString("en-US") : "-"}</span></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showPod && (
        <ProofOfDeliveryDialog
          requestId={id}
          trackingNumber={r.trackingNumber ?? `#${r.id}`}
          onClose={() => setShowPod(false)}
        />
      )}
    </DashboardLayout>
  );
}
