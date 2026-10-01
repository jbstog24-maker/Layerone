import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  mediumtext,
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
  passwordHash: varchar("passwordHash", { length: 255 }), // null for legacy OAuth users
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", [
    "admin",
    "staff",
    "customer_admin",
    "customer_viewer",
  ])
    .default("customer_viewer")
    .notNull(),
  clientId: int("clientId"), // null for admin/staff
  businessName: varchar("businessName", { length: 200 }),
  phone: varchar("phone", { length: 30 }),
  location: varchar("location", { length: 300 }),
  jobTitle: varchar("jobTitle", { length: 128 }),
  department: varchar("department", { length: 128 }),
  isActive: boolean("isActive").default(true).notNull(),
  hasSeenTour: boolean("hasSeenTour").default(false).notNull(),
  // Single-use token for invite / password-reset flows (set-password link)
  inviteToken: varchar("inviteToken", { length: 128 }),
  inviteTokenExpiresAt: timestamp("inviteTokenExpiresAt"),
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
  tier: mysqlEnum("tier", [
    "basic",
    "standard",
    "professional",
    "enterprise",
    "custom",
  ]).notNull(),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  billingCycle: mysqlEnum("billingCycle", ["one_time", "monthly"])
    .default("monthly")
    .notNull(),
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
  accountNumber: varchar("accountNumber", { length: 32 }), // e.g. Layer One-00042, auto-generated on create
  companyName: varchar("companyName", { length: 256 }).notNull(),
  contactName: varchar("contactName", { length: 128 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  billingEmail: varchar("billingEmail", { length: 320 }),
  packageId: int("packageId"),
  billingCycleStart: timestamp("billingCycleStart"),
  status: mysqlEnum("status", ["active", "inactive", "onboarding", "suspended"])
    .default("onboarding")
    .notNull(),
  projectNotes: text("projectNotes"),
  address: text("address"),
  // Onboarding / contract
  contractSignedAt: timestamp("contractSignedAt"),
  goLiveDate: timestamp("goLiveDate"),
  onboardingNotes: text("onboardingNotes"),
  // Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  paymentStatus: mysqlEnum("paymentStatus", [
    "unpaid",
    "pending",
    "paid",
    "failed",
    "cancelled",
  ])
    .default("unpaid")
    .notNull(),
  // Warehouse space assignment
  warehouseUnitNumber: varchar("warehouseUnitNumber", { length: 64 }),
  warehouseAddress: text("warehouseAddress"),
  warehouseAccessCode: varchar("warehouseAccessCode", { length: 128 }),
  warehouseDimensions: varchar("warehouseDimensions", { length: 128 }),
  warehouseNotes: text("warehouseNotes"),
  warehouseAssignedAt: timestamp("warehouseAssignedAt"),
  assignedTechNames: text("assignedTechNames"),
  archivedAt: timestamp("archivedAt"),
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
  status: mysqlEnum("status", [
    "expected",
    "in_transit",
    "received",
    "partially_received",
    "damaged",
    "exception",
    "closed",
  ])
    .default("expected")
    .notNull(),
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
  condition: mysqlEnum("condition", ["good", "damaged", "exception", "partial"])
    .default("good")
    .notNull(),
  storageLocation: varchar("storageLocation", { length: 128 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "processed", "exception"])
    .default("pending")
    .notNull(),
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
  status: mysqlEnum("status", [
    "received",
    "in_storage",
    "staging",
    "ready_to_ship",
    "shipped",
    "exception",
  ])
    .default("received")
    .notNull(),
  dateRemoved: timestamp("dateRemoved"),
  notes: text("notes"),
  // Forwarding / outbound destination
  forwardingAddress: text("forwardingAddress"),
  forwardingContact: varchar("forwardingContact", { length: 256 }),
  forwardingNotes: text("forwardingNotes"),
  forwardingStatus: mysqlEnum("forwardingStatus", [
    "pending",
    "in_transit",
    "delivered",
  ]).default("pending"),
  forwardingUpdatedAt: timestamp("forwardingUpdatedAt"),
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
  condition: mysqlEnum("condition", ["good", "damaged", "exception"])
    .default("good")
    .notNull(),
  contents: text("contents"),
  storageLocation: varchar("storageLocation", { length: 128 }),
  status: mysqlEnum("status", [
    "received",
    "in_storage",
    "staging",
    "packed",
    "shipped",
    "exception",
  ])
    .default("received")
    .notNull(),
  notes: text("notes"),
  // Forwarding / outbound destination
  forwardingAddress: text("forwardingAddress"),
  forwardingContact: varchar("forwardingContact", { length: 256 }),
  forwardingNotes: text("forwardingNotes"),
  forwardingStatus: mysqlEnum("forwardingStatus", [
    "pending",
    "in_transit",
    "delivered",
  ]).default("pending"),
  forwardingUpdatedAt: timestamp("forwardingUpdatedAt"),
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
  configStatus: mysqlEnum("configStatus", [
    "pending",
    "in_progress",
    "complete",
    "not_required",
  ])
    .default("pending")
    .notNull(),
  stagingStatus: mysqlEnum("stagingStatus", [
    "expected",
    "received",
    "inventory_captured",
    "waiting_instructions",
    "ready_for_staging",
    "in_staging",
    "staged",
    "labeled",
    "packed",
    "ready_to_ship",
    "shipped",
    "picked_up",
    "exception",
  ])
    .default("expected")
    .notNull(),
  storageLocation: varchar("storageLocation", { length: 128 }),
  notes: text("notes"),
  receivingLogId: int("receivingLogId"),
  // Forwarding / outbound destination
  forwardingAddress: text("forwardingAddress"),
  forwardingContact: varchar("forwardingContact", { length: 256 }),
  forwardingNotes: text("forwardingNotes"),
  forwardingStatus: mysqlEnum("forwardingStatus", [
    "pending",
    "in_transit",
    "delivered",
  ]).default("pending"),
  forwardingUpdatedAt: timestamp("forwardingUpdatedAt"),
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
  taskType: mysqlEnum("taskType", [
    "firmware_update",
    "labeling",
    "site_kit_prep",
    "switch_staging",
    "firewall_staging",
    "ap_prep",
    "camera_nvr_kit",
    "config_backup",
    "documentation",
    "other",
  ])
    .default("other")
    .notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  instructions: text("instructions"),
  assignedTo: int("assignedTo"),
  status: mysqlEnum("status", [
    "pending",
    "in_progress",
    "completed",
    "on_hold",
    "cancelled",
  ])
    .default("pending")
    .notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "rush"])
    .default("normal")
    .notNull(),
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
  status: mysqlEnum("status", [
    "requested",
    "packing",
    "ready_to_ship",
    "shipped",
    "delivered",
    "exception",
    "closed",
  ])
    .default("requested")
    .notNull(),
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
  subtotal: decimal("subtotal", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "void"])
    .default("draft")
    .notNull(),
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
  category: mysqlEnum("category", [
    "base_package",
    "extra_boxes",
    "extra_pallets",
    "extra_devices",
    "storage_overage",
    "labor_hours",
    "packing_shipping",
    "rush_fee",
    "special_handling",
    "shipping_materials",
    "other",
  ])
    .default("other")
    .notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 })
    .default("1.00")
    .notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

