import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Activity,
  Archive,
  Box,
  Building2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Inbox,
  Kanban,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  User,
  PanelLeft,
  Pin,
  PinOff,
  Search,
  Server,
  Settings,
  Ship,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  Sparkles,
  Images,
  LifeBuoy,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import PendingApproval from "@/pages/PendingApproval";
import { Button } from "./ui/button";
import GlobalSearch from "./GlobalSearch";
import { PhonePinBanner } from "./VoiceAccount";

type NavItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  roles?: string[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
  roles?: string[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    ],
  },
  {
    label: "Operations",
    roles: ["admin", "staff"],
    items: [
      { icon: Building2, label: "Clients", path: "/clients", roles: ["admin", "staff"] },
      { icon: MapPin, label: "Locations", path: "/locations", roles: ["admin", "staff"] },
      { icon: Package, label: "Packages", path: "/packages", roles: ["admin"] },
      { icon: FileText, label: "Documents", path: "/documents", roles: ["admin", "staff"] },
      { icon: Inbox, label: "Inquiries", path: "/inquiries", roles: ["admin", "staff"] },
      { icon: ClipboardCheck, label: "Onboarding", path: "/onboarding", roles: ["admin", "staff"] },
      { icon: MessageSquare, label: "Messages", path: "/messages", roles: ["admin", "staff"] },
      { icon: LifeBuoy, label: "Support Tickets", path: "/admin/tickets", roles: ["admin", "staff"] },
      { icon: Users, label: "Users", path: "/users", roles: ["admin"] },
    ],
  },
  {
    label: "Inbound",
    items: [
      { icon: Truck, label: "Expected Deliveries", path: "/deliveries" },
      { icon: ClipboardList, label: "Receiving Logs", path: "/receiving", roles: ["admin", "staff"] },
    ],
  },
  {
    label: "Inventory",
    items: [
      { icon: Warehouse, label: "Pallets", path: "/pallets" },
      { icon: Box, label: "Boxes", path: "/boxes" },
      { icon: Server, label: "Devices", path: "/devices" },
    ],
  },
  {
    label: "Staging & Shipping",
    items: [
      { icon: Archive, label: "Staging Tasks", path: "/staging" },
      { icon: Ship, label: "Outbound Shipments", path: "/shipments" },
      { icon: Truck, label: "Delivery Requests", path: "/delivery-requests" },
    ],
  },
  {
    label: "My Portal",
    roles: ["customer_admin", "customer_viewer"],
    items: [
      { icon: MapPin, label: "My Devices", path: "/my-devices", roles: ["customer_admin", "customer_viewer"] },
      { icon: ClipboardList, label: "Staging Instructions", path: "/my-instructions", roles: ["customer_admin", "customer_viewer"] },
      { icon: FileText, label: "My Documents", path: "/my-documents", roles: ["customer_admin", "customer_viewer"] },
      { icon: ClipboardCheck, label: "My Onboarding", path: "/my-onboarding", roles: ["customer_admin", "customer_viewer"] },
      { icon: MessageSquare, label: "Messages", path: "/support-messages", roles: ["customer_admin", "customer_viewer"] },
      { icon: LifeBuoy, label: "Support Tickets", path: "/support", roles: ["customer_admin", "customer_viewer"] },
    ],
  },
  {
    label: "Sales",
    roles: ["admin", "staff"],
    items: [
      { icon: TrendingUp, label: "Leads", path: "/leads", roles: ["admin", "staff"] },
      { icon: Kanban, label: "Pipeline", path: "/pipeline", roles: ["admin", "staff"] },
      { icon: Search, label: "Lead Finder", path: "/lead-finder", roles: ["admin", "staff"] },
      { icon: Mail, label: "Drip Sequences", path: "/drip-sequences", roles: ["admin", "staff"] },
      { icon: Sparkles, label: "Content Studio", path: "/content-studio", roles: ["admin", "staff"] },
      { icon: Images, label: "Asset Gallery", path: "/content-gallery", roles: ["admin", "staff"] },
    ],
  },
  {
    label: "Billing",
    roles: ["admin", "customer_admin", "customer_viewer"],
    items: [
      { icon: FileText, label: "Invoices", path: "/invoices" },
    ],
  },
  {
    label: "Audit",
    items: [
      { icon: Activity, label: "Activity Log", path: "/activity" },
      { icon: BarChart3, label: "Reports", path: "/reports", roles: ["admin", "staff"] },
    ],
  },
  {
    label: "Help",
    items: [
      { icon: HelpCircle, label: "Help Center", path: "/help" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const SIDEBAR_PINNED_KEY = "sidebar-pinned";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 320;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    return localStorage.getItem(SIDEBAR_PINNED_KEY) !== "false";
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_PINNED_KEY, sidebarPinned.toString());
  }, [sidebarPinned]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-3">
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Warehouse className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-center">Layer One Staging Solutions Portal</h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Layer One managed staging operations platform. Sign in to access your portal.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90"
          >
            Sign in to continue
          </Button>
        </div>
      </div>
    );
  }

  // Customer approval gate: customer roles without a linked, approved client cannot access the portal.
  // The demo account bypasses this gate so prospects can preview the portal.
  const userRole = (user as any)?.role ?? "";
  const isCustomer = userRole === "customer_admin" || userRole === "customer_viewer";
  const hasClientId = Boolean((user as any)?.clientId);
  const isDemoAccount = (user as any)?.email === "demo@layeronestaging.com";
  if (isCustomer && !hasClientId && !isDemoAccount) {
    return <PendingApproval />;
  }

  return (
    <SidebarProvider
      defaultOpen={sidebarPinned}
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth} sidebarPinned={sidebarPinned} setSidebarPinned={setSidebarPinned}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  sidebarPinned,
  setSidebarPinned,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
  sidebarPinned: boolean;
  setSidebarPinned: (v: boolean) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const showLabels = !isCollapsed && !isMobile;
  const role = (user as any)?.role ?? "customer_viewer";
  const isAdminOrStaff = role === "admin" || role === "staff";

  // Unread message count for badge - only fire when user is confirmed logged in
  const { data: totalUnread = 0 } = trpc.messages.totalUnread.useQuery(
    undefined,
    { enabled: !!user && isAdminOrStaff, refetchInterval: 60_000 },
  );

  // Customer-facing unread count (staff replies not yet read)
  const { data: myUnread = 0 } = trpc.messages.myUnread.useQuery(
    undefined,
    { enabled: !!user && !isAdminOrStaff, refetchInterval: 60_000 },
  );

  // Open support ticket count for staff badge
  const { data: openTickets = 0 } = trpc.support.countOpen.useQuery(
    undefined,
    { enabled: !!user && isAdminOrStaff, refetchInterval: 60_000 },
  );

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    staff: "Staff",
    customer_admin: "Customer Admin",
    customer_viewer: "Viewer",
  };

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const canSee = (item: NavItem | NavGroup) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  };

  const activeLabel = NAV_GROUPS.flatMap(g => g.items).find(i => i.path === location)?.label ?? "StagingOps";

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar" disableTransition={isResizing} ref={sidebarRef}>
          <SidebarHeader className="h-14 border-b border-border/50">
            <div className="flex items-center gap-2.5 px-2">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors shrink-0"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground/60" />
              </button>
              <div
                className={`flex items-center gap-2 min-w-0 flex-1 overflow-hidden transition-[opacity,max-width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  isCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-full"
                }`}
              >
                  <img
                    src="/images/layerone-logo-on-dark.png"
                    alt="Layer One Staging Solutions"
                    className="h-7 w-auto object-contain shrink-0"
                  />
                  {/* Pin button - keeps sidebar expanded */}
                  <button
                    onClick={() => setSidebarPinned(!sidebarPinned)}
                    className="ml-auto h-6 w-6 flex items-center justify-center hover:bg-sidebar-accent rounded-md transition-colors shrink-0"
                    title={sidebarPinned ? "Unpin sidebar" : "Pin sidebar open"}
                  >
                    {sidebarPinned
                      ? <Pin className="h-3.5 w-3.5 text-primary" />
                      : <PinOff className="h-3.5 w-3.5 text-sidebar-foreground/40" />}
                  </button>
                </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            {/* Global search - visible only when sidebar is expanded */}
            <div className={`px-3 pb-1 overflow-hidden transition-[opacity,max-height] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              isCollapsed ? "opacity-0 max-h-0 pointer-events-none" : "opacity-100 max-h-20"
            }`}>
              <GlobalSearch />
            </div>
            {NAV_GROUPS.filter(canSee).map((group, groupIndex, filteredGroups) => {
              const visibleItems = group.items.filter(canSee);
              if (visibleItems.length === 0) return null;
              // Find if any previous group had visible items (to know whether to show a separator)
              const hasPrev = filteredGroups.slice(0, groupIndex).some(g => g.items.filter(canSee).length > 0);
              return (
                <div key={group.label}>
                  {isMobile && hasPrev && (
                    <SidebarSeparator className="mx-3 my-1" />
                  )}
                  <SidebarGroup className="py-1">
                  {showLabels && (
                    <SidebarGroupLabel className="text-xs text-sidebar-foreground/40 uppercase tracking-widest px-3 py-1.5 truncate overflow-hidden">
                      {group.label}
                    </SidebarGroupLabel>
                  )}
                  <SidebarMenu className="px-2">
                    {visibleItems.map((item) => {
                      const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                      // data-tour attribute maps to OnboardingTour step selectors
                      const tourAttr = {
                        "/dashboard": "nav-dashboard",
                        "/clients": "nav-clients",
                        "/devices": "nav-devices",
                        "/staging": "nav-staging",
                        "/shipments": "nav-shipments",
                        "/leads": "nav-leads",
                        "/admin/tickets": "nav-admin-tickets",
                        "/support": "nav-support-tickets",
                        "/invoices": "nav-invoices",
                        "/users": "nav-users",
                        "/reports": "nav-reports",
                        "/my-devices": "nav-my-devices",
                        "/help": "nav-help",
                      }[item.path];
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => { setLocation(item.path); if (isMobile) setOpenMobile(false); }}
                            tooltip={item.label}
                            className={`h-9 transition-all text-sm ${isActive ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
                            {...(tourAttr ? { "data-tour": tourAttr } : {})}
                          >
                            <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                            <span className="truncate overflow-hidden min-w-0 flex-1">{item.label}</span>
                            {/* Admin/staff: total unread from customers */}
                            {item.path === "/messages" && isAdminOrStaff && totalUnread > 0 && !isCollapsed && (
                              <span className="shrink-0 ml-auto min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold px-1">
                                {totalUnread > 99 ? "99+" : totalUnread}
                              </span>
                            )}
                            {/* Customer: unread staff replies */}
                            {item.path === "/support-messages" && !isAdminOrStaff && myUnread > 0 && !isCollapsed && (
                              <span className="shrink-0 ml-auto min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold px-1">
                                {myUnread > 99 ? "99+" : myUnread}
                              </span>
                            )}
                            {/* Staff: open support ticket count */}
                            {item.path === "/admin/tickets" && isAdminOrStaff && openTickets > 0 && !isCollapsed && (
                              <span className="shrink-0 ml-auto min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold px-1">
                                {openTickets > 99 ? "99+" : openTickets}
                              </span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                  </SidebarGroup>
                </div>
              );
            })}
          </SidebarContent>

          <SidebarFooter className="p-2 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-8 w-8 border border-border/50 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-sidebar-foreground">{user?.name ?? "User"}</p>
                      <p className="text-xs text-sidebar-foreground/50 truncate">{roleLabel[role] ?? role}</p>
                    </div>
                  )}
                  {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/40 shrink-0" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocation("/account")}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  My Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    window.location.href = "/";
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b border-border/50 h-14 items-center justify-between bg-background/95 px-3 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <span className="font-semibold text-sm">{activeLabel}</span>
            </div>
            <button
              onClick={() => setLocation("/help")}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
              title="Help Center"
              aria-label="Open Help Center"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">
          {!isAdminOrStaff && <PhonePinBanner />}
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
