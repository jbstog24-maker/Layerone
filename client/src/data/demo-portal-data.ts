/**
 * Fictional sample data for the public /demo route.
 * Everything here is invented for illustration. No real customer names,
 * serial numbers, or addresses appear in this file.
 */

export interface PipelineStage {
  key: string;
  label: string;
  count: number;
}

export const demoProject = {
  clientName: "Metroplex Dental Group",
  projectName: "Q4 2026 workstation refresh",
  totalDevices: 240,
  startDate: "Sep 28, 2026",
};

export const pipelineStages: PipelineStage[] = [
  { key: "received", label: "Received", count: 240 },
  { key: "qa", label: "QA Passed", count: 208 },
  { key: "imaged", label: "Imaged", count: 186 },
  { key: "tagged", label: "Asset Tagged", count: 172 },
  { key: "kitted", label: "Kitted by Site", count: 140 },
  { key: "ready", label: "Ready to Ship", count: 96 },
  { key: "delivered", label: "Delivered", count: 48 },
];

export interface DemoSite {
  id: number;
  name: string;
  devices: number;
  kitted: number;
  delivered: number;
  status: string;
  deliveryDate: string;
}

export const demoSites: DemoSite[] = [
  { id: 1, name: "Plano - Park Blvd", devices: 20, kitted: 20, delivered: 20, status: "delivered", deliveryDate: "Oct 6, 2026" },
  { id: 2, name: "Frisco - Main St", devices: 20, kitted: 20, delivered: 20, status: "delivered", deliveryDate: "Oct 7, 2026" },
  { id: 3, name: "Dallas - Preston Rd", devices: 20, kitted: 20, delivered: 8, status: "shipped", deliveryDate: "Oct 9, 2026" },
  { id: 4, name: "Allen - Exchange Pkwy", devices: 20, kitted: 20, delivered: 0, status: "ready_to_ship", deliveryDate: "Oct 13, 2026" },
  { id: 5, name: "McKinney - Virginia Pkwy", devices: 20, kitted: 20, delivered: 0, status: "ready_to_ship", deliveryDate: "Oct 13, 2026" },
  { id: 6, name: "Richardson - Campbell Rd", devices: 20, kitted: 20, delivered: 0, status: "ready_to_ship", deliveryDate: "Oct 14, 2026" },
  { id: 7, name: "Irving - MacArthur Blvd", devices: 20, kitted: 16, delivered: 0, status: "packing", deliveryDate: "Oct 15, 2026" },
  { id: 8, name: "Arlington - Cooper St", devices: 20, kitted: 16, delivered: 0, status: "packing", deliveryDate: "Oct 15, 2026" },
  { id: 9, name: "Fort Worth - Hulen St", devices: 20, kitted: 8, delivered: 0, status: "in_staging", deliveryDate: "Oct 16, 2026" },
  { id: 10, name: "Grapevine - Main St", devices: 20, kitted: 0, delivered: 0, status: "in_staging", deliveryDate: "Oct 19, 2026" },
  { id: 11, name: "Lewisville - Vista Ridge", devices: 20, kitted: 0, delivered: 0, status: "in_staging", deliveryDate: "Oct 20, 2026" },
  { id: 12, name: "Denton - University Dr", devices: 20, kitted: 0, delivered: 0, status: "in_staging", deliveryDate: "Oct 21, 2026" },
];

export interface DemoDevice {
  id: number;
  type: string;
  serial: string;
  assetTag: string;
  site: string;
  status: string;
}

export const demoDevices: DemoDevice[] = [
  { id: 1, type: "Workstation", serial: "DEMO-SN-24001", assetTag: "L1-2026-24001", site: "Plano - Park Blvd", status: "delivered" },
  { id: 2, type: "Monitor 24in", serial: "DEMO-SN-24002", assetTag: "L1-2026-24002", site: "Plano - Park Blvd", status: "delivered" },
  { id: 3, type: "Network Switch", serial: "DEMO-SN-24003", assetTag: "L1-2026-24003", site: "Frisco - Main St", status: "delivered" },
  { id: 4, type: "Access Point", serial: "DEMO-SN-24004", assetTag: "L1-2026-24004", site: "Dallas - Preston Rd", status: "shipped" },
  { id: 5, type: "Workstation", serial: "DEMO-SN-24005", assetTag: "L1-2026-24005", site: "Allen - Exchange Pkwy", status: "ready_to_ship" },
  { id: 6, type: "Printer", serial: "DEMO-SN-24006", assetTag: "L1-2026-24006", site: "McKinney - Virginia Pkwy", status: "ready_to_ship" },
  { id: 7, type: "Workstation", serial: "DEMO-SN-24007", assetTag: "L1-2026-24007", site: "Richardson - Campbell Rd", status: "ready_to_ship" },
  { id: 8, type: "Monitor 24in", serial: "DEMO-SN-24008", assetTag: "L1-2026-24008", site: "Irving - MacArthur Blvd", status: "packing" },
  { id: 9, type: "Access Point", serial: "DEMO-SN-24009", assetTag: "L1-2026-24009", site: "Arlington - Cooper St", status: "packing" },
  { id: 10, type: "Network Switch", serial: "DEMO-SN-24010", assetTag: "L1-2026-24010", site: "Fort Worth - Hulen St", status: "in_staging" },
  { id: 11, type: "Workstation", serial: "DEMO-SN-24011", assetTag: "L1-2026-24011", site: "Grapevine - Main St", status: "in_staging" },
  { id: 12, type: "Monitor 24in", serial: "DEMO-SN-24012", assetTag: "L1-2026-24012", site: "Denton - University Dr", status: "received" },
];