// ─── Photos ───────────────────────────────────────────────────────────────────
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", [
    "delivery",
    "receiving_log",
    "pallet",
    "box",
    "device",
    "staging_task",
    "shipment",
    "exception",
  ]).notNull(),
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
  tier: mysqlEnum("tier", [
    "basic",
    "standard",
    "professional",
    "enterprise",
    "custom",
  ]).notNull(),
  deviceVolume: varchar("deviceVolume", { length: 30 }),
  // Detailed requirements captured from Get Started form
  deviceCount: int("deviceCount"),
  palletCount: int("palletCount"),
  boxCount: int("boxCount"),
  storageDays: int("storageDays"),
  addons: text("addons"), // JSON array of selected add-on keys
  message: text("message"),
  // Rollout scoping fields (project-quote path)
  locationCount: int("locationCount"),
  equipmentTypes: text("equipmentTypes"), // JSON array of equipment-type keys
  startDate: varchar("startDate", { length: 20 }),
  rolloutDuration: varchar("rolloutDuration", { length: 40 }),
  // Quote path: "project" (rollout scoping) or "pallet" (per-pallet pricing)
  quoteType: varchar("quoteType", { length: 20 }),
  status: mysqlEnum("status", [
    "new",
    "needs_review",
    "contacted",
    "proposal_sent",
    "quote_sent",
    "msa_signed",
    "paid",
    "onboarding",
    "won",
    "lost",
    "closed",
  ])
    .default("new")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // Soft-delete: set when an admin moves the inquiry to trash. Rows are never
  // hard-deleted by the app except via explicit "permanent delete" from trash.
  deletedAt: timestamp("deletedAt"),
});

