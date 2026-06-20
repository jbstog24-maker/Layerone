import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module so tests don't need a real database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  listClients: vi.fn().mockResolvedValue([]),
  getClient: vi.fn().mockResolvedValue(null),
  createClient: vi.fn().mockResolvedValue({ id: 1, companyName: "Test Corp", status: "active", createdAt: new Date(), updatedAt: new Date() }),
  updateClient: vi.fn().mockResolvedValue(undefined),
  listPackages: vi.fn().mockResolvedValue([]),
  getPackage: vi.fn().mockResolvedValue(null),
  createPackage: vi.fn().mockResolvedValue({ id: 1, name: "Basic", tier: "pilot", basePrice: "0.00", billingCycle: "monthly", createdAt: new Date(), updatedAt: new Date() }),
  updatePackage: vi.fn().mockResolvedValue(undefined),
  listDeliveries: vi.fn().mockResolvedValue([]),
  getDelivery: vi.fn().mockResolvedValue(null),
  createDelivery: vi.fn().mockResolvedValue({ id: 1, clientId: 1, status: "expected", createdAt: new Date(), updatedAt: new Date() }),
  updateDelivery: vi.fn().mockResolvedValue(undefined),
  listReceivingLogs: vi.fn().mockResolvedValue([]),
  getReceivingLog: vi.fn().mockResolvedValue(null),
  createReceivingLog: vi.fn().mockResolvedValue({ id: 1, clientId: 1, status: "received", condition: "good", receivedAt: new Date(), createdAt: new Date(), updatedAt: new Date() }),
  listPallets: vi.fn().mockResolvedValue([]),
  createPallet: vi.fn().mockResolvedValue({ id: 1, clientId: 1, palletCode: "PAL-001", status: "received", dateReceived: new Date(), createdAt: new Date(), updatedAt: new Date() }),
  updatePallet: vi.fn().mockResolvedValue(undefined),
  listBoxes: vi.fn().mockResolvedValue([]),
  createBox: vi.fn().mockResolvedValue({ id: 1, clientId: 1, boxCode: "BOX-001", status: "received", dateReceived: new Date(), createdAt: new Date(), updatedAt: new Date() }),
  updateBox: vi.fn().mockResolvedValue(undefined),
  listDevices: vi.fn().mockResolvedValue([]),
  getDevice: vi.fn().mockResolvedValue(null),
  createDevice: vi.fn().mockResolvedValue({ id: 1, clientId: 1, deviceCode: "DEV-001", stagingStatus: "expected", configStatus: "pending", createdAt: new Date(), updatedAt: new Date() }),
  updateDevice: vi.fn().mockResolvedValue(undefined),
  listStagingTasks: vi.fn().mockResolvedValue([]),
  getStagingTask: vi.fn().mockResolvedValue(null),
  createStagingTask: vi.fn().mockResolvedValue({ id: 1, clientId: 1, title: "Test Task", status: "pending", priority: "normal", taskType: "other", createdAt: new Date(), updatedAt: new Date() }),
  updateStagingTask: vi.fn().mockResolvedValue(undefined),
  listShipments: vi.fn().mockResolvedValue([]),
  getShipment: vi.fn().mockResolvedValue(null),
  createShipment: vi.fn().mockResolvedValue({ id: 1, clientId: 1, shipmentCode: "SHIP-001", status: "requested", createdAt: new Date(), updatedAt: new Date() }),
  updateShipment: vi.fn().mockResolvedValue(undefined),
  listInvoices: vi.fn().mockResolvedValue([]),
  getInvoice: vi.fn().mockResolvedValue(null),
  createInvoice: vi.fn().mockResolvedValue({ id: 1, clientId: 1, invoiceNumber: "INV-001", status: "draft", subtotal: "0.00", tax: "0.00", total: "0.00", periodStart: new Date(), periodEnd: new Date(), createdAt: new Date(), updatedAt: new Date() }),
  updateInvoice: vi.fn().mockResolvedValue(undefined),
  addInvoiceLineItem: vi.fn().mockResolvedValue({ id: 1 }),
  deleteInvoiceLineItem: vi.fn().mockResolvedValue(undefined),
  listActivityLogs: vi.fn().mockResolvedValue([]),
  listPhotos: vi.fn().mockResolvedValue([]),
  listPhotosByClient: vi.fn().mockResolvedValue([]),
  createPhoto: vi.fn().mockResolvedValue({ id: 1 }),
  listUsers: vi.fn().mockResolvedValue([]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn().mockResolvedValue(undefined),
  deleteUser: vi.fn().mockResolvedValue(undefined),
  getUserById: vi.fn().mockResolvedValue({ id: 2, name: "Test User", email: "test@example.com", role: "staff", clientId: null, openId: "oid_2", lastSignedIn: new Date(), createdAt: new Date() }),
  createUser: vi.fn().mockResolvedValue({ id: 99, name: "Jane Doe", email: "jane@company.com", role: "customer_admin", businessName: "Acme Corp", phone: "555-1234", location: "Austin, TX", openId: "placeholder_99", createdAt: new Date() }),
  getDashboardStats: vi.fn().mockResolvedValue({ clients: 0, devices: 0, boxes: 0, pallets: 0, pendingTasks: 0, inProgressTasks: 0, pendingShipments: 0, draftInvoices: 0 }),
  getClientUsage: vi.fn().mockResolvedValue({ devices: 0, boxes: 0, pallets: 0, shipments: 0, stagingTasks: 0, deliveries: 0, receivingLogs: 0 }),
  logActivity: vi.fn().mockResolvedValue(undefined),
  generateInvoiceFromUsage: vi.fn().mockResolvedValue({ id: 1, invoiceNumber: "INV-001", status: "draft", subtotal: "0.00", tax: "0.00", total: "0.00", periodStart: new Date(), periodEnd: new Date(), createdAt: new Date(), updatedAt: new Date() }),
  // Inquiry helpers
  listInquiries: vi.fn().mockResolvedValue([]),
  getInquiry: vi.fn().mockResolvedValue(null),
  updateInquiryStatus: vi.fn().mockResolvedValue(undefined),
  deleteInquiry: vi.fn().mockResolvedValue(undefined),
  countNewInquiries: vi.fn().mockResolvedValue(0),
  // Document helpers
  listDocumentTemplates: vi.fn().mockResolvedValue([]),
  getDocumentTemplate: vi.fn().mockResolvedValue(null),
  createDocumentTemplate: vi.fn().mockResolvedValue({ id: 1 }),
  updateDocumentTemplate: vi.fn().mockResolvedValue(undefined),
  listClientDocuments: vi.fn().mockResolvedValue([]),
  getClientDocument: vi.fn().mockResolvedValue(null),
  createClientDocument: vi.fn().mockResolvedValue({ id: 1 }),
  updateClientDocument: vi.fn().mockResolvedValue(undefined),
  listAllClientDocuments: vi.fn().mockResolvedValue([]),
  // Messaging helpers
  listClientMessages: vi.fn().mockResolvedValue([]),
  sendClientMessage: vi.fn().mockResolvedValue(undefined),
  markClientMessagesRead: vi.fn().mockResolvedValue(undefined),
  countUnreadClientMessages: vi.fn().mockResolvedValue(0),
  listAllThreads: vi.fn().mockResolvedValue([]),
  countTotalUnread: vi.fn().mockResolvedValue(0),
  // myUnread uses countUnreadClientMessages, already mocked above
  // Forwarding helpers
  getBox: vi.fn().mockResolvedValue({ id: 5, clientId: 1, boxCode: "BOX-005", status: "staging", condition: "good", createdAt: new Date(), updatedAt: new Date() }),
  getPallet: vi.fn().mockResolvedValue({ id: 3, clientId: 2, palletCode: "PLT-003", status: "staging", dateReceived: new Date(), createdAt: new Date(), updatedAt: new Date() }),
  updateDeviceForwarding: vi.fn().mockResolvedValue({ id: 1, deviceCode: "DEV-001", forwardingAddress: "123 Main St", forwardingStatus: "in_transit" }),
  updateBoxForwarding: vi.fn().mockResolvedValue({ id: 5, boxCode: "BOX-005", forwardingAddress: "456 Oak Ave", forwardingStatus: "pending" }),
  updatePalletForwarding: vi.fn().mockResolvedValue({ id: 3, palletCode: "PLT-003", forwardingAddress: "789 Pine Rd", forwardingStatus: "delivered" }),
  listStagedDevicesForClient: vi.fn().mockResolvedValue([]),
  listStagedBoxesForClient: vi.fn().mockResolvedValue([]),
  listStagedPalletsForClient: vi.fn().mockResolvedValue([]),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "https://example.com/photo.jpg" }),
  storageGet: vi.fn().mockResolvedValue({ key: "test-key", url: "https://example.com/photo.jpg" }),
}));

