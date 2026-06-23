/**
 * HelpCenter — searchable documentation page covering every feature
 * in the navigation. Content is role-aware: admin/staff see operational
 * docs, customers see portal-usage docs.
 */

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import OnboardingTour from "@/components/OnboardingTour";
import {
  Search, LayoutDashboard, Building2, Server, Package, Truck,
  FileText, Users, BarChart3, HelpCircle, Ticket, TrendingUp,
  MessageSquare, Settings, PlayCircle, ChevronDown, ChevronUp,
  Zap, Shield, Bell, Download, Upload, Star,
} from "lucide-react";

// ─── Content model ────────────────────────────────────────────────────────────

type DocRole = "admin" | "staff" | "customer" | "all";

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  roles: DocRole[];
  summary: string;
  articles: DocArticle[];
}

interface DocArticle {
  title: string;
  body: string; // plain text — rendered as paragraphs split on \n\n
  tips?: string[];
}

const DOCS: DocSection[] = [
  // ── Shared ──────────────────────────────────────────────────────────────
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Star,
    roles: ["all"],
    summary: "Everything you need to know to get up and running on the Layer One Staging Solutions Portal.",
    articles: [
      {
        title: "What is the Layer One Staging Solutions Portal?",
        body: "Layer One Staging Solutions Portal is an operations management platform for network equipment staging, warehousing, and logistics. It connects your internal team with your clients so everyone has real-time visibility into device status, shipments, invoices, and support.\n\nAdmin and staff users manage the day-to-day operations. Customer users (client admins and viewers) log in to track their own devices, shipments, and invoices without needing to call or email for updates.",
      },
      {
        title: "Logging in for the first time",
        body: "Click the Sign In button on the login page and authenticate with your Manus account. If your account was pre-provisioned by an admin, use the email address they registered for you.\n\nOnce logged in, you will see the guided tour automatically. You can replay it any time by clicking 'Take the Tour' below.",
        tips: [
          "If you don't see the tour, your account may already be marked as having completed it. Click 'Take the Tour' on this page to replay it.",
          "Bookmark the portal URL so you can return quickly.",
        ],
      },
      {
        title: "Navigating the portal",
        body: "The left sidebar groups features by category. Click any item to navigate to that section. On mobile, tap the menu icon at the top left to open the sidebar.\n\nThe header shows your current page title and, where applicable, action buttons like 'New Client' or 'Export CSV'. Your profile and sign-out option are at the bottom of the sidebar.",
      },
    ],
  },

  // ── Admin / Staff ────────────────────────────────────────────────────────
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "staff"],
    summary: "Live KPI overview of your entire operation — clients, devices, shipments, tickets, and revenue.",
    articles: [
      {
        title: "Understanding the KPI cards",
        body: "The top row of cards shows the most important numbers at a glance: total active clients, devices currently in staging, pending outbound shipments, open support tickets, and monthly revenue.\n\nEach card is colour-coded: green means healthy, amber means attention needed, red means action required.",
        tips: [
          "Click any KPI card to jump directly to the relevant list page.",
          "Numbers update in real time — no need to refresh the page.",
        ],
      },
      {
        title: "Attention alerts",
        body: "Below the KPI cards you will see an Alerts section. This surfaces items that need immediate action: overdue follow-ups on leads, devices stuck in a status for too long, invoices past their due date, and unanswered support tickets.\n\nAlerts are calculated server-side and refresh every time you load the dashboard.",
      },
      {
        title: "Recent activity feed",
        body: "The activity feed on the right side of the dashboard shows the last 20 actions taken by any staff member — client created, device status changed, invoice sent, etc. This gives you a quick audit trail without opening the full activity log.",
      },
    ],
  },
  {
    id: "clients",
    title: "Clients",
    icon: Building2,
    roles: ["admin", "staff"],
    summary: "Create and manage client accounts, warehouse assignments, onboarding timelines, and internal notes.",
    articles: [
      {
        title: "Creating a new client",
        body: "Click 'New Client' in the top-right corner of the Clients page. Fill in the company name, primary contact details, billing email, and select a service package. The system will automatically generate a unique account number (e.g. Layer One-00042) when the record is saved.\n\nThe client starts in 'Onboarding' status. Move them to 'Active' once the contract is signed and the first payment is received.",
        tips: [
          "The account number is permanent and used on all invoices and shipment labels.",
          "You can assign a package later — leave it blank if the client is still in negotiation.",
        ],
      },
      {
        title: "Onboarding timeline",
        body: "Each client detail page shows an onboarding timeline with five milestones: Inquiry Received, Contract Signed, First Payment, Warehouse Assigned, and Go-Live Date. These update automatically as you fill in the corresponding fields on the client record.\n\nUse the timeline to quickly see where a client is in the onboarding process without reading through notes.",
      },
      {
        title: "Assigning a warehouse space",
        body: "Open the client detail page and click 'Assign Warehouse Space'. Enter the unit number, facility address, access code, and dimensions. When you save, the client receives an automatic notification with their warehouse details.\n\nThe warehouse assignment date is recorded and appears in the onboarding timeline.",
      },
      {
        title: "Internal sticky notes",
        body: "The 'Internal Notes' tab on each client detail page lets staff leave notes that are never visible to the client. Use these for things like 'Client prefers calls on Tuesdays' or 'Awaiting PO approval from finance'.\n\nNotes can be pinned to keep them at the top of the list. Only admin and staff can see or create internal notes.",
        tips: [
          "Pinned notes appear with a yellow highlight so they stand out.",
          "Notes are timestamped and show which staff member created them.",
        ],
      },
      {
        title: "Archiving a client",
        body: "If a client relationship ends, click the 'Archive' button in the client list row. Archived clients are hidden from the default view but all their data (devices, invoices, shipments) is preserved.\n\nToggle 'Archived' in the top-right of the Clients page to view archived clients and restore them if needed.",
      },
      {
        title: "Exporting the client list",
        body: "Click 'Export CSV' in the Clients page header to download the current filtered list as a CSV file. The export includes account number, company name, contact details, status, and creation date.",
      },
    ],
  },
  {
    id: "devices",
    title: "Devices",
    icon: Server,
    roles: ["admin", "staff"],
    summary: "Track every piece of network equipment through its full staging lifecycle.",
    articles: [
      {
        title: "Device staging statuses",
        body: "Every device moves through a defined set of statuses:\n\nExpected → Received → Inventory Captured → Waiting Instructions → Ready for Staging → In Staging → Staged → Labeled → Packed → Ready to Ship → Shipped → Picked Up\n\nThere is also an Exception status for damaged or missing items. Update the status as your team works through each step.",
        tips: [
          "Use the search bar to filter by serial number, MAC address, or model.",
          "Devices in 'Exception' status appear with a red badge — resolve these promptly.",
        ],
      },
      {
        title: "Adding a single device",
        body: "Click 'Add Device' and fill in the device type, brand, model, serial number, MAC address, and assign it to a client. The system generates a unique device code automatically.\n\nYou can also link the device to a specific box, pallet, or delivery for full chain-of-custody tracking.",
      },
      {
        title: "Bulk importing devices from CSV",
        body: "Click 'Import CSV' to open the bulk import dialog. Select a client, then upload a CSV file. The importer automatically maps common column names (serial_number, mac_address, model, etc.) to the correct fields and shows a 5-row preview before you confirm.\n\nMaximum 500 devices per import. The import runs in the background and you will see a success toast when it completes.",
        tips: [
          "Download the CSV template from the import dialog to see the expected column format.",
          "Duplicate serial numbers within the same client are skipped with a warning.",
        ],
      },
      {
        title: "Exporting the device list",
        body: "Click 'Export CSV' to download all devices currently visible in the list (respecting any active search filter). The export includes device code, serial number, MAC address, model, brand, device type, staging status, and client ID.",
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory — Boxes & Pallets",
    icon: Package,
    roles: ["admin", "staff"],
    summary: "Log inbound deliveries, manage boxes and pallets, and track storage locations.",
    articles: [
      {
        title: "Logging an inbound delivery",
        body: "Go to Receiving and click 'New Receiving Log'. Select the client, enter the carrier and tracking number, record the box and pallet counts, and note the condition. Each log gets a timestamp and the name of the staff member who received it.\n\nIf you had an Expected Delivery set up in advance, link the receiving log to it so the delivery status updates automatically.",
      },
      {
        title: "Creating and managing pallets",
        body: "Each pallet gets a unique pallet code (e.g. PLT-00123). Assign boxes to a pallet, set the storage location, and track its status from Received through Shipped.\n\nYou can also set a forwarding address and contact on a pallet if it needs to be shipped to a specific site.",
      },
      {
        title: "Creating and managing boxes",
        body: "Boxes work the same way as pallets but at a smaller granularity. A box can be linked to a pallet or tracked independently. Record the contents, condition, and storage location for each box.",
      },
    ],
  },
  {
    id: "shipments",
    title: "Outbound Shipments",
    icon: Truck,
    roles: ["admin", "staff"],
    summary: "Create outbound shipments, attach tracking, and upload shipping documents.",
    articles: [
      {
        title: "Creating a shipment",
        body: "Go to Shipments and click 'New Shipment'. Select the client, enter the destination, carrier, and tracking number. Add the packed-by staff member and the scheduled ship date.\n\nOnce created, the shipment appears in the client's portal so they can track it in real time.",
      },
      {
        title: "Uploading shipping documents",
        body: "Open a shipment and click 'Add Document' to upload a Bill of Lading, shipping label, or any other document. Documents are stored securely and accessible to both staff and the client.\n\nSupported formats: PDF, PNG, JPG. Maximum file size: 20 MB.",
      },
      {
        title: "Shipment statuses",
        body: "Shipments move through: Preparing → Ready to Ship → Dispatched → In Transit → Delivered → Exception.\n\nUpdate the status as the shipment progresses. The client sees the current status in their portal and can view the tracking number to check with the carrier directly.",
      },
    ],
  },
  {
    id: "staging-tasks",
    title: "Staging Tasks",
    icon: Zap,
    roles: ["admin", "staff"],
    summary: "Assign and track firmware updates, labeling, switch staging, and other technical tasks.",
    articles: [
      {
        title: "Creating a staging task",
        body: "Go to Staging and click 'New Task'. Select the task type (firmware update, labeling, switch staging, AP prep, etc.), assign it to a technician, set the priority, and add step-by-step instructions.\n\nYou can link specific devices to a task so the technician knows exactly which units to work on.",
        tips: [
          "Use the 'Rush' priority for time-sensitive tasks — they appear at the top of the queue.",
          "Add estimated hours so you can track team capacity.",
        ],
      },
      {
        title: "Tracking task progress",
        body: "Tasks move through: Pending → In Progress → Completed (or On Hold / Cancelled). Staff update the status as they work.\n\nThe dashboard shows a count of tasks in each status so you can see at a glance if the team is on track.",
      },
    ],
  },
  {
    id: "leads",
    title: "Leads & Pipeline",
    icon: TrendingUp,
    roles: ["admin", "staff"],
    summary: "Manage your sales pipeline, import leads, and log all client interactions.",
    articles: [
      {
        title: "The pipeline board",
        body: "The Leads page shows a pipeline summary bar at the top with counts for each stage: New, Contacted, Qualified, Proposal, Won, and Lost. Use this to see where your pipeline is healthy and where deals are stalling.",
      },
      {
        title: "Adding a lead",
        body: "Click 'Add Lead' and fill in the company name, contact details, lead source, and estimated value. Assign it to a staff member and set a follow-up date.\n\nLeads can be promoted to a full client record once they convert — click 'Convert to Client' on the lead detail panel.",
        tips: [
          "Set a follow-up date on every lead so nothing falls through the cracks.",
          "Use the 'Source' field to track which marketing channels are generating the most leads.",
        ],
      },
      {
        title: "Importing leads from CSV",
        body: "Click 'Import CSV' to bulk-import leads. The importer maps common column names (company, contact_name, email, phone, source) automatically and shows a preview before import.\n\nImported leads are assigned 'New' status and appear at the top of the pipeline.",
      },
      {
        title: "Activity timeline",
        body: "Each lead has an activity timeline where you can log calls, emails, and notes. Every entry is timestamped and attributed to the staff member who created it.\n\nUse the timeline to keep a full history of every interaction so anyone on the team can pick up where you left off.",
      },
    ],
  },
  {
    id: "invoices",
    title: "Invoices & Billing",
    icon: FileText,
    roles: ["admin", "staff"],
    summary: "Generate invoices, record payments, and manage client billing.",
    articles: [
      {
        title: "Creating an invoice",
        body: "Go to Invoices and click 'New Invoice'. Select the client, add line items with descriptions and amounts, set the due date, and save. The invoice is immediately visible in the client's portal.\n\nYou can also generate invoices automatically on a monthly schedule — contact your admin to configure this.",
        tips: [
          "Add a note to the invoice if there are any special payment instructions.",
          "Invoices in 'Draft' status are not visible to the client until you mark them as 'Sent'.",
        ],
      },
      {
        title: "Recording a payment",
        body: "Open an invoice and click 'Record Payment'. Enter the amount, payment method (bank transfer, credit card, etc.), and reference number. The invoice status updates to 'Paid' automatically when the full amount is received.",
      },
      {
        title: "Stripe online payments",
        body: "If Stripe is configured, clients can pay invoices online directly from their portal. They click 'Pay Now' and are redirected to a secure Stripe checkout page. Payment confirmation is automatic.",
      },
    ],
  },
  {
    id: "support-admin",
    title: "Support Tickets (Admin)",
    icon: Ticket,
    roles: ["admin", "staff"],
    summary: "View and respond to all support tickets across every client.",
    articles: [
      {
        title: "The admin ticket inbox",
        body: "The Support Tickets page (under Operations in the sidebar) shows all tickets from all clients in one inbox. Filter by status (Open, In Progress, Resolved, Closed) or by client.\n\nTickets are sorted by last activity so the most recently updated ones appear first.",
      },
      {
        title: "Responding to a ticket",
        body: "Click a ticket to open it. You will see the full thread of messages between the client and your team. Type your reply in the text box at the bottom and click 'Send Reply'.\n\nYou can also add an internal note that is only visible to staff — useful for escalation notes or context for other team members.",
        tips: [
          "Change the ticket status to 'In Progress' when you start working on it so the client knows it's being handled.",
          "Mark tickets 'Resolved' when the issue is fixed — the client can re-open if needed.",
        ],
      },
      {
        title: "Priority levels",
        body: "Tickets have four priority levels: Low, Normal, High, and Urgent. Set the priority when you first open a ticket. High and Urgent tickets appear with coloured badges in the inbox so they stand out.",
      },
    ],
  },
  {
    id: "users",
    title: "Users & Staff",
    icon: Users,
    roles: ["admin"],
    summary: "Manage staff accounts and customer portal accounts.",
    articles: [
      {
        title: "User roles explained",
        body: "There are four roles:\n\nAdmin — full access to everything including user management, billing, and reports.\n\nStaff — operational access to clients, devices, shipments, staging, and support. Cannot manage users or view financial reports.\n\nCustomer Admin — portal access for the client's primary contact. Can view all their company's data and submit support tickets.\n\nCustomer Viewer — read-only portal access for additional client contacts.",
      },
      {
        title: "Pre-provisioning a customer account",
        body: "Go to Users, click 'Add New User', select the Customer Admin or Customer Viewer role, and enter the client's email address. The system sends them an invite email with a link to activate their account.\n\nThe client logs in with their Manus account — no separate password needed.",
        tips: [
          "Always link a customer account to the correct client record using the 'Client' dropdown.",
          "You can resend the invite email from the user's card if they didn't receive it.",
        ],
      },
      {
        title: "Activating and deactivating accounts",
        body: "Click 'Deactivate' on a user card to suspend their access without deleting the account. Their data and history are preserved. Click 'Activate' to restore access.\n\nYou cannot deactivate your own account.",
      },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    icon: BarChart3,
    roles: ["admin"],
    summary: "Export operational data to CSV and view KPI summaries.",
    articles: [
      {
        title: "Available exports",
        body: "The Reports page offers three CSV exports:\n\nDevice Inventory — all devices with their status, serial numbers, MAC addresses, and client assignments.\n\nShipments — all outbound shipments with carrier, tracking number, destination, and status.\n\nClient Summary — all clients with account number, contact details, status, and package.",
        tips: [
          "Use the client filter on the Shipments export to download data for a single client.",
          "Exports respect any active filters on the page — use search to narrow the data before exporting.",
        ],
      },
      {
        title: "KPI summary cards",
        body: "The top of the Reports page shows the same KPI cards as the dashboard — total clients, devices, shipments, and revenue. Use these as a quick sanity check before diving into the CSV data.",
      },
    ],
  },
  {
    id: "messages",
    title: "Messages",
    icon: MessageSquare,
    roles: ["admin", "staff"],
    summary: "Direct messaging between staff and client contacts.",
    articles: [
      {
        title: "Sending a message",
        body: "Go to Messages and select a client conversation, or start a new one by clicking 'New Conversation'. Messages are delivered instantly and the client sees them in their portal.\n\nUse messages for quick updates and questions. For formal communications, use the invoice notes or support ticket system instead.",
      },
    ],
  },

  // ── Customer ─────────────────────────────────────────────────────────────
  {
    id: "customer-dashboard",
    title: "Your Dashboard",
    icon: LayoutDashboard,
    roles: ["customer"],
    summary: "A summary of your account — devices, shipments, invoices, and recent activity.",
    articles: [
      {
        title: "What you can see on the dashboard",
        body: "Your dashboard shows a summary of everything happening with your account: how many devices are in staging, pending shipments, open invoices, and any recent activity by our team.\n\nIf there is anything that needs your attention (e.g. an invoice due soon), it will appear as an alert at the top of the page.",
      },
    ],
  },
  {
    id: "customer-devices",
    title: "My Devices",
    icon: Server,
    roles: ["customer"],
    summary: "Track every device we are staging for you in real time.",
    articles: [
      {
        title: "Understanding device statuses",
        body: "Each device moves through a series of statuses as our team works on it:\n\nExpected — we are expecting this device to arrive.\nReceived — the device has arrived at our facility.\nInventory Captured — we have logged the serial number and MAC address.\nIn Staging — a technician is actively working on this device.\nStaged — staging is complete.\nLabeled & Packed — the device is ready for shipment.\nShipped — the device is on its way to you.\n\nYou will see the current status for each device in the list.",
        tips: [
          "Use the search bar to find a specific device by serial number or model.",
          "If a device shows 'Exception', please contact your account manager.",
        ],
      },
    ],
  },
  {
    id: "customer-shipments",
    title: "My Shipments",
    icon: Truck,
    roles: ["customer"],
    summary: "Track your outbound shipments and access shipping documents.",
    articles: [
      {
        title: "Tracking a shipment",
        body: "The Shipments page shows all outbound shipments for your account. Each shipment shows the carrier, tracking number, destination, and current status.\n\nClick a shipment to see the full details including any attached documents (Bill of Lading, shipping labels, etc.).",
        tips: [
          "Use the tracking number to check the carrier's website for real-time delivery updates.",
          "Shipping documents are available to download directly from the shipment detail page.",
        ],
      },
    ],
  },
  {
    id: "customer-invoices",
    title: "My Invoices",
    icon: FileText,
    roles: ["customer"],
    summary: "View, download, and pay your invoices.",
    articles: [
      {
        title: "Viewing and paying an invoice",
        body: "The Invoices page lists all invoices for your account. Click an invoice to see the line items and total. If online payment is enabled, click 'Pay Now' to pay securely via Stripe.\n\nIf you are paying by bank transfer, ask your account manager to record the payment once it clears.",
        tips: [
          "Download a PDF copy of any invoice by clicking the download icon.",
          "Invoices marked 'Overdue' are past their due date — please contact us if you have any questions.",
        ],
      },
    ],
  },
  {
    id: "customer-support",
    title: "Support Tickets",
    icon: Ticket,
    roles: ["customer"],
    summary: "Submit and track support requests.",
    articles: [
      {
        title: "Submitting a support ticket",
        body: "Go to Support Tickets and click 'New Ticket'. Give your issue a clear title, describe the problem in detail, and set the priority (Low, Normal, High, Urgent).\n\nOur team will respond in the ticket thread. You will see the reply here and can respond back to continue the conversation.",
        tips: [
          "Include as much detail as possible — device serial numbers, error messages, screenshots — so we can resolve your issue faster.",
          "You will receive a notification when we reply to your ticket.",
        ],
      },
      {
        title: "Ticket statuses",
        body: "Open — your ticket has been received and is waiting for a response.\nIn Progress — a team member is actively working on your issue.\nResolved — we believe the issue is fixed. If it is not, you can re-open the ticket by replying.\nClosed — the ticket has been closed after resolution.",
      },
    ],
  },
];

// ─── Article accordion ────────────────────────────────────────────────────────

function ArticleItem({ article }: { article: DocArticle }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        className="w-full flex items-center justify-between gap-3 py-3 text-left hover:text-foreground text-sm font-medium text-foreground/80 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span>{article.title}</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="pb-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {article.body.split("\n\n").map((para, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{para}</p>
          ))}
          {article.tips && article.tips.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Tips</p>
              {article.tips.map((tip, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">• {tip}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function DocSectionCard({ section, highlight }: { section: DocSection; highlight: string }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = section.icon;

  const matchedArticles = highlight
    ? section.articles.filter(
        a =>
          a.title.toLowerCase().includes(highlight) ||
          a.body.toLowerCase().includes(highlight) ||
          (a.tips ?? []).some(t => t.toLowerCase().includes(highlight))
      )
    : section.articles;

  if (highlight && matchedArticles.length === 0 && !section.summary.toLowerCase().includes(highlight) && !section.title.toLowerCase().includes(highlight)) {
    return null;
  }

  const articlesToShow = highlight ? matchedArticles : expanded ? section.articles : section.articles.slice(0, 3);

  return (
    <Card className="bg-card/60 border-border/50" id={`help-${section.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{section.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{section.summary}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="mb-3" />
        <div>
          {articlesToShow.map((article, i) => (
            <ArticleItem key={i} article={article} />
          ))}
        </div>
        {!highlight && section.articles.length > 3 && (
          <button
            className="mt-2 text-xs text-primary hover:underline"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? "Show fewer articles" : `Show ${section.articles.length - 3} more articles`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HelpCenter() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [tourOpen, setTourOpen] = useState(false);
  const resetTourMut = trpc.users.resetTour.useMutation();
  const utils = trpc.useUtils();

  const roleBucket: "admin" | "staff" | "customer" =
    (user as any)?.role === "admin"
      ? "admin"
      : (user as any)?.role === "staff"
      ? "staff"
      : "customer";

  const visibleSections = useMemo(() => {
    return DOCS.filter(s => s.roles.includes("all") || s.roles.includes(roleBucket));
  }, [roleBucket]);

  const highlight = search.trim().toLowerCase();

  const handleTakeTour = () => {
    resetTourMut.mutate(undefined, {
      onSuccess: () => {
        utils.auth.me.invalidate();
        setTourOpen(true);
      },
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Help Center"
        subtitle="Guides and documentation for every feature in the portal"
        action={
          <Button onClick={handleTakeTour} variant="outline" size="sm" className="gap-2" disabled={resetTourMut.isPending}>
            <PlayCircle className="w-4 h-4" />
            Take the Tour
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-6 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {highlight && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing results for <span className="text-foreground font-medium">"{search}"</span>
          </p>
        )}
      </div>

      {/* Quick-jump nav (hidden when searching) */}
      {!highlight && (
        <div className="mb-6 flex flex-wrap gap-2">
          {visibleSections.map(s => {
            const Icon = s.icon;
            return (
              <a
                key={s.id}
                href={`#help-${s.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-card/40 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <Icon className="w-3.5 h-3.5" />
                {s.title}
              </a>
            );
          })}
        </div>
      )}

      {/* Doc sections */}
      <div className="space-y-4">
        {visibleSections.map(section => (
          <DocSectionCard key={section.id} section={section} highlight={highlight} />
        ))}
        {highlight && visibleSections.every(s => {
          const matchedArticles = s.articles.filter(
            a =>
              a.title.toLowerCase().includes(highlight) ||
              a.body.toLowerCase().includes(highlight) ||
              (a.tips ?? []).some(t => t.toLowerCase().includes(highlight))
          );
          return matchedArticles.length === 0 && !s.summary.toLowerCase().includes(highlight) && !s.title.toLowerCase().includes(highlight);
        }) && (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No results found for "{search}".</p>
            <p className="text-xs mt-1">Try different keywords or browse the sections above.</p>
          </div>
        )}
      </div>

      {/* Tour overlay */}
      {tourOpen && (
        <OnboardingTour forceOpen={tourOpen} onClose={() => setTourOpen(false)} />
      )}
    </DashboardLayout>
  );
}
