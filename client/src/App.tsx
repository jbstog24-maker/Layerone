import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import VerifyCall from "./pages/VerifyCall";
import CancelCall from "./pages/CancelCall";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import About from "./pages/About";
import Team from "./pages/Team";
import Terms from "./pages/Terms";
import { ClientsList, ClientDetail } from "./pages/Clients";
import Packages from "./pages/Packages";
import { DeliveriesList, DeliveryDetail } from "./pages/Deliveries";
import { ReceivingList, ReceivingDetail } from "./pages/Receiving";
import Pallets from "./pages/Pallets";
import Boxes from "./pages/Boxes";
import { DevicesList, DeviceDetail } from "./pages/Devices";
import { StagingList, StagingDetail } from "./pages/Staging";
import { ShipmentsList, ShipmentDetail } from "./pages/Shipments";
import { InvoicesList, InvoiceDetail } from "./pages/Invoices";
import ActivityLog from "./pages/ActivityLog";
import Users from "./pages/Users";
import PackageDetail from "./pages/PackageDetail";
import Documents from "./pages/Documents";
import Inquiries from "./pages/Inquiries";
import Messages from "./pages/Messages";
import SupportMessages from "./pages/SupportMessages";
import MyDevices from "./pages/MyDevices";
import Leads from "./pages/Leads";
import LeadPipeline from "./pages/LeadPipeline";
import LeadDetail from "./pages/LeadDetail";
import LeadFinder from "./pages/LeadFinder";
import DripSequences from "./pages/DripSequences";
import ContentStudio from "./pages/ContentStudio";
import ContentGallery from "./pages/ContentGallery";
import SupportTickets from "./pages/SupportTickets";
import AdminTickets from "./pages/AdminTickets";
import AdminReports from "./pages/AdminReports";
import HelpCenter from "./pages/HelpCenter";
import MyInstructions from "./pages/MyInstructions";
import OnboardingTour from "./components/OnboardingTour";
import { PalletDetail } from "./pages/Pallets";
import GetStarted from "./pages/GetStarted";
import ServicePage from "./pages/services/ServicePage";
import ServiceIndex from "./pages/services/ServiceIndex";
import FaqPage from "./pages/FaqPage";
import WarehousingPage from "./pages/WarehousingPage";
import PackagesPage from "./pages/PackagesPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SetPassword from "./pages/SetPassword";
import SignMsa from "./pages/SignMsa";
import PayDemo from "./pages/PayDemo";
import Onboarding from "./pages/Onboarding";
import MyAccount from "./pages/MyAccount";
import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

/**
 * Route guard: only users with one of the given roles may view the wrapped
 * page. Anyone else is sent back to their dashboard. (The API already
 * enforces this; this keeps people from landing on pages they can't use -
 * e.g. non-admins must never reach the user account list.)
 */
function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user && !roles.includes(user.role)) {
      setLocation("/dashboard");
    }
  }, [loading, user, roles, setLocation]);

  if (loading) return null;
  if (!user || !roles.includes(user.role)) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/verify-call" component={VerifyCall} />
      <Route path="/cancel-call" component={CancelCall} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/about" component={About} />
      <Route path="/team" component={Team} />
      <Route path="/get-started" component={GetStarted} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/set-password" component={SetPassword} />
      <Route path="/sign/:token" component={SignMsa} />
      <Route path="/pay/demo" component={PayDemo} />
      <Route path="/dashboard" component={Home} />

      {/* Clients */}
      <Route path="/clients" component={ClientsList} />
      <Route path="/clients/:id" component={ClientDetail} />

      {/* Packages */}
      <Route path="/packages" component={Packages} />

      {/* Deliveries */}
      <Route path="/deliveries" component={DeliveriesList} />
      <Route path="/deliveries/:id" component={DeliveryDetail} />

      {/* Receiving */}
      <Route path="/receiving" component={ReceivingList} />
      <Route path="/receiving/:id" component={ReceivingDetail} />

      {/* Inventory */}
      <Route path="/pallets" component={Pallets} />
      <Route path="/boxes" component={Boxes} />
      <Route path="/devices" component={DevicesList} />
      <Route path="/devices/:id" component={DeviceDetail} />

      {/* Staging */}
      <Route path="/staging" component={StagingList} />
      <Route path="/staging/:id" component={StagingDetail} />

      {/* Shipments */}
      <Route path="/shipments" component={ShipmentsList} />
      <Route path="/shipments/:id" component={ShipmentDetail} />

      {/* Billing */}
      <Route path="/invoices" component={InvoicesList} />
      <Route path="/invoices/:id" component={InvoiceDetail} />

      {/* Documents */}
      <Route path="/documents" component={Documents} />

      {/* Admin */}
      <Route path="/activity" component={ActivityLog} />
      <Route path="/account" component={MyAccount} />
      <Route path="/users">
        {() => (
          <RequireRole roles={["admin"]}>
            <Users />
          </RequireRole>
        )}
      </Route>
      <Route path="/inquiries" component={Inquiries} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/messages" component={Messages} />
      <Route path="/support-messages" component={SupportMessages} />
      <Route path="/my-devices" component={MyDevices} />

      {/* Sales / Leads */}
      <Route path="/leads" component={Leads} />
      <Route path="/leads/:id" component={LeadDetail} />
      <Route path="/pipeline" component={LeadPipeline} />
      <Route path="/lead-finder" component={LeadFinder} />
      <Route path="/drip-sequences" component={DripSequences} />

      {/* Content Studio */}
      <Route path="/content-studio" component={ContentStudio} />
      <Route path="/content-gallery" component={ContentGallery} />

      {/* Support */}
      <Route path="/support" component={SupportTickets} />
      <Route path="/admin/tickets" component={AdminTickets} />

      {/* Reports */}
      <Route path="/reports" component={AdminReports} />

      {/* Help Center */}
      <Route path="/help" component={HelpCenter} />

      {/* My Instructions (customer portal) */}
      <Route path="/my-instructions" component={MyInstructions} />

      {/* Pallet Detail */}
      <Route path="/pallets/:id" component={PalletDetail} />

      {/* Package detail */}
      <Route path="/packages/:tier" component={PackageDetail} />

      {/* SEO service pages */}
      <Route path="/services" component={ServiceIndex} />
      <Route path="/services/:slug" component={ServicePage} />

      {/* Standalone content pages */}
      <Route path="/faq" component={FaqPage} />
      <Route path="/warehousing" component={WarehousingPage} />
      <Route path="/pricing" component={PackagesPage} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

import RequestQuoteFab from "@/components/RequestQuoteFab";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <OnboardingTour />
          <Router />
          <RequestQuoteFab />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