function makeCtx(role: string, clientId?: number): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: role as any,
      clientId: clientId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("auth.me", () => {
  it("returns the current user for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.role).toBe("admin");
  });

  it("returns null for unauthenticated context", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: vi.fn() } as any,
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("clients.list", () => {
  it("returns empty list for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clients.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws FORBIDDEN for customer_viewer", async () => {
    const ctx = makeCtx("customer_viewer", 1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.clients.list({})).rejects.toThrow();
  });
});

describe("packages.list", () => {
  it("returns packages for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.packages.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("deliveries.list", () => {
  it("returns deliveries for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.deliveries.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns deliveries for customer_admin", async () => {
    const ctx = makeCtx("customer_admin", 1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.deliveries.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("devices.list", () => {
  it("returns devices for staff", async () => {
    const ctx = makeCtx("staff");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.devices.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("staging.list", () => {
  it("returns staging tasks for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.staging.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("shipments.list", () => {
  it("returns shipments for customer_viewer", async () => {
    const ctx = makeCtx("customer_viewer", 1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.shipments.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("billing.listInvoices", () => {
  it("returns invoices for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.listInvoices({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns invoices for customer_admin", async () => {
    const ctx = makeCtx("customer_admin", 1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.listInvoices({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("dashboard.adminStats", () => {
  it("returns stats for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.adminStats();
    expect(result).toHaveProperty("clients");
    expect(result).toHaveProperty("devices");
  });

  it("throws FORBIDDEN for customer_viewer", async () => {
    const ctx = makeCtx("customer_viewer", 1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.adminStats()).rejects.toThrow();
  });
});

describe("users.list", () => {
  it("returns users for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws FORBIDDEN for staff", async () => {
    const ctx = makeCtx("staff");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.list()).rejects.toThrow();
  });
});

describe("users.update", () => {
  it("allows admin to update another user's role", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.update({ userId: 2, role: "staff" })).resolves.not.toThrow();
  });

  it("throws FORBIDDEN for staff trying to update users", async () => {
    const ctx = makeCtx("staff");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.update({ userId: 2, role: "staff" })).rejects.toThrow();
  });
});

describe("users.delete", () => {
  it("allows admin to delete another user", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.delete({ userId: 2 })).resolves.not.toThrow();
  });

  it("throws BAD_REQUEST when admin tries to delete themselves", async () => {
    const ctx = makeCtx("admin"); // ctx.user.id = 1, userId = 1
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.delete({ userId: 1 })).rejects.toThrow();
  });
});

describe("activity.list", () => {
  it("returns activity logs for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.activity.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("messages.list", () => {
  it("returns messages for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.list({ clientId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws FORBIDDEN for customer accessing another client's thread", async () => {
    const ctx = makeCtx("customer_viewer", 2); // clientId=2 but querying clientId=1
    const caller = appRouter.createCaller(ctx);
    await expect(caller.messages.list({ clientId: 1 })).rejects.toThrow();
  });
});

describe("messages.send", () => {
  it("allows admin to send a message", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.send({ clientId: 1, body: "Hello client!" });
    expect(result.success).toBe(true);
  });

  it("throws FORBIDDEN for customer sending to another client's thread", async () => {
    const ctx = makeCtx("customer_viewer", 2);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.messages.send({ clientId: 1, body: "Hi" })).rejects.toThrow();
  });
});

describe("messages.markRead", () => {
  it("allows admin to mark messages as read", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.markRead({ clientId: 1 });
    expect(result.success).toBe(true);
  });

  it("throws FORBIDDEN for customer accessing another client's thread", async () => {
    const ctx = makeCtx("customer_viewer", 2);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.messages.markRead({ clientId: 1 })).rejects.toThrow();
  });
});

describe("messages.countUnread", () => {
  it("returns 0 for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.countUnread({ clientId: 1 });
    expect(result).toBe(0);
  });

  it("throws FORBIDDEN for customer_viewer", async () => {
    const ctx = makeCtx("customer_viewer", 1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.messages.countUnread({ clientId: 1 })).rejects.toThrow();
  });
});

describe("inquiry.list", () => {
  it("returns inquiries for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inquiry.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws FORBIDDEN for customer_viewer", async () => {
    const ctx = makeCtx("customer_viewer", 1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.inquiry.list({})).rejects.toThrow();
  });
});

describe("messages.threads", () => {
  it("returns thread list for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.threads();
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws FORBIDDEN for customer_viewer", async () => {
    const ctx = makeCtx("customer_viewer", 1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.messages.threads()).rejects.toThrow();
  });
});

describe("messages.totalUnread", () => {
  it("returns 0 for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.totalUnread();
    expect(result).toBe(0);
  });

  it("throws FORBIDDEN for customer_viewer", async () => {
    const ctx = makeCtx("customer_viewer", 1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.messages.totalUnread()).rejects.toThrow();
  });
});

describe("messages.myUnread", () => {
  it("returns 0 for a customer with no clientId", async () => {
    const ctx = makeCtx("customer_viewer"); // no clientId
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.myUnread();
    expect(result).toBe(0);
  });

  it("returns 0 for admin (staff use totalUnread instead)", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.myUnread();
    expect(result).toBe(0);
  });

  it("returns unread count for a customer with a clientId", async () => {
    const ctx = makeCtx("customer_admin", 1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.myUnread();
    expect(typeof result).toBe("number");
  });
});

describe("users.create", () => {
  it("allows admin to create a user with all profile fields", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.create({
      name: "Jane Doe",
      email: "jane@company.com",
      role: "customer_admin",
      businessName: "Acme Corp",
      phone: "555-1234",
      location: "Austin, TX",
    });
    expect(result).toBeDefined();
  });

  it("throws FORBIDDEN for non-admin", async () => {
    const ctx = makeCtx("staff");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.users.create({ name: "X", email: "x@x.com", role: "staff" })
    ).rejects.toThrow();
  });

  it("throws validation error for invalid email", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.users.create({ name: "X", email: "not-an-email", role: "staff" })
    ).rejects.toThrow();
  });
});

describe("users.update with profile fields", () => {
  it("allows admin to update businessName, phone, location", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.update({
      userId: 2,
      businessName: "New Corp",
      phone: "555-9999",
      location: "Dallas, TX",
    });
    expect(result).toEqual({ success: true });
  });

  it("allows admin to clear optional fields with null", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.update({
      userId: 2,
      businessName: null,
      phone: null,
      location: null,
    });
    expect(result).toEqual({ success: true });
  });
});

describe("users.resendInvite", () => {
  it("allows admin to resend invite to an existing user", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.resendInvite({ userId: 2 });
    expect(result).toEqual({ success: true });
  });

  it("throws FORBIDDEN for non-admin (staff)", async () => {
    const ctx = makeCtx("staff");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.resendInvite({ userId: 2 })).rejects.toThrow();
  });

  it("throws NOT_FOUND when user does not exist", async () => {
    const { getUserById } = await import("./db");
    (getUserById as any).mockResolvedValueOnce(null);
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.resendInvite({ userId: 9999 })).rejects.toThrow();
  });
});

describe("forwarding.myItems", () => {
  it("returns empty lists for customer with no clientId", async () => {
    const ctx = makeCtx("customer_viewer"); // no clientId
    const caller = appRouter.createCaller(ctx);
    const result = await caller.forwarding.myItems();
    expect(result.devices).toEqual([]);
    expect(result.boxes).toEqual([]);
    expect(result.pallets).toEqual([]);
  });

  it("returns items for admin (all items, no client filter)", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.forwarding.myItems();
    expect(Array.isArray(result.devices)).toBe(true);
    expect(Array.isArray(result.boxes)).toBe(true);
    expect(Array.isArray(result.pallets)).toBe(true);
  });
});

