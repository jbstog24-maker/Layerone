import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

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

      {/* Admin */}
      <Route path="/activity" component={ActivityLog} />
      <Route path="/users" component={Users} />

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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
