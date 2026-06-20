import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "staff", "customer_admin", "customer_viewer"]).default("customer_viewer").notNull(),
  clientId: int("clientId"), // null for admin/staff
  businessName: varchar("businessName", { length: 200 }),
  phone: varchar("phone", { length: 30 }),
  location: varchar("location", { length: 300 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Packages / Tiers ─────────────────────────────────────────────────────────
export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  tier: mysqlEnum("tier", ["basic", "standard", "professional", "enterprise", "custom"]).notNull(),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull().default("0.00"),
  billingCycle: mysqlEnum("billingCycle", ["one_time", "monthly"]).default("monthly").notNull(),
  maxDevices: int("maxDevices").default(0),
  maxBoxes: int("maxBoxes").default(0),
  maxPallets: int("maxPallets").default(0),
  storageDays: int("storageDays").default(30),
  maxOutboundShipments: int("maxOutboundShipments").default(0),
  includedLaborHours: int("includedLaborHours").default(0),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 256 }).notNull(),
  contactName: varchar("contactName", { length: 128 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  billingEmail: varchar("billingEmail", { length: 320 }),
  packageId: int("packageId"),
  billingCycleStart: timestamp("billingCycleStart"),
  status: mysqlEnum("status", ["active", "inactive", "onboarding", "suspended"]).default("onboarding").notNull(),
  projectNotes: text("projectNotes"),
  address: text("address"),
  // Onboarding / contract
  contractSignedAt: timestamp("contractSignedAt"),
  goLiveDate: timestamp("goLiveDate"),
  onboardingNotes: text("onboardingNotes"),
  // Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "pending", "paid", "failed", "cancelled"]).default("unpaid").notNull(),
  // Warehouse space assignment
  warehouseUnitNumber: varchar("warehouseUnitNumber", { length: 64 }),
  warehouseAddress: text("warehouseAddress"),
  warehouseAccessCode: varchar("warehouseAccessCode", { length: 128 }),
  warehouseDimensions: varchar("warehouseDimensions", { length: 128 }),
  warehouseNotes: text("warehouseNotes"),
  warehouseAssignedAt: timestamp("warehouseAssignedAt"),
  assignedTechNames: text("assignedTechNames"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ─── Expected Deliveries ──────────────────────────────────────────────────────
export const expectedDeliveries = mysqlTable("expected_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  projectName: varchar("projectName", { length: 256 }),
  carrier: varchar("carrier", { length: 128 }),
  trackingNumber: varchar("trackingNumber", { length: 256 }),
  expectedDate: timestamp("expectedDate"),
  expectedBoxCount: int("expectedBoxCount").default(0),
  expectedPalletCount: int("expectedPalletCount").default(0),
  expectedContents: text("expectedContents"),
  siteName: varchar("siteName", { length: 256 }),
  specialInstructions: text("specialInstructions"),
  status: mysqlEnum("status", ["expected", "in_transit", "received", "partially_received", "damaged", "exception", "closed"]).default("expected").notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpectedDelivery = typeof expectedDeliveries.$inferSelect;
export type InsertExpectedDelivery = typeof expectedDeliveries.$inferInsert;

// ─── Receiving Logs ───────────────────────────────────────────────────────────
export const receivingLogs = mysqlTable("receiving_logs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  deliveryId: int("deliveryId"),
  projectName: varchar("projectName", { length: 256 }),
  carrier: varchar("carrier", { length: 128 }),
  trackingNumber: varchar("trackingNumber", { length: 256 }),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  receivedBy: int("receivedBy"),
  boxCount: int("boxCount").default(0),
  palletCount: int("palletCount").default(0),
  condition: mysqlEnum("condition", ["good", "damaged", "exception", "partial"]).default("good").notNull(),
  storageLocation: varchar("storageLocation", { length: 128 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "processed", "exception"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReceivingLog = typeof receivingLogs.$inferSelect;
export type InsertReceivingLog = typeof receivingLogs.$inferInsert;

// ─── Pallets ──────────────────────────────────────────────────────────────────
export const pallets = mysqlTable("pallets", {
  id: int("id").autoincrement().primaryKey(),
  palletCode: varchar("palletCode", { length: 64 }).notNull().unique(),
  clientId: int("clientId").notNull(),
  projectName: varchar("projectName", { length: 256 }),
  deliveryId: int("deliveryId"),
  receivingLogId: int("receivingLogId"),
  dateReceived: timestamp("dateReceived").defaultNow().notNull(),
  boxCount: int("boxCount").default(0),
  storageLocation: varchar("storageLocation", { length: 128 }),
  status: mysqlEnum("status", ["received", "in_storage", "staging", "ready_to_ship", "shipped", "exception"]).default("received").notNull(),
  dateRemoved: timestamp("dateRemoved"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pallet = typeof pallets.$inferSelect;
export type InsertPallet = typeof pallets.$inferInsert;

// ─── Boxes ────────────────────────────────────────────────────────────────────
export const boxes = mysqlTable("boxes", {
  id: int("id").autoincrement().primaryKey(),
  boxCode: varchar("boxCode", { length: 64 }).notNull().unique(),
  clientId: int("clientId").notNull(),
  projectName: varchar("projectName", { length: 256 }),
  palletId: int("palletId"),
  deliveryId: int("deliveryId"),
  receivingLogId: int("receivingLogId"),
  trackingNumber: varchar("trackingNumber", { length: 256 }),
  condition: mysqlEnum("condition", ["good", "damaged", "exception"]).default("good").notNull(),
  contents: text("contents"),
  storageLocation: varchar("storageLocation", { length: 128 }),
  status: mysqlEnum("status", ["received", "in_storage", "staging", "packed", "shipped", "exception"]).default("received").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Box = typeof boxes.$inferSelect;
export type InsertBox = typeof boxes.$inferInsert;

// ─── Devices ──────────────────────────────────────────────────────────────────
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  deviceCode: varchar("deviceCode", { length: 64 }).notNull().unique(),
  clientId: int("clientId").notNull(),
  projectName: varchar("projectName", { length: 256 }),
  siteName: varchar("siteName", { length: 256 }),
  deviceType: varchar("deviceType", { length: 128 }),
  brand: varchar("brand", { length: 128 }),
  model: varchar("model", { length: 128 }),
  serialNumber: varchar("serialNumber", { length: 256 }),
  macAddress: varchar("macAddress", { length: 64 }),
  assetTag: varchar("assetTag", { length: 128 }),
  boxId: int("boxId"),
  palletId: int("palletId"),
  deliveryId: int("deliveryId"),
  firmwareVersion: varchar("firmwareVersion", { length: 128 }),
  configStatus: mysqlEnum("configStatus", ["pending", "in_progress", "complete", "not_required"]).default("pending").notNull(),
  stagingStatus: mysqlEnum("stagingStatus", ["expected", "received", "inventory_captured", "waiting_instructions", "ready_for_staging", "in_staging", "staged", "labeled", "packed", "ready_to_ship", "shipped", "picked_up", "exception"]).default("expected").notNull(),
  storageLocation: varchar("storageLocation", { length: 128 }),
  notes: text("notes"),
  receivingLogId: int("receivingLogId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

// ─── Staging Tasks ────────────────────────────────────────────────────────────
export const stagingTasks = mysqlTable("staging_tasks", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  projectName: varchar("projectName", { length: 256 }),
  taskType: mysqlEnum("taskType", ["firmware_update", "labeling", "site_kit_prep", "switch_staging", "firewall_staging", "ap_prep", "camera_nvr_kit", "config_backup", "documentation", "other"]).default("other").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  instructions: text("instructions"),
  assignedTo: int("assignedTo"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "on_hold", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "rush"]).default("normal").notNull(),
  startDate: timestamp("startDate"),
  completionDate: timestamp("completionDate"),
  estimatedHours: decimal("estimatedHours", { precision: 6, scale: 2 }),
  actualHours: decimal("actualHours", { precision: 6, scale: 2 }),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StagingTask = typeof stagingTasks.$inferSelect;
export type InsertStagingTask = typeof stagingTasks.$inferInsert;

// ─── Staging Task Devices (junction) ─────────────────────────────────────────
export const stagingTaskDevices = mysqlTable("staging_task_devices", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  deviceId: int("deviceId").notNull(),
});

// ─── Outbound Shipments ───────────────────────────────────────────────────────
export const outboundShipments = mysqlTable("outbound_shipments", {
  id: int("id").autoincrement().primaryKey(),
  shipmentCode: varchar("shipmentCode", { length: 64 }).notNull().unique(),
  clientId: int("clientId").notNull(),
  projectName: varchar("projectName", { length: 256 }),
  destination: text("destination"),
  carrier: varchar("carrier", { length: 128 }),
  trackingNumber: varchar("trackingNumber", { length: 256 }),
  packedBy: int("packedBy"),
  datePacked: timestamp("datePacked"),
  dateShipped: timestamp("dateShipped"),
  dateDelivered: timestamp("dateDelivered"),
  status: mysqlEnum("status", ["requested", "packing", "ready_to_ship", "shipped", "delivered", "exception", "closed"]).default("requested").notNull(),
  notes: text("notes"),
  requestedBy: int("requestedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OutboundShipment = typeof outboundShipments.$inferSelect;
export type InsertOutboundShipment = typeof outboundShipments.$inferInsert;

// ─── Shipment Items (devices/boxes in a shipment) ─────────────────────────────
export const shipmentItems = mysqlTable("shipment_items", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull(),
  itemType: mysqlEnum("itemType", ["device", "box", "pallet"]).notNull(),
  itemId: int("itemId").notNull(),
});

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 64 }).notNull().unique(),
  clientId: int("clientId").notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0.00").notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "void"]).default("draft").notNull(),
  notes: text("notes"),
  dueDate: timestamp("dueDate"),
  paidAt: timestamp("paidAt"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─── Invoice Line Items ───────────────────────────────────────────────────────
export const invoiceLineItems = mysqlTable("invoice_line_items", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  description: varchar("description", { length: 512 }).notNull(),
  category: mysqlEnum("category", ["base_package", "extra_boxes", "extra_pallets", "extra_devices", "storage_overage", "labor_hours", "packing_shipping", "rush_fee", "special_handling", "shipping_materials", "other"]).default("other").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1.00").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

// ─── Photos ───────────────────────────────────────────────────────────────────
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["delivery", "receiving_log", "pallet", "box", "device", "staging_task", "shipment", "exception"]).notNull(),
  entityId: int("entityId").notNull(),
  clientId: int("clientId").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  fileName: varchar("fileName", { length: 256 }),
  mimeType: varchar("mimeType", { length: 64 }),
  caption: text("caption"),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

// ─── Activity Logs ────────────────────────────────────────────────────────────
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId"),
  userId: int("userId"),
  action: varchar("action", { length: 256 }).notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: int("entityId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// ─── Package Inquiries ────────────────────────────────────────────────────────
export const packageInquiries = mysqlTable("package_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  company: varchar("company", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  tier: mysqlEnum("tier", ["basic", "standard", "professional", "enterprise", "custom"]).notNull(),
  deviceVolume: varchar("deviceVolume", { length: 30 }),
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PackageInquiry = typeof packageInquiries.$inferSelect;
export type InsertPackageInquiry = typeof packageInquiries.$inferInsert;

// ─── Document Templates ───────────────────────────────────────────────────────
export const documentTemplates = mysqlTable("document_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  category: mysqlEnum("category", [
    "agreement",
    "onboarding",
    "sow",
    "nda",
    "authorization",
    "checklist",
    "other",
  ]).notNull().default("other"),
  description: text("description"),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull().default("application/pdf"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSizeBytes: bigint("fileSizeBytes", { mode: "number" }).default(0),
  version: varchar("version", { length: 32 }).default("1.0"),
  isActive: boolean("isActive").default(true).notNull(),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = typeof documentTemplates.$inferInsert;

// ─── Client Documents (sent/linked instances) ─────────────────────────────────
export const clientDocuments = mysqlTable("client_documents", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  templateId: int("templateId"), // null if custom upload (not from template)
  name: varchar("name", { length: 200 }).notNull(), // display name for this instance
  status: mysqlEnum("status", [
    "draft",
    "sent",
    "viewed",
    "signed",
    "approved",
    "rejected",
    "expired",
  ]).default("draft").notNull(),
  // Sent metadata
  sentAt: timestamp("sentAt"),
  sentByUserId: int("sentByUserId"),
  sentToEmail: varchar("sentToEmail", { length: 320 }),
  sentMessage: text("sentMessage"),
  // Signature/approval metadata
  signedAt: timestamp("signedAt"),
  signedByName: varchar("signedByName", { length: 200 }),
  signedByEmail: varchar("signedByEmail", { length: 320 }),
  approvedAt: timestamp("approvedAt"),
  approvedByUserId: int("approvedByUserId"),
  rejectedAt: timestamp("rejectedAt"),
  rejectionReason: text("rejectionReason"),
  expiresAt: timestamp("expiresAt"),
  // Signed file (uploaded by staff after signing)
  signedFileKey: varchar("signedFileKey", { length: 512 }),
  signedFileUrl: text("signedFileUrl"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientDocument = typeof clientDocuments.$inferSelect;
export type InsertClientDocument = typeof clientDocuments.$inferInsert;

// ─── Client Messages ──────────────────────────────────────────────────────────
export const clientMessages = mysqlTable("client_messages", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  // null senderId = sent by the client (customer); non-null = sent by staff/admin
  senderId: int("senderId"),
  senderRole: mysqlEnum("senderRole", ["admin", "staff", "customer_admin", "customer_viewer"]).notNull(),
  senderName: varchar("senderName", { length: 200 }).notNull(),
  body: text("body").notNull(),
  // When the other side read the message (null = unread)
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientMessage = typeof clientMessages.$inferSelect;
export type InsertClientMessage = typeof clientMessages.$inferInsert;