describe("forwarding.updateDevice", () => {
  it("allows admin to update forwarding info on a device", async () => {
    const { getDevice } = await import("./db");
    (getDevice as any).mockResolvedValueOnce({ id: 1, clientId: 1, deviceCode: "DEV-001" });
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.forwarding.updateDevice({
      deviceId: 1,
      forwardingAddress: "123 Main St, Austin TX",
      forwardingContact: "John Smith",
      forwardingStatus: "in_transit",
    });
    expect(result).toBeDefined();
  });

  it("throws FORBIDDEN for customer updating another client's device", async () => {
    const { getDevice } = await import("./db");
    (getDevice as any).mockResolvedValueOnce({ id: 1, clientId: 99, deviceCode: "DEV-001" }); // different clientId
    const ctx = makeCtx("customer_admin", 1); // customer clientId = 1
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.forwarding.updateDevice({ deviceId: 1, forwardingAddress: "Hacked", forwardingStatus: "delivered" })
    ).rejects.toThrow();
  });

  it("throws NOT_FOUND when device does not exist", async () => {
    const { getDevice } = await import("./db");
    (getDevice as any).mockResolvedValueOnce(undefined);
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.forwarding.updateDevice({ deviceId: 9999, forwardingStatus: "pending" })
    ).rejects.toThrow();
  });
});

describe("forwarding.updateBox", () => {
  it("allows customer_admin to update forwarding on their own box", async () => {
    const { getBox } = await import("./db");
    (getBox as any).mockResolvedValueOnce({ id: 5, clientId: 1, boxCode: "BOX-005" });
    const ctx = makeCtx("customer_admin", 1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.forwarding.updateBox({
      boxId: 5,
      forwardingAddress: "456 Oak Ave, Dallas TX",
      forwardingStatus: "pending",
    });
    expect(result).toBeDefined();
  });
});

describe("forwarding.updatePallet", () => {
  it("allows staff to update forwarding on a pallet", async () => {
    const { getPallet } = await import("./db");
    (getPallet as any).mockResolvedValueOnce({ id: 3, clientId: 2, palletCode: "PLT-003" });
    const ctx = makeCtx("staff");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.forwarding.updatePallet({
      palletId: 3,
      forwardingAddress: "789 Pine Rd, Houston TX",
      forwardingStatus: "delivered",
    });
    expect(result).toBeDefined();
  });
});