export interface DemoTask {
  id: number;
  title: string;
  taskType: string;
  site: string;
  status: string;
  updatedAt: string;
  photoCount: number;
}

export const demoTasks: DemoTask[] = [
  { id: 1, title: "QA and power-on test: 48 workstations", taskType: "QA Verification", site: "Fort Worth - Hulen St", status: "completed", updatedAt: "Oct 10, 4:12 PM", photoCount: 4 },
  { id: 2, title: "Image 32 workstations with standard build", taskType: "Imaging", site: "Grapevine - Main St", status: "completed", updatedAt: "Oct 10, 2:40 PM", photoCount: 3 },
  { id: 3, title: "Asset tag and serial capture: switches and APs", taskType: "Labeling", site: "Lewisville - Vista Ridge", status: "in_progress", updatedAt: "Oct 11, 10:05 AM", photoCount: 5 },
  { id: 4, title: "Pack site kits: 20-device kits with labels", taskType: "Site Kit Prep", site: "Irving - MacArthur Blvd", status: "in_progress", updatedAt: "Oct 11, 9:18 AM", photoCount: 6 },
  { id: 5, title: "Stage network switches: VLAN config backup", taskType: "Switch Staging", site: "Denton - University Dr", status: "pending", updatedAt: "Oct 11, 8:00 AM", photoCount: 0 },
  { id: 6, title: "Firmware update: access points to approved build", taskType: "Firmware Update", site: "Lewisville - Vista Ridge", status: "pending", updatedAt: "Oct 10, 5:30 PM", photoCount: 0 },
];

export interface DemoDelivery {
  id: number;
  site: string;
  date: string;
  window: string;
  devices: number;
  status: string;
}

export const demoDeliveries: DemoDelivery[] = [
  { id: 1, site: "Allen - Exchange Pkwy", date: "Mon, Oct 13", window: "8:00 - 10:00 AM", devices: 20, status: "scheduled" },
  { id: 2, site: "McKinney - Virginia Pkwy", date: "Mon, Oct 13", window: "10:30 AM - 12:30 PM", devices: 20, status: "scheduled" },
  { id: 3, site: "Richardson - Campbell Rd", date: "Tue, Oct 14", window: "8:00 - 10:00 AM", devices: 20, status: "scheduled" },
  { id: 4, site: "Irving - MacArthur Blvd", date: "Wed, Oct 15", window: "8:00 - 10:00 AM", devices: 20, status: "packing" },
  { id: 5, site: "Arlington - Cooper St", date: "Wed, Oct 15", window: "10:30 AM - 12:30 PM", devices: 20, status: "packing" },
];

export interface DemoActivity {
  id: number;
  time: string;
  text: string;
}

export const demoActivity: DemoActivity[] = [
  { id: 1, time: "Oct 11, 10:05 AM", text: "Asset tagging started for Lewisville - Vista Ridge switches and access points" },
  { id: 2, time: "Oct 11, 9:18 AM", text: "Site kits packed for Irving - MacArthur Blvd, 16 of 20 devices kitted" },
  { id: 3, time: "Oct 10, 4:12 PM", text: "48 workstations passed QA for Fort Worth - Hulen St, 2 flagged for retest" },
  { id: 4, time: "Oct 10, 2:40 PM", text: "32 workstations imaged with standard build for Grapevine - Main St" },
  { id: 5, time: "Oct 9, 3:15 PM", text: "Dallas - Preston Rd kits shipped, 8 of 20 devices delivered so far" },
  { id: 6, time: "Oct 7, 11:20 AM", text: "Frisco - Main St delivery confirmed complete, all 20 devices received on site" },
  { id: 7, time: "Oct 6, 2:05 PM", text: "Plano - Park Blvd delivery confirmed complete, all 20 devices received on site" },
];
