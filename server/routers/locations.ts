import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, logActivity } from "../db";
import { clients, locations } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";

const isStaffOrAdmin = (role: string) => role === "admin" || role === "staff";

const locationInput = z.object({
  name: z.string().min(1).max(128),
  address: z.string().min(1),
  city: z.string().min(1).max(64),
  state: z.string().min(1).max(8).default("TX"),
  zip: z.string().min(1).max(16),
  contactName: z.string().max(128).optional(),
  contactPhone: z.string().max(32).optional(),
  receivingHours: z.string().max(256).optional(),
  dockInfo: z.string().optional(),
  notes: z.string().optional(),
});

async function getLocationOrThrow(id: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const [loc] = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
  if (!loc) throw new TRPCError({ code: "NOT_FOUND", message: "Location not found" });
  return loc;
}

export const locationsRouter = router({
  // Staff/admin see all (active first). Customers see only their assigned location.
  list: protectedProcedure
    .input(z.object({ includeInactive: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      if (isStaffOrAdmin(ctx.user.role)) {
        const rows = await db.select().from(locations).orderBy(locations.name);
        return input?.includeInactive ? rows : rows.filter((r) => r.isActive);
      }
      // Customer: only their assigned location
      if (!ctx.user.clientId) return [];
      const [client] = await db.select().from(clients).where(eq(clients.id, ctx.user.clientId)).limit(1);
      if (!client?.locationId) return [];
      const [loc] = await db.select().from(locations).where(eq(locations.id, client.locationId)).limit(1);
      return loc && loc.isActive ? [loc] : [];
    }),

  // The signed-in customer's assigned location (convenience for the dashboard).
  myLocation: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user.clientId) return null;
    const [client] = await db.select().from(clients).where(eq(clients.id, ctx.user.clientId)).limit(1);
    if (!client?.locationId) return null;
    const [loc] = await db.select().from(locations).where(eq(locations.id, client.locationId)).limit(1);
    return loc && loc.isActive ? loc : null;
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const loc = await getLocationOrThrow(input.id);
      if (isStaffOrAdmin(ctx.user.role)) return loc;
      // Customers may only read their own assigned location
      const db = await getDb();
      const [client] = await db!
        .select()
        .from(clients)
        .where(eq(clients.id, ctx.user.clientId ?? -1))
        .limit(1);
      if (client?.locationId !== loc.id || !loc.isActive) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return loc;
    }),

  create: protectedProcedure
    .input(locationInput)
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const result = await db.insert(locations).values(input);
      const insertId = Number((result as any)[0]?.insertId ?? (result as any).insertId ?? 0);
      await logActivity({
        userId: ctx.user.id,
        action: `Added warehouse location "${input.name}"`,
        entityType: "location",
        entityId: insertId || undefined,
      });
      return { id: insertId };
    }),

  update: protectedProcedure
    .input(locationInput.partial().extend({ id: z.number(), isActive: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await getLocationOrThrow(input.id);
      const db = await getDb();
      const { id, ...data } = input;
      await db!.update(locations).set(data).where(eq(locations.id, id));
      await logActivity({
        userId: ctx.user.id,
        action: `Updated warehouse location #${id}`,
        entityType: "location",
        entityId: id,
      });
      return { success: true };
    }),

  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await getLocationOrThrow(input.id);
      const db = await getDb();
      await db!.update(locations).set({ isActive: false }).where(eq(locations.id, input.id));
      await logActivity({
        userId: ctx.user.id,
        action: `Deactivated warehouse location #${input.id}`,
        entityType: "location",
        entityId: input.id,
      });
      return { success: true };
    }),

  assignToClient: protectedProcedure
    .input(z.object({ clientId: z.number(), locationId: z.number().nullable() }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [client] = await db.select().from(clients).where(eq(clients.id, input.clientId)).limit(1);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
      let locationName = "none";
      if (input.locationId !== null) {
        const loc = await getLocationOrThrow(input.locationId);
        if (!loc.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot assign an inactive location" });
        locationName = loc.name;
      }
      await db.update(clients).set({ locationId: input.locationId }).where(eq(clients.id, input.clientId));
      await logActivity({
        userId: ctx.user.id,
        clientId: input.clientId,
        action: `Assigned warehouse location "${locationName}" to ${client.companyName}`,
        entityType: "client",
        entityId: input.clientId,
      });
      return { success: true };
    }),
});
