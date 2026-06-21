import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  activityLogs,
  boxes,
  clients,
  devices,
  expectedDeliveries,
  invoiceLineItems,
  invoices,
  outboundShipments,
  packages,
  pallets,
  photos,
  receivingLogs,
  shipmentItems,
  stagingTaskDevices,
  stagingTasks,
  users,
  type InsertActivityLog,
  type InsertBox,
  type InsertClient,
  type InsertDevice,
  type InsertExpectedDelivery,
  type InsertInvoice,
  type InsertInvoiceLineItem,
  type InsertOutboundShipment,
  type InsertPackage,
  type InsertPallet,
  type InsertPhoto,
  type InsertReceivingLog,
  type InsertStagingTask,
  documentTemplates,
  clientDocuments,
  type InsertDocumentTemplate,
  type InsertClientDocument,
  packageInquiries,
  type PackageInquiry,
  clientMessages,
  type ClientMessage,
  type InsertClientMessage,
  shipmentDocuments,
  stagingNotifications,
  type StagingNotification,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { nanoid } from "nanoid";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "admin" | "staff" | "customer_admin" | "customer_viewer", clientId?: number | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role, clientId: clientId ?? null }).where(eq(users.id, userId));
}

export async function updateUser(userId: number, data: { name?: string; email?: string; role?: "admin" | "staff" | "customer_admin" | "customer_viewer"; clientId?: number | null; businessName?: string | null; phone?: string | null; location?: string | null }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, userId));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function createUser(data: { name: string; email: string; role: "admin" | "staff" | "customer_admin" | "customer_viewer"; clientId?: number | null; businessName?: string | null; phone?: string | null; location?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  // Generate a placeholder openId — will be replaced when user logs in via OAuth
  const placeholderOpenId = `pre_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const [row] = await db.insert(users).values({
    openId: placeholderOpenId,
    name: data.name,
    email: data.email,
    role: data.role,
    clientId: data.clientId ?? null,
    businessName: data.businessName ?? null,
    phone: data.phone ?? null,
    location: data.location ?? null,
  });
  return { id: (row as any).insertId as number };
}

// ─── Packages ─────────────────────────────────────────────────────────────────
export async function listPackages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(packages).orderBy(packages.basePrice);
}

export async function getPackage(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  return result[0];
}

export async function createPackage(data: InsertPackage) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(packages).values(data);
  return result[0];
}

export async function updatePackage(id: number, data: Partial<InsertPackage>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(packages).set(data).where(eq(packages.id, id));
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export async function listClients(search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search) {
    return db.select().from(clients).where(
      or(like(clients.companyName, `%${search}%`), like(clients.contactEmail, `%${search}%`))
    ).orderBy(desc(clients.createdAt));
  }
  return db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getClient(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(clients).values(data);
  return result[0];
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(clients).set(data).where(eq(clients.id, id));
}

// ─── Expected Deliveries ──────────────────────────────────────────────────────
export async function listDeliveries(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clientId) {
    return db.select().from(expectedDeliveries).where(eq(expectedDeliveries.clientId, clientId)).orderBy(desc(expectedDeliveries.createdAt));
  }
  return db.select().from(expectedDeliveries).orderBy(desc(expectedDeliveries.createdAt));
}

export async function getDelivery(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(expectedDeliveries).where(eq(expectedDeliveries.id, id)).limit(1);
  return result[0];
}

export async function createDelivery(data: InsertExpectedDelivery) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(expectedDeliveries).values(data);
  return result[0];
}

export async function updateDelivery(id: number, data: Partial<InsertExpectedDelivery>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(expectedDeliveries).set(data).where(eq(expectedDeliveries.id, id));
}

// ─── Receiving Logs ───────────────────────────────────────────────────────────
export async function listReceivingLogs(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clientId) {
    return db.select().from(receivingLogs).where(eq(receivingLogs.clientId, clientId)).orderBy(desc(receivingLogs.receivedAt));
  }
  return db.select().from(receivingLogs).orderBy(desc(receivingLogs.receivedAt));
}

export async function getReceivingLog(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(receivingLogs).where(eq(receivingLogs.id, id)).limit(1);
  return result[0];
}

export async function createReceivingLog(data: InsertReceivingLog) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(receivingLogs).values(data);
  return result[0];
}

export async function updateReceivingLog(id: number, data: Partial<InsertReceivingLog>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(receivingLogs).set(data).where(eq(receivingLogs.id, id));
}

// ─── Pallets ──────────────────────────────────────────────────────────────────
function generateCode(prefix: string) {
  return `${prefix}-${nanoid(8).toUpperCase()}`;
}

export async function listPallets(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clientId) {
    return db.select().from(pallets).where(eq(pallets.clientId, clientId)).orderBy(desc(pallets.createdAt));
  }
  return db.select().from(pallets).orderBy(desc(pallets.createdAt));
}

export async function getPallet(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pallets).where(eq(pallets.id, id)).limit(1);
  return result[0];
}

export async function createPallet(data: Omit<InsertPallet, "palletCode">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const palletCode = generateCode("PLT");
  const result = await db.insert(pallets).values({ ...data, palletCode });
  return { insertId: result[0], palletCode };
}

export async function updatePallet(id: number, data: Partial<InsertPallet>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(pallets).set(data).where(eq(pallets.id, id));
}

// ─── Boxes ────────────────────────────────────────────────────────────────────
export async function listBoxes(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clientId) {
    return db.select().from(boxes).where(eq(boxes.clientId, clientId)).orderBy(desc(boxes.createdAt));
  }
  return db.select().from(boxes).orderBy(desc(boxes.createdAt));
}

export async function getBox(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(boxes).where(eq(boxes.id, id)).limit(1);
  return result[0];
}

export async function createBox(data: Omit<InsertBox, "boxCode">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const boxCode = generateCode("BOX");
  const result = await db.insert(boxes).values({ ...data, boxCode });
  return { insertId: result[0], boxCode };
}

export async function updateBox(id: number, data: Partial<InsertBox>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(boxes).set(data).where(eq(boxes.id, id));
}

// ─── Devices ──────────────────────────────────────────────────────────────────
export async function listDevices(clientId?: number, search?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (clientId) conditions.push(eq(devices.clientId, clientId));
  if (search) {
    conditions.push(or(
      like(devices.serialNumber, `%${search}%`),
      like(devices.macAddress, `%${search}%`),
      like(devices.model, `%${search}%`),
      like(devices.deviceCode, `%${search}%`),
      like(devices.assetTag, `%${search}%`)
    ));
  }
  if (conditions.length > 0) {
    return db.select().from(devices).where(and(...conditions)).orderBy(desc(devices.createdAt));
  }
  return db.select().from(devices).orderBy(desc(devices.createdAt));
}

export async function getDevice(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
  return result[0];
}

export async function createDevice(data: Omit<InsertDevice, "deviceCode">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const deviceCode = generateCode("DEV");
  const result = await db.insert(devices).values({ ...data, deviceCode });
  return { insertId: result[0], deviceCode };
}

export async function updateDevice(id: number, data: Partial<InsertDevice>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(devices).set(data).where(eq(devices.id, id));
}

// ─── Staging Tasks ────────────────────────────────────────────────────────────
export async function listStagingTasks(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clientId) {
    return db.select().from(stagingTasks).where(eq(stagingTasks.clientId, clientId)).orderBy(desc(stagingTasks.createdAt));
  }
  return db.select().from(stagingTasks).orderBy(desc(stagingTasks.createdAt));
}

export async function getStagingTask(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stagingTasks).where(eq(stagingTasks.id, id)).limit(1);
  return result[0];
}

export async function createStagingTask(data: InsertStagingTask) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(stagingTasks).values(data);
  return result[0];
}

export async function updateStagingTask(id: number, data: Partial<InsertStagingTask>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(stagingTasks).set(data).where(eq(stagingTasks.id, id));
}

export async function getStagingTaskDevices(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stagingTaskDevices).where(eq(stagingTaskDevices.taskId, taskId));
}

export async function addDeviceToTask(taskId: number, deviceId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(stagingTaskDevices).values({ taskId, deviceId });
}

export async function removeDeviceFromTask(taskId: number, deviceId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(stagingTaskDevices).where(and(eq(stagingTaskDevices.taskId, taskId), eq(stagingTaskDevices.deviceId, deviceId)));
}

// ─── Outbound Shipments ───────────────────────────────────────────────────────
export async function listShipments(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clientId) {
    return db.select().from(outboundShipments).where(eq(outboundShipments.clientId, clientId)).orderBy(desc(outboundShipments.createdAt));
  }
  return db.select().from(outboundShipments).orderBy(desc(outboundShipments.createdAt));
}

export async function getShipment(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(outboundShipments).where(eq(outboundShipments.id, id)).limit(1);
  return result[0];
}

export async function createShipment(data: Omit<InsertOutboundShipment, "shipmentCode">) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const shipmentCode = generateCode("SHP");
  const result = await db.insert(outboundShipments).values({ ...data, shipmentCode });
  return { insertId: result[0], shipmentCode };
}

export async function updateShipment(id: number, data: Partial<InsertOutboundShipment>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(outboundShipments).set(data).where(eq(outboundShipments.id, id));
}

export async function getShipmentItems(shipmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shipmentItems).where(eq(shipmentItems.shipmentId, shipmentId));
}

export async function addShipmentItem(shipmentId: number, itemType: "device" | "box" | "pallet", itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(shipmentItems).values({ shipmentId, itemType, itemId });
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
export async function listInvoices(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clientId) {
    return db.select().from(invoices).where(eq(invoices.clientId, clientId)).orderBy(desc(invoices.createdAt));
  }
  return db.select().from(invoices).orderBy(desc(invoices.createdAt));
}

export async function getInvoice(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0];
}

export async function createInvoice(data: InsertInvoice) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(invoices).values(data);
  return result[0];
}

export async function updateInvoice(id: number, data: Partial<InsertInvoice>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(invoices).set(data).where(eq(invoices.id, id));
}

export async function getInvoiceLineItems(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId));
}

export async function createLineItem(data: InsertInvoiceLineItem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(invoiceLineItems).values(data);
}

export async function deleteLineItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(invoiceLineItems).where(eq(invoiceLineItems.id, id));
}

// ─── Photos ───────────────────────────────────────────────────────────────────
export async function listPhotos(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(photos).where(
    and(eq(photos.entityType, entityType as any), eq(photos.entityId, entityId))
  ).orderBy(desc(photos.createdAt));
}

export async function listPhotosByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(photos).where(eq(photos.clientId, clientId)).orderBy(desc(photos.createdAt));
}

export async function createPhoto(data: InsertPhoto) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(photos).values(data);
  return result[0];
}

// ─── Activity Logs ────────────────────────────────────────────────────────────
export async function logActivity(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values(data);
}

export async function listActivityLogs(clientId?: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  if (clientId) {
    return db.select().from(activityLogs).where(eq(activityLogs.clientId, clientId)).orderBy(desc(activityLogs.createdAt)).limit(limit);
  }
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

// ─── Usage / Dashboard Stats ──────────────────────────────────────────────────
export async function getClientUsage(clientId: number) {
  const db = await getDb();
  if (!db) return null;

  const [deviceCount] = await db.select({ count: sql<number>`count(*)` }).from(devices).where(eq(devices.clientId, clientId));
  const [boxCount] = await db.select({ count: sql<number>`count(*)` }).from(boxes).where(eq(boxes.clientId, clientId));
  const [palletCount] = await db.select({ count: sql<number>`count(*)` }).from(pallets).where(eq(pallets.clientId, clientId));
  const [shipmentCount] = await db.select({ count: sql<number>`count(*)` }).from(outboundShipments).where(eq(outboundShipments.clientId, clientId));
  const [stagingCount] = await db.select({ count: sql<number>`count(*)` }).from(stagingTasks).where(eq(stagingTasks.clientId, clientId));
  const [deliveryCount] = await db.select({ count: sql<number>`count(*)` }).from(expectedDeliveries).where(eq(expectedDeliveries.clientId, clientId));
  const [receivingCount] = await db.select({ count: sql<number>`count(*)` }).from(receivingLogs).where(eq(receivingLogs.clientId, clientId));

  return {
    devices: Number(deviceCount?.count ?? 0),
    boxes: Number(boxCount?.count ?? 0),
    pallets: Number(palletCount?.count ?? 0),
    shipments: Number(shipmentCount?.count ?? 0),
    stagingTasks: Number(stagingCount?.count ?? 0),
    deliveries: Number(deliveryCount?.count ?? 0),
    receivingLogs: Number(receivingCount?.count ?? 0),
  };
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [clientCount] = await db.select({ count: sql<number>`count(*)` }).from(clients);
  const [deviceCount] = await db.select({ count: sql<number>`count(*)` }).from(devices);
  const [boxCount] = await db.select({ count: sql<number>`count(*)` }).from(boxes);
  const [palletCount] = await db.select({ count: sql<number>`count(*)` }).from(pallets);
  const [pendingTasks] = await db.select({ count: sql<number>`count(*)` }).from(stagingTasks).where(eq(stagingTasks.status, "pending"));
  const [inProgressTasks] = await db.select({ count: sql<number>`count(*)` }).from(stagingTasks).where(eq(stagingTasks.status, "in_progress"));
  const [pendingShipments] = await db.select({ count: sql<number>`count(*)` }).from(outboundShipments).where(eq(outboundShipments.status, "requested"));
  const [draftInvoices] = await db.select({ count: sql<number>`count(*)` }).from(invoices).where(eq(invoices.status, "draft"));
  const [deliveryCount] = await db.select({ count: sql<number>`count(*)` }).from(expectedDeliveries);

  return {
    clients: Number(clientCount?.count ?? 0),
    devices: Number(deviceCount?.count ?? 0),
    boxes: Number(boxCount?.count ?? 0),
    pallets: Number(palletCount?.count ?? 0),
    pendingTasks: Number(pendingTasks?.count ?? 0),
    inProgressTasks: Number(inProgressTasks?.count ?? 0),
    pendingShipments: Number(pendingShipments?.count ?? 0),
    draftInvoices: Number(draftInvoices?.count ?? 0),
    deliveries: Number(deliveryCount?.count ?? 0),
  };
}

// ─── Document Templates ───────────────────────────────────────────────────────
export async function listDocumentTemplates(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(documentTemplates).where(eq(documentTemplates.isActive, true)).orderBy(documentTemplates.category, documentTemplates.name);
  }
  return db.select().from(documentTemplates).orderBy(documentTemplates.category, documentTemplates.name);
}

export async function getDocumentTemplate(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documentTemplates).where(eq(documentTemplates.id, id)).limit(1);
  return result[0];
}

export async function createDocumentTemplate(data: InsertDocumentTemplate) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(documentTemplates).values(data);
  return result[0];
}

export async function updateDocumentTemplate(id: number, data: Partial<InsertDocumentTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(documentTemplates).set(data).where(eq(documentTemplates.id, id));
}

// ─── Client Documents ─────────────────────────────────────────────────────────
export async function listClientDocuments(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientDocuments).where(eq(clientDocuments.clientId, clientId)).orderBy(desc(clientDocuments.createdAt));
}

export async function getClientDocument(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientDocuments).where(eq(clientDocuments.id, id)).limit(1);
  return result[0];
}

export async function createClientDocument(data: InsertClientDocument) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(clientDocuments).values(data);
  return result[0];
}

export async function updateClientDocument(id: number, data: Partial<InsertClientDocument>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(clientDocuments).set(data).where(eq(clientDocuments.id, id));
}

export async function listAllClientDocuments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientDocuments).orderBy(desc(clientDocuments.createdAt));
}

// ─── Package Inquiries ────────────────────────────────────────────────────────
export async function listInquiries(opts?: {
  status?: "new" | "contacted" | "closed";
  tier?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: ReturnType<typeof eq>[] = [];
  if (opts?.status) conditions.push(eq(packageInquiries.status, opts.status));
  if (opts?.tier) conditions.push(eq(packageInquiries.tier, opts.tier as PackageInquiry["tier"]));

  let query = db.select().from(packageInquiries).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));

  const rows = await query.orderBy(desc(packageInquiries.createdAt));

  if (opts?.search) {
    const q = opts.search.toLowerCase();
    return rows.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.message ?? "").toLowerCase().includes(q),
    );
  }
  return rows;
}

export async function getInquiry(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(packageInquiries).where(eq(packageInquiries.id, id));
  return row;
}

export async function updateInquiryStatus(id: number, status: "new" | "contacted" | "closed") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(packageInquiries).set({ status }).where(eq(packageInquiries.id, id));
}

export async function deleteInquiry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(packageInquiries).where(eq(packageInquiries.id, id));
}

export async function countNewInquiries() {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(packageInquiries)
    .where(eq(packageInquiries.status, "new"));
  return Number(row?.count ?? 0);
}

// ─── Client Messages ──────────────────────────────────────────────────────────
export async function listClientMessages(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clientMessages)
    .where(eq(clientMessages.clientId, clientId))
    .orderBy(clientMessages.createdAt);
}

export async function sendClientMessage(data: InsertClientMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(clientMessages).values(data);
  return result[0];
}

export async function markClientMessagesRead(clientId: number, readByStaff: boolean) {
  // readByStaff=true → mark customer messages as read (staff opened thread)
  // readByStaff=false → mark staff messages as read (customer opened thread)
  const db = await getDb();
  if (!db) return;
  await db
    .update(clientMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(clientMessages.clientId, clientId),
        // Mark messages sent by the OTHER side as read
        readByStaff
          ? sql`${clientMessages.senderId} IS NULL OR ${clientMessages.senderRole} IN ('customer_admin','customer_viewer')`
          : sql`${clientMessages.senderRole} IN ('admin','staff')`,
        sql`${clientMessages.readAt} IS NULL`,
      ),
    );
}

export async function countUnreadClientMessages(clientId: number, forStaff: boolean) {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clientMessages)
    .where(
      and(
        eq(clientMessages.clientId, clientId),
        forStaff
          ? sql`${clientMessages.senderRole} IN ('customer_admin','customer_viewer')`
          : sql`${clientMessages.senderRole} IN ('admin','staff')`,
        sql`${clientMessages.readAt} IS NULL`,
      ),
    );
  return Number(row?.count ?? 0);
}

// Returns one row per client that has at least one message, with latest message preview and unread count (for staff)
export async function listAllThreads() {
  const db = await getDb();
  if (!db) return [];

  // Get all clients that have messages, with latest message info
  const rows = await db
    .select({
      clientId: clientMessages.clientId,
      latestBody: sql<string>`(SELECT body FROM client_messages cm2 WHERE cm2.clientId = ${clientMessages.clientId} ORDER BY cm2.createdAt DESC LIMIT 1)`,
      latestAt: sql<Date>`(SELECT createdAt FROM client_messages cm2 WHERE cm2.clientId = ${clientMessages.clientId} ORDER BY cm2.createdAt DESC LIMIT 1)`,
      latestSenderRole: sql<string>`(SELECT senderRole FROM client_messages cm2 WHERE cm2.clientId = ${clientMessages.clientId} ORDER BY cm2.createdAt DESC LIMIT 1)`,
      latestSenderName: sql<string>`(SELECT senderName FROM client_messages cm2 WHERE cm2.clientId = ${clientMessages.clientId} ORDER BY cm2.createdAt DESC LIMIT 1)`,
      unreadCount: sql<number>`SUM(CASE WHEN ${clientMessages.senderRole} IN ('customer_admin','customer_viewer') AND ${clientMessages.readAt} IS NULL THEN 1 ELSE 0 END)`,
      totalMessages: sql<number>`COUNT(*)`,
    })
    .from(clientMessages)
    .groupBy(clientMessages.clientId)
    .orderBy(sql`latestAt DESC`);

  // Fetch client names for the thread list
  const clientIds = rows.map((r) => r.clientId);
  if (clientIds.length === 0) return [];

  const clientRows = await db
    .select({ id: clients.id, companyName: clients.companyName, contactName: clients.contactName, status: clients.status })
    .from(clients)
    .where(sql`${clients.id} IN (${sql.join(clientIds.map((id) => sql`${id}`), sql`, `)})`);

  const clientMap = Object.fromEntries(clientRows.map((c) => [c.id, c]));

  return rows.map((r) => ({
    clientId: r.clientId,
    companyName: clientMap[r.clientId]?.companyName ?? "Unknown",
    contactName: clientMap[r.clientId]?.contactName ?? null,
    clientStatus: clientMap[r.clientId]?.status ?? "active",
    latestBody: r.latestBody,
    latestAt: r.latestAt,
    latestSenderRole: r.latestSenderRole,
    latestSenderName: r.latestSenderName,
    unreadCount: Number(r.unreadCount ?? 0),
    totalMessages: Number(r.totalMessages ?? 0),
  }));
}

export async function countTotalUnread() {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clientMessages)
    .where(
      and(
        sql`${clientMessages.senderRole} IN ('customer_admin','customer_viewer')`,
        sql`${clientMessages.readAt} IS NULL`,
      ),
    );
  return Number(row?.count ?? 0);
}

// ─── Forwarding Locations ─────────────────────────────────────────────────────

export type ForwardingStatus = "pending" | "in_transit" | "delivered";

export interface ForwardingUpdate {
  forwardingAddress?: string | null;
  forwardingContact?: string | null;
  forwardingNotes?: string | null;
  forwardingStatus?: ForwardingStatus;
}

/** Update forwarding info on a device. Returns the updated device row. */
export async function updateDeviceForwarding(id: number, data: ForwardingUpdate) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(devices).set({ ...data, forwardingUpdatedAt: new Date() }).where(eq(devices.id, id));
  const result = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
  return result[0];
}

/** Update forwarding info on a box. Returns the updated box row. */
export async function updateBoxForwarding(id: number, data: ForwardingUpdate) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(boxes).set({ ...data, forwardingUpdatedAt: new Date() }).where(eq(boxes.id, id));
  const result = await db.select().from(boxes).where(eq(boxes.id, id)).limit(1);
  return result[0];
}

/** Update forwarding info on a pallet. Returns the updated pallet row. */
export async function updatePalletForwarding(id: number, data: ForwardingUpdate) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(pallets).set({ ...data, forwardingUpdatedAt: new Date() }).where(eq(pallets.id, id));
  const result = await db.select().from(pallets).where(eq(pallets.id, id)).limit(1);
  return result[0];
}

/** List all staged devices for a client (stagingStatus = staged/labeled/packed/ready_to_ship/shipped) */
export async function listStagedDevicesForClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devices)
    .where(
      and(
        eq(devices.clientId, clientId),
        sql`${devices.stagingStatus} IN ('staged','labeled','packed','ready_to_ship','shipped','picked_up')`,
      )
    )
    .orderBy(desc(devices.updatedAt));
}

/** List all staged boxes for a client */
export async function listStagedBoxesForClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(boxes)
    .where(
      and(
        eq(boxes.clientId, clientId),
        sql`${boxes.status} IN ('staging','packed','shipped')`,
      )
    )
    .orderBy(desc(boxes.updatedAt));
}

/** List all staged pallets for a client */
export async function listStagedPalletsForClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pallets)
    .where(
      and(
        eq(pallets.clientId, clientId),
        sql`${pallets.status} IN ('staging','ready_to_ship','shipped')`,
      )
    )
    .orderBy(desc(pallets.updatedAt));
}

// ─── Shipment Documents ───────────────────────────────────────────────────────

export async function listShipmentDocuments(shipmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shipmentDocuments)
    .where(eq(shipmentDocuments.shipmentId, shipmentId))
    .orderBy(desc(shipmentDocuments.createdAt));
}

export async function addShipmentDocument(data: {
  shipmentId: number;
  clientId: number;
  uploadedById: number;
  uploadedByName?: string;
  filename: string;
  mimeType: string;
  fileSize?: number;
  fileKey: string;
  fileUrl: string;
  label?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(shipmentDocuments).values(data);
  const [row] = await db.select().from(shipmentDocuments)
    .where(eq(shipmentDocuments.id, (result as any).insertId))
    .limit(1);
  return row;
}

export async function getShipmentDocument(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(shipmentDocuments)
    .where(eq(shipmentDocuments.id, id)).limit(1);
  return row ?? null;
}

export async function deleteShipmentDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(shipmentDocuments).where(eq(shipmentDocuments.id, id));
}

// ─── Staging Notifications (Ready to Ship) ───────────────────────────────────
export async function createStagingNotification(data: {
  deviceId: number;
  clientId: number;
  notifiedByUserId: number;
  notifiedByName: string;
  deviceCode: string;
  message?: string | null;
  emailSent?: boolean;
}): Promise<StagingNotification> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(stagingNotifications).values({
    deviceId: data.deviceId,
    clientId: data.clientId,
    notifiedByUserId: data.notifiedByUserId,
    notifiedByName: data.notifiedByName,
    deviceCode: data.deviceCode,
    message: data.message ?? null,
    emailSent: data.emailSent ?? false,
  });
  const [row] = await db.select().from(stagingNotifications)
    .where(eq(stagingNotifications.id, (result as any).insertId)).limit(1);
  return row;
}

export async function listStagingNotifications(clientId: number): Promise<StagingNotification[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stagingNotifications)
    .where(eq(stagingNotifications.clientId, clientId))
    .orderBy(desc(stagingNotifications.createdAt));
}

export async function listAllStagingNotifications(): Promise<StagingNotification[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stagingNotifications)
    .orderBy(desc(stagingNotifications.createdAt));
}

export async function getStagingNotification(id: number): Promise<StagingNotification | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(stagingNotifications)
    .where(eq(stagingNotifications.id, id)).limit(1);
  return row ?? null;
}

export async function acknowledgeStagingNotification(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(stagingNotifications)
    .set({ acknowledgedAt: new Date(), acknowledgedByUserId: userId })
    .where(eq(stagingNotifications.id, id));
}

export async function countUnacknowledgedNotifications(clientId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(stagingNotifications)
    .where(and(
      eq(stagingNotifications.clientId, clientId),
      sql`${stagingNotifications.acknowledgedAt} IS NULL`
    ));
  return Number(row?.count ?? 0);
}

export async function getUsersByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users)
    .where(eq(users.clientId, clientId));
}
