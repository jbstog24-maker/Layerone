import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
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
import OnboardingTour from "./components/OnboardingTour";
import { PalletDetail } from "./pages/Pallets";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
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
      <Route path="/users" component={Users} />
      <Route path="/inquiries" component={Inquiries} />
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

      {/* Pallet Detail */}
      <Route path="/pallets/:id" component={PalletDetail} />

      {/* Package detail */}
      <Route path="/packages/:tier" component={PackageDetail} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <OnboardingTour />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
