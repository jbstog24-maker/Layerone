import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  expected: "Expected",
  in_transit: "In Transit",
  received: "Received",
  partially_received: "Partial",
  damaged: "Damaged",
  exception: "Exception",
  closed: "Closed",
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
  cancelled: "Cancelled",
  shipped: "Shipped",
  delivered: "Delivered",
  requested: "Requested",
  packing: "Packing",
  ready_to_ship: "Ready to Ship",
  active: "Active",
  inactive: "Inactive",
  onboarding: "Onboarding",
  suspended: "Suspended",
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
  good: "Good",
  in_storage: "In Storage",
  staging: "Staging",
  staged: "Staged",
  packed: "Packed",
  inventory_captured: "Inventory Captured",
  waiting_instructions: "Waiting Instructions",
  ready_for_staging: "Ready for Staging",
  in_staging: "In Staging",
  labeled: "Labeled",
  ready_to_ship_device: "Ready to Ship",
  picked_up: "Picked Up",
  rush: "Rush",
  high: "High",
  normal: "Normal",
  low: "Low",
  processed: "Processed",
  partial: "Partial",
  // Package tiers
  basic: "Basic",
  standard: "Standard",
  professional: "Professional",
  enterprise: "Enterprise",
  custom: "Custom",
  // Delivery request statuses
  pending_payment: "Awaiting Payment",
  scheduled: "Scheduled",
  failed: "Failed Delivery",
  // User roles
  admin: "Admin",
  staff: "Staff",
  customer_admin: "Customer Admin",
  customer_viewer: "Viewer",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        `status-${status}`,
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        className
      )}
    >
      {label}
    </span>
  );
}
