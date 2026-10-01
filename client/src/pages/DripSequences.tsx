import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, Plus, Trash2, Play, Pause, ChevronRight, Loader2, Send, Clock, MailOpen } from "lucide-react";

export default function DripSequences() {
  const utils = trpc.useUtils();
  const [selectedSeqId, setSelectedSeqId] = useState<number | null>(null);
  const [showCreateSeq, setShowCreateSeq] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [newSeqName, setNewSeqName] = useState("");
  const [newSeqDesc, setNewSeqDesc] = useState("");
  const [newStep, setNewStep] = useState({ stepNumber: 1, delayDays: 0, subject: "", body: "" });

  const { data: sequences, isLoading } = trpc.leads.listSequences.useQuery();
  const { data: selectedSeq } = trpc.leads.getSequence.useQuery(
    { id: selectedSeqId! },
    { enabled: !!selectedSeqId }
  );

  const createSeqMutation = trpc.leads.createSequence.useMutation({
    onSuccess: () => {
      utils.leads.listSequences.invalidate();
      setShowCreateSeq(false);
      setNewSeqName("");
      setNewSeqDesc("");
      toast.success("Sequence created");
    },
    onError: e => toast.error(e.message),
  });

  const deleteSeqMutation = trpc.leads.deleteSequence.useMutation({
    onSuccess: () => {
      utils.leads.listSequences.invalidate();
      if (selectedSeqId) setSelectedSeqId(null);
      toast.success("Sequence deleted");
    },
    onError: e => toast.error(e.message),
  });

  const addStepMutation = trpc.leads.addStep.useMutation({
    onSuccess: () => {
      utils.leads.getSequence.invalidate({ id: selectedSeqId! });
      setShowAddStep(false);
      setNewStep({ stepNumber: (selectedSeq?.steps?.length ?? 0) + 2, delayDays: 3, subject: "", body: "" });
      toast.success("Step added");
    },
    onError: e => toast.error(e.message),
  });

  const deleteStepMutation = trpc.leads.deleteStep.useMutation({
    onSuccess: () => {
      utils.leads.getSequence.invalidate({ id: selectedSeqId! });
      toast.success("Step removed");
    },
    onError: e => toast.error(e.message),
  });

  const toggleActiveMutation = trpc.leads.updateSequence.useMutation({
    onSuccess: () => {
      utils.leads.listSequences.invalidate();
      utils.leads.getSequence.invalidate({ id: selectedSeqId! });
    },
    onError: e => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" /> Email Drip Sequences
            </h1>
            <p className="text-muted-foreground mt-1">Create multi-step email campaigns and enroll leads automatically.</p>
          </div>
          <Button onClick={() => setShowCreateSeq(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Sequence
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sequence List */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sequences</h2>
            {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>}
            {sequences?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No sequences yet
              </div>
            )}
            {sequences?.map(seq => (
              <Card
                key={seq.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${selectedSeqId === seq.id ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setSelectedSeqId(seq.id)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{seq.name}</p>
                      {seq.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{seq.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={seq.isActive ? "default" : "secondary"} className="text-xs">
                        {seq.isActive ? "Active" : "Paused"}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sequence Detail */}
          <div className="lg:col-span-2">
            {!selectedSeq && (
              <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Select a sequence to view its steps</p>
              </div>
            )}
            {selectedSeq && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{selectedSeq.name}</CardTitle>
                      {selectedSeq.description && <p className="text-sm text-muted-foreground mt-1">{selectedSeq.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActiveMutation.mutate({ id: selectedSeq.id, isActive: !selectedSeq.isActive })}
                      >
                        {selectedSeq.isActive ? <><Pause className="h-3 w-3 mr-1" />Pause</> : <><Play className="h-3 w-3 mr-1" />Activate</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Delete this sequence?")) deleteSeqMutation.mutate({ id: selectedSeq.id });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{selectedSeq.steps?.length ?? 0} Steps</h3>
                    <Button size="sm" variant="outline" onClick={() => {
                      setNewStep({ stepNumber: (selectedSeq.steps?.length ?? 0) + 1, delayDays: selectedSeq.steps?.length === 0 ? 0 : 3, subject: "", body: "" });
                      setShowAddStep(true);
                    }}>
                      <Plus className="h-3 w-3 mr-1" /> Add Step
                    </Button>
                  </div>

                  {selectedSeq.steps?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                      No steps yet - add the first email step
                    </div>
                  )}

                  {selectedSeq.steps?.map((step, idx) => (
                    <div key={step.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{idx + 1}</div>
                          <span className="font-medium text-sm">{step.subject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {step.delayDays > 0 ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> +{step.delayDays}d
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Send className="h-3 w-3" /> Immediately
                            </span>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => deleteStepMutation.mutate({ id: step.id })}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 pl-8">{step.body}</p>
                    </div>
                  ))}

                  {(selectedSeq.steps?.length ?? 0) > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MailOpen className="h-3 w-3" />
                        To enroll leads in this sequence, open a lead's detail page and click "Enroll in Drip"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Create Sequence Dialog */}
        <Dialog open={showCreateSeq} onOpenChange={setShowCreateSeq}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Drip Sequence</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="e.g. DFW IT Companies Cold Outreach" value={newSeqName} onChange={e => setNewSeqName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Textarea placeholder="What is this sequence for?" value={newSeqDesc} onChange={e => setNewSeqDesc(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateSeq(false)}>Cancel</Button>
              <Button disabled={!newSeqName.trim() || createSeqMutation.isPending} onClick={() => createSeqMutation.mutate({ name: newSeqName, description: newSeqDesc || undefined })}>
                {createSeqMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Step Dialog */}
        <Dialog open={showAddStep} onOpenChange={setShowAddStep}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add Email Step</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Step Number</Label>
                  <Input type="number" min={1} value={newStep.stepNumber} onChange={e => setNewStep(s => ({ ...s, stepNumber: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Send After (days)</Label>
                  <Input type="number" min={0} value={newStep.delayDays} onChange={e => setNewStep(s => ({ ...s, delayDays: Number(e.target.value) }))} />
                  <p className="text-xs text-muted-foreground">0 = send immediately when enrolled</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email Subject</Label>
                <Input placeholder="Subject line..." value={newStep.subject} onChange={e => setNewStep(s => ({ ...s, subject: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Email Body</Label>
                <Textarea placeholder="Write your email body here. Use plain text - line breaks will be preserved." value={newStep.body} onChange={e => setNewStep(s => ({ ...s, body: e.target.value }))} rows={8} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddStep(false)}>Cancel</Button>
              <Button
                disabled={!newStep.subject.trim() || !newStep.body.trim() || addStepMutation.isPending}
                onClick={() => addStepMutation.mutate({ sequenceId: selectedSeqId!, ...newStep })}
              >
                {addStepMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Add Step
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