export type PackageInquiry = typeof packageInquiries.$inferSelect;
export type InsertPackageInquiry = typeof packageInquiries.$inferInsert;

// ─── Quotes ───────────────────────────────────────────────────────────────────
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  inquiryId: int("inquiryId").notNull(),
  lineItems: text("lineItems").notNull(), // JSON: [{label, qty, unitPrice, total}]
  subtotal: decimal("subtotal", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  notes: text("notes"),
  stripePaymentLinkId: varchar("stripePaymentLinkId", { length: 255 }),
  stripePaymentLinkUrl: text("stripePaymentLinkUrl"),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  status: mysqlEnum("status", ["draft", "sent", "paid", "cancelled"])
    .default("draft")
    .notNull(),
  // Autonomous quoting pipeline
  msaStatus: mysqlEnum("msaStatus", ["pending", "signed", "waived"])
    .default("pending")
    .notNull(),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }),
  msaDocumentId: int("msaDocumentId"),
  sentAt: timestamp("sentAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

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
  ])
    .notNull()
    .default("other"),
  description: text("description"),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  mimeType: varchar("mimeType", { length: 128 })
    .notNull()
    .default("application/pdf"),
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
  ])
    .default("draft")
    .notNull(),
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
  senderRole: mysqlEnum("senderRole", [
    "admin",
    "staff",
    "customer_admin",
    "customer_viewer",
  ]).notNull(),
  senderName: varchar("senderName", { length: 200 }).notNull(),
  body: text("body").notNull(),
  // When the other side read the message (null = unread)
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientMessage = typeof clientMessages.$inferSelect;
export type InsertClientMessage = typeof clientMessages.$inferInsert;

