import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, LoadingRows } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileText, Plus, ChevronRight, Trash2, Zap, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";

const LINE_ITEM_CATEGORIES = [
  { value: "base_package", label: "Base Package" },
  { value: "extra_boxes", label: "Extra Boxes" },
  { value: "extra_pallets", label: "Extra Pallets" },
  { value: "extra_devices", label: "Extra Devices" },
  { value: "storage_overage", label: "Storage Overage" },
  { value: "labor_hours", label: "Labor Hours" },
  { value: "packing_shipping", label: "Packing & Shipping" },
  { value: "rush_fee", label: "Rush Fee" },
  { value: "special_handling", label: "Special Handling" },
  { value: "shipping_materials", label: "Shipping Materials" },
  { value: "other", label: "Other" },
];

function CreateInvoiceForm({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: clients } = trpc.clients.list.useQuery({});
  const createMutation = trpc.billing.createInvoice.useMutation({
    onSuccess: () => { toast.success("Invoice created"); utils.billing.listInvoices.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const generateMutation = trpc.billing.generateFromUsage.useMutation({
    onSuccess: (data) => { toast.success(`Invoice ${data.invoiceNumber} generated`); utils.billing.listInvoices.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: { clientId: "", periodStart: "", periodEnd: "", notes: "", dueDate: "" },
  });
  const clientId = watch("clientId");
  const periodStart = watch("periodStart");
  const periodEnd = watch("periodEnd");

  const onSubmit = (data: any) => createMutation.mutate({ ...data, clientId: parseInt(data.clientId) });
  const onGenerate = () => {
    if (!clientId || !periodStart || !periodEnd) { toast.error("Select client and period first"); return; }
    generateMutation.mutate({ clientId: parseInt(clientId), periodStart, periodEnd });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Client *</Label>
          <Select onValueChange={(v) => setValue("clientId", v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Period Start</Label><Input {...register("periodStart")} type="date" className="mt-1" /></div>
        <div><Label>Period End</Label><Input {...register("periodEnd")} type="date" className="mt-1" /></div>
        <div><Label>Due Date</Label><Input {...register("dueDate")} type="date" className="mt-1" /></div>
        <div className="col-span-2"><Label>Notes</Label><Textarea {...register("notes")} className="mt-1" rows={2} /></div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="button" variant="outline" onClick={onGenerate} disabled={generateMutation.isPending} className="flex-1">
          <Zap className="w-4 h-4 mr-1" /> Auto-Generate
        </Button>
        <Button type="submit" disabled={createMutation.isPending} className="flex-1">Create Blank</Button>
      </div>
    </form>
  );
}

export function InvoicesList() {
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isAdmin = role === "admin";
  const { data: invoices, isLoading } = trpc.billing.listInvoices.useQuery({});

  function exportInvoicesCSV() {
    if (!invoices?.length) { toast.info("No invoices to export"); return; }
    const rows = invoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      periodStart: new Date(inv.periodStart).toLocaleDateString(),
      periodEnd: new Date(inv.periodEnd).toLocaleDateString(),
      total: `$${Number(inv.total).toFixed(2)}`,
      status: inv.status,
      dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "",
    }));
    const keys = Object.keys(rows[0]);
    const lines = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify((r as any)[k] ?? "")).join(","))];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "invoices.csv"; a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Invoices"
        subtitle="Manage billing and invoice generation"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportInvoicesCSV}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
            {isAdmin && <Button onClick={() => setShowCreate(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Invoice</Button>}
          </div>
        }
      />
      <Card className="bg-card/60 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Period</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={6} /> : invoices?.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={FileText} title="No invoices yet" /></td></tr>
              ) : invoices?.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setLocation(`/invoices/${inv.id}`)}>
                  <td className="px-4 py-3"><span className="font-mono text-sm font-medium">{inv.invoiceNumber}</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(inv.periodStart).toLocaleDateString()} – {new Date(inv.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">${Number(inv.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
          <CreateInvoiceForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export function InvoiceDetail() {
  const [, params] = useRoute("/invoices/:id");
  const id = parseInt(params?.id ?? "0");
  const [, setLocation] = useLocation();
  const [showAddLine, setShowAddLine] = useState(false);
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isAdmin = role === "admin";
  const utils = trpc.useUtils();

  const { data: invoice, isLoading } = trpc.billing.getInvoice.useQuery({ id });
  const updateMutation = trpc.billing.updateInvoice.useMutation({
    onSuccess: () => { toast.success("Invoice updated"); utils.billing.getInvoice.invalidate({ id }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteLineMutation = trpc.billing.deleteLineItem.useMutation({
    onSuccess: () => { toast.success("Line item removed"); utils.billing.getInvoice.invalidate({ id }); },
    onError: (e) => toast.error(e.message),
  });

  const exportPDF = () => {
    if (!invoice) return;
    const lines = invoice.lineItems ?? [];
    const periodStr = `${new Date(invoice.periodStart).toLocaleDateString()} – ${new Date(invoice.periodEnd).toLocaleDateString()}`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoice.invoiceNumber}</title><style>
      body{font-family:Arial,sans-serif;color:#111;padding:40px;max-width:800px;margin:auto}
      h1{font-size:24px;margin-bottom:4px}h2{font-size:14px;color:#666;font-weight:normal;margin:0 0 24px}
      .meta{display:flex;gap:40px;margin-bottom:24px}.meta div label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.05em;display:block}.meta div span{font-size:14px;font-weight:600}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}th{text-align:left;font-size:11px;color:#888;text-transform:uppercase;padding:8px 12px;border-bottom:2px solid #eee}td{padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px}
      .totals{text-align:right}.totals table{width:auto;margin-left:auto}.totals td{padding:4px 12px}
      .total-row td{font-weight:700;font-size:15px;border-top:2px solid #111}
      .badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;background:#e8f5e9;color:#2e7d32}
      footer{margin-top:40px;font-size:11px;color:#aaa;text-align:center}
    </style></head><body>
      <h1>${invoice.invoiceNumber}</h1><h2>${periodStr}</h2>
      <div class="meta">
        <div><label>Status</label><span class="badge">${invoice.status}</span></div>
        ${invoice.dueDate ? `<div><label>Due Date</label><span>${new Date(invoice.dueDate).toLocaleDateString()}</span></div>` : ""}
        <div><label>Total</label><span>$${Number(invoice.total).toLocaleString("en-US",{minimumFractionDigits:2})}</span></div>
      </div>
      <table><thead><tr><th>Description</th><th>Category</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>
        ${lines.map(l => `<tr><td>${l.description}</td><td>${l.category?.replace(/_/g," ")??""}</td><td>${l.quantity??1}</td><td>$${Number(l.unitPrice).toFixed(2)}</td><td>$${Number(l.total).toFixed(2)}</td></tr>`).join("")}
      </tbody></table>
      <div class="totals"><table>
        <tr><td>Subtotal</td><td>$${Number(invoice.subtotal).toFixed(2)}</td></tr>
        <tr><td>Tax</td><td>$${Number(invoice.tax).toFixed(2)}</td></tr>
        <tr class="total-row"><td>Total</td><td>$${Number(invoice.total).toFixed(2)}</td></tr>
      </table></div>
      ${invoice.notes ? `<p style="margin-top:24px;font-size:13px;color:#555"><strong>Notes:</strong> ${invoice.notes}</p>` : ""}
      <footer>Generated by Layer One Staging Solutions Portal · Layer One · ${new Date().toLocaleDateString()}</footer>
    </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${invoice.invoiceNumber}.html`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice exported - open in browser and print to PDF");
  };

  const { register: regLine, handleSubmit: handleLine, setValue: setLineVal, reset: resetLine } = useForm({
    defaultValues: { description: "", category: "other", quantity: "1", unitPrice: "0.00", total: "0.00" },
  });
  const addLineMutation = trpc.billing.addLineItem.useMutation({
    onSuccess: () => { toast.success("Line item added"); utils.billing.getInvoice.invalidate({ id }); setShowAddLine(false); resetLine(); },
    onError: (e) => toast.error(e.message),
  });
  const onAddLine = (data: any) => addLineMutation.mutate({ invoiceId: id, ...data });

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-32 bg-muted/50 rounded" /></DashboardLayout>;
  if (!invoice) return <DashboardLayout><EmptyState icon={FileText} title="Invoice not found" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={`${new Date(invoice.periodStart).toLocaleDateString()} – ${new Date(invoice.periodEnd).toLocaleDateString()}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/invoices")}>Back</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <Download className="w-4 h-4 mr-1" />Export
            </Button>
            {isAdmin && (
              <Select defaultValue={invoice.status} onValueChange={(v) => updateMutation.mutate({ id, status: v as any })}>
                <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["draft","sent","paid","overdue","void"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        }
      />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-card/60 border-border/50">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Line Items</CardTitle>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => setShowAddLine(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Line
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {invoice.lineItems?.length === 0 ? (
                <p className="text-sm text-muted-foreground px-4 pb-4">No line items yet.</p>
              ) : (
                <>
                  <div className="px-4 py-2 grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                    <span className="col-span-5">Description</span>
                    <span className="col-span-2 text-right">Qty</span>
                    <span className="col-span-2 text-right">Unit Price</span>
                    <span className="col-span-2 text-right">Total</span>
                    <span className="col-span-1" />
                  </div>
                  {invoice.lineItems?.map((li: any) => (
                    <div key={li.id} className="px-4 py-3 grid grid-cols-12 gap-2 text-sm border-b border-border/50 last:border-0 items-center">
                      <div className="col-span-5">
                        <p className="font-medium">{li.description}</p>
                        <p className="text-xs text-muted-foreground">{li.category?.replace(/_/g, " ")}</p>
                      </div>
                      <span className="col-span-2 text-right text-muted-foreground">{li.quantity}</span>
                      <span className="col-span-2 text-right text-muted-foreground">${Number(li.unitPrice).toFixed(2)}</span>
                      <span className="col-span-2 text-right font-semibold">${Number(li.total).toFixed(2)}</span>
                      <div className="col-span-1 flex justify-end">
                        {isAdmin && (
                          <button onClick={() => deleteLineMutation.mutate({ id: li.id, invoiceId: id })} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {showAddLine && (
            <Card className="bg-card/60 border-border/50">
              <CardHeader><CardTitle className="text-sm">Add Line Item</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleLine(onAddLine)} className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Description *</Label>
                    <Input {...regLine("description")} className="mt-1" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select onValueChange={(v) => setLineVal("category", v as any)} defaultValue="other">
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{LINE_ITEM_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input {...regLine("quantity")} type="number" step="0.01" className="mt-1" />
                  </div>
                  <div>
                    <Label>Unit Price ($)</Label>
                    <Input {...regLine("unitPrice")} type="number" step="0.01" className="mt-1" />
                  </div>
                  <div>
                    <Label>Total ($)</Label>
                    <Input {...regLine("total")} type="number" step="0.01" className="mt-1" />
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddLine(false)} className="flex-1">Cancel</Button>
                    <Button type="submit" disabled={addLineMutation.isPending} className="flex-1">Add</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-card/60 border-border/50 h-fit">
          <CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><p className="text-muted-foreground text-xs mb-1">Status</p><StatusBadge status={invoice.status} /></div>
            <div><p className="text-muted-foreground text-xs mb-1">Due Date</p><p>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}</p></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(invoice.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${Number(invoice.tax).toFixed(2)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary">${Number(invoice.total).toFixed(2)}</span>
            </div>
            {invoice.notes && (
              <>
                <Separator />
                <div><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-muted-foreground text-xs">{invoice.notes}</p></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
