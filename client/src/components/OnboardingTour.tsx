/**
 * OnboardingTour — role-aware first-login guided tour.
 *
 * Shows a spotlight overlay with a tooltip card that walks the user through
 * the key sections of the portal. Steps are filtered by role so admins,
 * staff, and customers each see a relevant tour.
 *
 * Usage: mount once in DashboardLayout. It auto-shows when `hasSeenTour`
 * is false on the auth.me response. The user can also relaunch it from the
 * Help page via the "Take the Tour" button.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  X, ChevronRight, ChevronLeft, LayoutDashboard, Building2,
  Server, Package, Truck, FileText, Users, BarChart3, HelpCircle,
  Ticket, TrendingUp, Sparkles,
} from "lucide-react";

// ─── Step definitions ─────────────────────────────────────────────────────────

type TourRole = "admin" | "staff" | "customer";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  targetSelector?: string; // CSS selector for the element to spotlight
  roles: TourRole[];
  position?: "right" | "left" | "bottom" | "center";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to StagingOps Portal!",
    description:
      "This quick tour will show you the key areas of the platform. You can skip it at any time and replay it from the Help page.",
    icon: Sparkles,
    roles: ["admin", "staff", "customer"],
    position: "center",
  },
  // ── Admin / Staff steps ──────────────────────────────────────────────────
  {
    id: "dashboard",
    title: "Dashboard",
    description:
      "Your command centre. See live KPIs — active clients, devices in staging, pending shipments, open support tickets, and revenue at a glance. Alerts highlight anything that needs immediate attention.",
    icon: LayoutDashboard,
    targetSelector: "[data-tour='nav-dashboard']",
    roles: ["admin", "staff"],
    position: "right",
  },
  {
    id: "clients",
    title: "Clients",
    description:
      "Manage every client account. Each client gets an auto-generated account number (e.g. NSDS-00042), a warehouse space assignment, onboarding timeline, internal sticky notes, and a full audit trail. Archive clients without losing their history.",
    icon: Building2,
    targetSelector: "[data-tour='nav-clients']",
    roles: ["admin", "staff"],
    position: "right",
  },
  {
    id: "devices",
    title: "Devices",
    description:
      "Track every piece of network equipment by serial number, MAC address, and staging status — from Expected all the way through Shipped. Bulk-import devices from a CSV file and export the full inventory at any time.",
    icon: Server,
    targetSelector: "[data-tour='nav-devices']",
    roles: ["admin", "staff"],
    position: "right",
  },
  {
    id: "inventory",
    title: "Inventory — Boxes & Pallets",
    description:
      "Log inbound deliveries, assign boxes and pallets to storage locations, and track forwarding status. Each item gets a unique code and a full chain-of-custody record.",
    icon: Package,
    targetSelector: "[data-tour='nav-inventory']",
    roles: ["admin", "staff"],
    position: "right",
  },
  {
    id: "shipments",
    title: "Shipments",
    description:
      "Create outbound shipments, attach carrier and tracking numbers, and upload shipping documents (BOL, labels). Clients see their shipment status in real time through their portal.",
    icon: Truck,
    targetSelector: "[data-tour='nav-shipments']",
    roles: ["admin", "staff"],
    position: "right",
  },
  {
    id: "staging",
    title: "Staging Tasks",
    description:
      "Assign firmware updates, labeling runs, switch staging, and other tasks to technicians. Track estimated vs actual hours and mark tasks complete when done.",
    icon: Server,
    targetSelector: "[data-tour='nav-staging']",
    roles: ["admin", "staff"],
    position: "right",
  },
  {
    id: "leads",
    title: "Leads & Pipeline",
    description:
      "Manage your sales pipeline from New through Won. Import leads from a CSV, log calls and emails in the activity timeline, and track follow-up dates so nothing falls through the cracks.",
    icon: TrendingUp,
    targetSelector: "[data-tour='nav-leads']",
    roles: ["admin", "staff"],
    position: "right",
  },
  {
    id: "invoices",
    title: "Invoices & Billing",
    description:
      "Generate invoices for clients, record payments, and track outstanding balances. Monthly invoices can be auto-generated on a schedule. Stripe integration handles online payments.",
    icon: FileText,
    targetSelector: "[data-tour='nav-invoices']",
    roles: ["admin", "staff"],
    position: "right",
  },
  {
    id: "tickets-admin",
    title: "Support Tickets",
    description:
      "View and respond to all support tickets across every client. Set priority, change status, and add internal-only notes that customers cannot see.",
    icon: Ticket,
    targetSelector: "[data-tour='nav-admin-tickets']",
    roles: ["admin", "staff"],
    position: "right",
  },
  {
    id: "users",
    title: "Users & Staff",
    description:
      "Manage staff accounts (admin and operations roles) and customer portal accounts. Pre-provision customer accounts so clients can log in immediately. Activate or deactivate accounts without deleting them.",
    icon: Users,
    targetSelector: "[data-tour='nav-users']",
    roles: ["admin"],
    position: "right",
  },
  {
    id: "reports",
    title: "Reports",
    description:
      "Export devices, shipments, and client data to CSV for external reporting. KPI summary cards give you a snapshot of operational health.",
    icon: BarChart3,
    targetSelector: "[data-tour='nav-reports']",
    roles: ["admin"],
    position: "right",
  },
  // ── Customer steps ───────────────────────────────────────────────────────
  {
    id: "customer-dashboard",
    title: "Your Dashboard",
    description:
      "See a summary of your account — active devices, pending shipments, open support tickets, and recent activity. Everything about your project in one place.",
    icon: LayoutDashboard,
    targetSelector: "[data-tour='nav-dashboard']",
    roles: ["customer"],
    position: "right",
  },
  {
    id: "customer-devices",
    title: "My Devices",
    description:
      "View every device we are staging for you, along with its current status, serial number, and MAC address. You will see it update in real time as our team works through the staging process.",
    icon: Server,
    targetSelector: "[data-tour='nav-my-devices']",
    roles: ["customer"],
    position: "right",
  },
  {
    id: "customer-shipments",
    title: "My Shipments",
    description:
      "Track your outbound shipments. Once a shipment is dispatched you will see the carrier, tracking number, and a live status timeline here.",
    icon: Truck,
    targetSelector: "[data-tour='nav-my-shipments']",
    roles: ["customer"],
    position: "right",
  },
  {
    id: "customer-invoices",
    title: "My Invoices",
    description:
      "View and download your invoices. Pay outstanding invoices online via Stripe or mark them as paid after a bank transfer.",
    icon: FileText,
    targetSelector: "[data-tour='nav-my-invoices']",
    roles: ["customer"],
    position: "right",
  },
  {
    id: "customer-tickets",
    title: "Support Tickets",
    description:
      "Have a question or issue? Submit a support ticket and our team will respond directly in the thread. You will get a notification when we reply.",
    icon: Ticket,
    targetSelector: "[data-tour='nav-support-tickets']",
    roles: ["customer"],
    position: "right",
  },
  // ── Shared final step ────────────────────────────────────────────────────
  {
    id: "help",
    title: "Help & Documentation",
    description:
      "The Help page has a full guide to every feature in the portal. You can also replay this tour any time from there.",
    icon: HelpCircle,
    targetSelector: "[data-tour='nav-help']",
    roles: ["admin", "staff", "customer"],
    position: "right",
  },
];

// ─── Spotlight helpers ────────────────────────────────────────────────────────

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getElementRect(selector?: string): SpotlightRect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

// ─── Tooltip card ─────────────────────────────────────────────────────────────

interface TooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  spotlightRect: SpotlightRect | null;
}

function TourTooltip({ step, stepIndex, totalSteps, onNext, onPrev, onSkip, spotlightRect }: TooltipProps) {
  const Icon = step.icon;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  // Position the card relative to the spotlight
  let cardStyle: React.CSSProperties = {};
  const CARD_WIDTH = 340;
  const CARD_OFFSET = 16;

  if (step.position === "center" || !spotlightRect) {
    cardStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: CARD_WIDTH,
      zIndex: 10001,
    };
  } else if (step.position === "right") {
    cardStyle = {
      position: "fixed",
      top: Math.max(16, spotlightRect.top),
      left: spotlightRect.left + spotlightRect.width + CARD_OFFSET,
      width: CARD_WIDTH,
      zIndex: 10001,
    };
  } else if (step.position === "left") {
    cardStyle = {
      position: "fixed",
      top: Math.max(16, spotlightRect.top),
      left: spotlightRect.left - CARD_WIDTH - CARD_OFFSET,
      width: CARD_WIDTH,
      zIndex: 10001,
    };
  } else {
    cardStyle = {
      position: "fixed",
      top: spotlightRect.top + spotlightRect.height + CARD_OFFSET,
      left: spotlightRect.left,
      width: CARD_WIDTH,
      zIndex: 10001,
    };
  }

  return (
    <div
      style={cardStyle}
      className="bg-card border border-border rounded-xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm text-foreground leading-tight">{step.title}</h3>
        </div>
        <button
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
          aria-label="Close tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {stepIndex + 1} / {totalSteps}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === stepIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {!isFirst && (
            <Button size="sm" variant="ghost" onClick={onPrev} className="h-7 px-2 text-xs gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
          )}
          <Button size="sm" onClick={onNext} className="h-7 px-3 text-xs gap-1">
            {isLast ? "Finish" : "Next"}
            {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {isFirst && (
        <button
          onClick={onSkip}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip tour
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface OnboardingTourProps {
  /** Override to force the tour open (e.g. from Help page "Take the Tour" button) */
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function OnboardingTour({ forceOpen, onClose }: OnboardingTourProps) {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const markSeenMut = trpc.users.markTourSeen.useMutation();
  const utils = trpc.useUtils();

  // Determine role bucket
  const roleBucket: TourRole =
    (user as any)?.role === "admin"
      ? "admin"
      : (user as any)?.role === "staff"
      ? "staff"
      : "customer";

  // Filter steps for this role
  const steps = TOUR_STEPS.filter((s) => s.roles.includes(roleBucket));

  // Auto-open on first login
  useEffect(() => {
    if (!user) return;
    if (forceOpen) { setActive(true); setStepIndex(0); return; }
    if ((user as any).hasSeenTour === false) {
      // Small delay so the layout is fully rendered
      const t = setTimeout(() => { setActive(true); setStepIndex(0); }, 800);
      return () => clearTimeout(t);
    }
  }, [user, forceOpen]);

  // Update spotlight rect whenever step changes
  useEffect(() => {
    if (!active) return;
    const step = steps[stepIndex];
    const update = () => setSpotlightRect(getElementRect(step?.targetSelector));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [active, stepIndex, steps]);

  const closeTour = useCallback((markSeen = true) => {
    setActive(false);
    if (markSeen) {
      markSeenMut.mutate(undefined, {
        onSuccess: () => utils.auth.me.invalidate(),
      });
    }
    onClose?.();
  }, [markSeenMut, utils, onClose]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(i => i + 1);
    } else {
      closeTour(true);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex(i => i - 1);
  };

  if (!active || steps.length === 0) return null;

  const currentStep = steps[stepIndex];
  const hasSpotlight = !!currentStep.targetSelector && !!spotlightRect;

  return createPortal(
    <>
      {/* Backdrop with cutout */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 10000, pointerEvents: "none" }}
        aria-hidden="true"
      >
        {hasSpotlight && spotlightRect ? (
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotlightRect.left - 6}
                  y={spotlightRect.top - 6}
                  width={spotlightRect.width + 12}
                  height={spotlightRect.height + 12}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.65)"
              mask="url(#tour-mask)"
            />
            {/* Highlight ring */}
            <rect
              x={spotlightRect.left - 6}
              y={spotlightRect.top - 6}
              width={spotlightRect.width + 12}
              height={spotlightRect.height + 12}
              rx="8"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              opacity="0.8"
            />
          </svg>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)" }} />
        )}
      </div>

      {/* Click-through blocker (allows clicking the tooltip card) */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 10000 }}
        onClick={() => closeTour(false)}
      />

      {/* Tooltip card */}
      <TourTooltip
        step={currentStep}
        stepIndex={stepIndex}
        totalSteps={steps.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={() => closeTour(true)}
        spotlightRect={hasSpotlight ? spotlightRect : null}
      />
    </>,
    document.body
  );
}