// ─── Shipment Documents ───────────────────────────────────────────────────────
export const shipmentDocuments = mysqlTable("shipment_documents", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull(),
  clientId: int("clientId").notNull(),
  uploadedById: int("uploadedById").notNull(), // user.id who uploaded
  uploadedByName: varchar("uploadedByName", { length: 200 }),
  filename: varchar("filename", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  fileSize: int("fileSize"), // bytes
  fileKey: varchar("fileKey", { length: 1024 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 2048 }).notNull(),
  label: varchar("label", { length: 256 }), // optional user-provided label
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ShipmentDocument = typeof shipmentDocuments.$inferSelect;
export type InsertShipmentDocument = typeof shipmentDocuments.$inferInsert;

// ─── Staging Notifications (Ready to Ship) ───────────────────────────────────
export const stagingNotifications = mysqlTable("staging_notifications", {
  id: int("id").autoincrement().primaryKey(),
  // itemType + itemId replace the old deviceId-only approach
  itemType: varchar("itemType", { length: 16 }).notNull().default("device"), // 'device' | 'box' | 'pallet'
  itemId: int("itemId").notNull(),
  deviceId: int("deviceId").notNull(), // kept for backwards compat (same as itemId when itemType='device')
  clientId: int("clientId").notNull(),
  notifiedByUserId: int("notifiedByUserId").notNull(),
  notifiedByName: varchar("notifiedByName", { length: 200 }).notNull(),
  deviceCode: varchar("deviceCode", { length: 128 }).notNull(), // item code (boxCode / palletCode for non-device)
  message: text("message"),
  emailSent: boolean("emailSent").default(false).notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  acknowledgedByUserId: int("acknowledgedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StagingNotification = typeof stagingNotifications.$inferSelect;
export type InsertStagingNotification =
  typeof stagingNotifications.$inferInsert;

// ─── Leads ────────────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").primaryKey().autoincrement(),
  companyName: varchar("companyName", { length: 256 }).notNull(),
  contactName: varchar("contactName", { length: 256 }),
  contactTitle: varchar("contactTitle", { length: 256 }),
  email: varchar("email", { length: 256 }),
  phone: varchar("phone", { length: 64 }),
  website: varchar("website", { length: 512 }),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 64 }),
  industry: varchar("industry", { length: 128 }),
  employeeCount: varchar("employeeCount", { length: 64 }),
  annualRevenue: varchar("annualRevenue", { length: 64 }),
  source: mysqlEnum("source", [
    "manual",
    "inquiry_form",
    "google_maps",
    "referral",
    "linkedin",
    "other",
  ])
    .default("manual")
    .notNull(),
  status: mysqlEnum("status", [
    "new",
    "contacted",
    "qualified",
    "proposal_sent",
    "negotiating",
    "won",
    "lost",
    "on_hold",
    "unqualified",
    "follow_up",
    "demo_scheduled",
  ])
    .default("new")
    .notNull(),
  temperature: mysqlEnum("temperature", ["cold", "warm", "hot"])
    .default("cold")
    .notNull(),
  score: int("score").default(0),
  notes: text("notes"),
  placeId: varchar("placeId", { length: 512 }),
  assignedToUserId: int("assignedToUserId"),
  convertedToClientId: int("convertedToClientId"),
  lastContactedAt: timestamp("lastContactedAt"),
  nextFollowUpAt: timestamp("nextFollowUpAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export const leadCampaignMessages = mysqlTable("lead_campaign_messages", {
  id: int("id").primaryKey().autoincrement(),
  leadId: int("leadId").notNull(),
  type: mysqlEnum("type", [
    "cold_email",
    "follow_up_email",
    "linkedin_message",
    "call_script",
    "sms",
  ]).notNull(),
  subject: varchar("subject", { length: 512 }),
  body: text("body").notNull(),
  generatedByAi: boolean("generatedByAi").default(true).notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LeadCampaignMessage = typeof leadCampaignMessages.$inferSelect;
export type InsertLeadCampaignMessage =
  typeof leadCampaignMessages.$inferInsert;

export const leadQuotes = mysqlTable("lead_quotes", {
  id: int("id").primaryKey().autoincrement(),
  leadId: int("leadId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  tier: varchar("tier", { length: 64 }),
  deviceCount: int("deviceCount"),
  monthlyRate: varchar("monthlyRate", { length: 64 }),
  setupFee: varchar("setupFee", { length: 64 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected"])
    .default("draft")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LeadQuote = typeof leadQuotes.$inferSelect;
export type InsertLeadQuote = typeof leadQuotes.$inferInsert;

// ─── Drip Sequences ───────────────────────────────────────────────────────────
export const dripSequences = mysqlTable("drip_sequences", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DripSequence = typeof dripSequences.$inferSelect;
export type InsertDripSequence = typeof dripSequences.$inferInsert;

export const dripSequenceSteps = mysqlTable("drip_sequence_steps", {
  id: int("id").primaryKey().autoincrement(),
  sequenceId: int("sequenceId").notNull(),
  stepNumber: int("stepNumber").notNull(),
  delayDays: int("delayDays").default(0).notNull(),
  subject: varchar("subject", { length: 512 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DripSequenceStep = typeof dripSequenceSteps.$inferSelect;
export type InsertDripSequenceStep = typeof dripSequenceSteps.$inferInsert;

export const dripEnrollments = mysqlTable("drip_enrollments", {
  id: int("id").primaryKey().autoincrement(),
  sequenceId: int("sequenceId").notNull(),
  leadId: int("leadId").notNull(),
  currentStep: int("currentStep").default(0).notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed", "unsubscribed"])
    .default("active")
    .notNull(),
  nextSendAt: timestamp("nextSendAt"),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  enrolledByUserId: int("enrolledByUserId"),
});
export type DripEnrollment = typeof dripEnrollments.$inferSelect;
export type InsertDripEnrollment = typeof dripEnrollments.$inferInsert;

// ─── Marketing Assets (Content Studio) ───────────────────────────────────────
export const marketingAssets = mysqlTable("marketing_assets", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 256 }).notNull(),
  assetType: mysqlEnum("assetType", ["image", "video"]).notNull(),
  prompt: text("prompt").notNull(),
  style: varchar("style", { length: 128 }),
  format: varchar("format", { length: 64 }),
  fileKey: varchar("fileKey", { length: 512 }),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  thumbnailUrl: varchar("thumbnailUrl", { length: 1024 }),
  status: mysqlEnum("status", ["generating", "ready", "failed"])
    .default("generating")
    .notNull(),
  errorMessage: text("errorMessage"),
  createdByUserId: int("createdByUserId"),
  createdByName: varchar("createdByName", { length: 256 }),
  tags: varchar("tags", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketingAsset = typeof marketingAssets.$inferSelect;
export type InsertMarketingAsset = typeof marketingAssets.$inferInsert;

// ─── Support Tickets ──────────────────────────────────────────────────────────
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").primaryKey().autoincrement(),
  clientId: int("clientId").notNull(),
  submittedByUserId: int("submittedByUserId"),
  submittedByName: varchar("submittedByName", { length: 256 }),
  subject: varchar("subject", { length: 512 }).notNull(),
  category: mysqlEnum("category", [
    "billing",
    "shipping",
    "staging",
    "account",
    "technical",
    "general",
  ])
    .default("general")
    .notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"])
    .default("normal")
    .notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", [
    "open",
    "in_progress",
    "waiting_on_client",
    "resolved",
    "closed",
  ])
    .default("open")
    .notNull(),
  assignedToUserId: int("assignedToUserId"),
  resolvedAt: timestamp("resolvedAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

export const supportTicketReplies = mysqlTable("support_ticket_replies", {
  id: int("id").primaryKey().autoincrement(),
  ticketId: int("ticketId").notNull(),
  senderId: int("senderId"),
  senderName: varchar("senderName", { length: 256 }),
  senderRole: mysqlEnum("senderRole", [
    "admin",
    "staff",
    "customer_admin",
    "customer_viewer",
  ]).notNull(),
  body: text("body").notNull(),
  isInternal: boolean("isInternal").default(false).notNull(), // staff-only notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SupportTicketReply = typeof supportTicketReplies.$inferSelect;
export type InsertSupportTicketReply = typeof supportTicketReplies.$inferInsert;

// ─── Client Internal Notes (staff/admin only) ─────────────────────────────────
export const clientNotes = mysqlTable("client_notes", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  authorId: int("authorId").notNull(),
  authorName: varchar("authorName", { length: 256 }),
  body: text("body").notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = typeof clientNotes.$inferInsert;

// ─── Client Instructions (customer-authored staging/provisioning instructions) ─
export const clientInstructions = mysqlTable("client_instructions", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().unique(), // one record per client
  textBody: text("textBody"), // rich-text HTML from the editor
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedByUserId: int("updatedByUserId"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  acknowledgedByUserId: int("acknowledgedByUserId"),
});
export type ClientInstructions = typeof clientInstructions.$inferSelect;
export type InsertClientInstructions = typeof clientInstructions.$inferInsert;

export const clientInstructionFiles = mysqlTable("client_instruction_files", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 1024 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 2048 }).notNull(),
  mimeType: varchar("mimeType", { length: 256 }),
  uploadedById: int("uploadedById"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});
export type ClientInstructionFile = typeof clientInstructionFiles.$inferSelect;
export type InsertClientInstructionFile =
  typeof clientInstructionFiles.$inferInsert;

// ─── MSA Documents (signing links for the autonomous quoting pipeline) ───────
export const msaDocuments = mysqlTable("msa_documents", {
  id: int("id").autoincrement().primaryKey(),
  inquiryId: int("inquiryId").notNull(),
  quoteId: int("quoteId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  tokenExpiresAt: timestamp("tokenExpiresAt").notNull(),
  htmlSnapshot: mediumtext("htmlSnapshot").notNull(),
  status: mysqlEnum("status", ["pending", "signed", "expired"])
    .default("pending")
    .notNull(),
  signedByName: varchar("signedByName", { length: 120 }),
  signerTitle: varchar("signerTitle", { length: 120 }),
  signedAt: timestamp("signedAt"),
  signatureIp: varchar("signatureIp", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MsaDocument = typeof msaDocuments.$inferSelect;
export type InsertMsaDocument = typeof msaDocuments.$inferInsert;

// ─── Onboarding Checklists ────────────────────────────────────────────────────
export const onboardingChecklists = mysqlTable("onboarding_checklists", {
  id: int("id").autoincrement().primaryKey(),
  inquiryId: int("inquiryId").notNull().unique(),
  clientId: int("clientId"),
  template: varchar("template", { length: 60 }).default("standard").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "complete"])
    .default("open")
    .notNull(),
  unitAssignment: text("unitAssignment"), // JSON: assigned warehouse unit / bay details
  notes: text("notes"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingChecklist = typeof onboardingChecklists.$inferSelect;
export type InsertOnboardingChecklist =
  typeof onboardingChecklists.$inferInsert;

// ─── Onboarding Tasks ─────────────────────────────────────────────────────────
export const onboardingTasks = mysqlTable("onboarding_tasks", {
  id: int("id").autoincrement().primaryKey(),
  checklistId: int("checklistId").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  detail: text("detail"),
  sortOrder: int("sortOrder").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  completedBy: varchar("completedBy", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OnboardingTask = typeof onboardingTasks.$inferSelect;
export type InsertOnboardingTask = typeof onboardingTasks.$inferInsert;

// ─── Scheduled Calls (website "Schedule a Call" → Alex outbound callback) ────
// Visitor books a callback time; they must verify their email before the call
// is placed. A 5-minute worker (POST /api/scheduled-calls/process) queues due
// verified bookings through Bland and finalizes their outcome.
export const scheduledCalls = mysqlTable("scheduled_calls", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 200 }),
  topic: text("topic"),
  // Requested callback time, stored in UTC. Displayed/entered as America/Chicago.
  scheduledFor: timestamp("scheduledFor").notNull(),
  timezone: varchar("timezone", { length: 60 }).default("America/Chicago").notNull(),
  status: mysqlEnum("status", [
    "unverified", // booked, verification email sent, not yet confirmed
    "pending",    // email verified, waiting for its time
    "calling",   // handed to Bland, outcome not yet finalized
    "completed", // Bland reports the call completed
    "failed",    // Bland failed / no-answer after retries, or misconfigured
    "cancelled", // cancelled by staff
    "expired",   // never verified in time
  ])
    .default("unverified")
    .notNull(),
  verificationToken: varchar("verificationToken", { length: 64 }),
  verificationExpiresAt: timestamp("verificationExpiresAt"),
  verifiedAt: timestamp("verifiedAt"),
  blandCallId: varchar("blandCallId", { length: 64 }),
  attempts: int("attempts").default(0).notNull(),
  lastError: text("lastError"),
  ipHash: varchar("ipHash", { length: 64 }), // sha256 of request IP, for rate limiting
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledCall = typeof scheduledCalls.$inferSelect;
export type InsertScheduledCall = typeof scheduledCalls.$inferInsert;
