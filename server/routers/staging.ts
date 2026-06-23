import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addDeviceToTask, createStagingTask, getStagingTask, getStagingTaskDevices,
  listStagingTasks, logActivity, removeDeviceFromTask, updateStagingTask,
} from "../db";
import { customerProcedure, protectedProcedure, router } from "../_core/trpc";

const isStaffOrAdmin = (role: string) => role === "admin" || role === "staff";
const canRead = (role: string, userClientId: number | null | undefined, targetClientId: number) => {
  if (isStaffOrAdmin(role)) return true;
  return userClientId === targetClientId;
};

export const stagingRouter = router({
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_admin" || ctx.user.role === "customer_viewer") {
        return listStagingTasks(ctx.user.clientId ?? undefined);
      }
      return listStagingTasks(input?.clientId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const task = await getStagingTask(input.id);
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canRead(ctx.user.role, ctx.user.clientId, task.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      const taskDevices = await getStagingTaskDevices(input.id);
      return { ...task, devices: taskDevices };
    }),

  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      projectName: z.string().optional(),
      taskType: z.enum(["firmware_update", "labeling", "site_kit_prep", "switch_staging", "firewall_staging", "ap_prep", "camera_nvr_kit", "config_backup", "documentation", "other"]).optional(),
      title: z.string().min(1),
      instructions: z.string().optional(),
      assignedTo: z.number().optional(),
      priority: z.enum(["low", "normal", "high", "rush"]).optional(),
      estimatedHours: z.string().optional(),
      notes: z.string().optional(),
      deviceIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const { deviceIds, ...taskData } = input;
      const result = await createStagingTask({ ...taskData, createdBy: ctx.user.id } as any);
      // We need the inserted ID - re-fetch by title and clientId
      const tasks = await listStagingTasks(input.clientId);
      const newTask = tasks[0]; // most recent
      if (newTask && deviceIds?.length) {
        for (const deviceId of deviceIds) {
          await addDeviceToTask(newTask.id, deviceId);
        }
      }
      await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: `Created staging task: ${input.title}`, entityType: "staging_task" });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "in_progress", "completed", "on_hold", "cancelled"]).optional(),
      assignedTo: z.number().optional(),
      priority: z.enum(["low", "normal", "high", "rush"]).optional(),
      instructions: z.string().optional(),
      notes: z.string().optional(),
      startDate: z.string().optional(),
      completionDate: z.string().optional(),
      actualHours: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const task = await getStagingTask(input.id);
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await updateStagingTask(id, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        completionDate: data.completionDate ? new Date(data.completionDate) : undefined,
      } as any);
      await logActivity({ userId: ctx.user.id, clientId: task.clientId, action: `Updated staging task #${id}: ${data.status ?? "updated"}`, entityType: "staging_task", entityId: id });
      return { success: true };
    }),

  // Auto-advance: called after a device's staging status is updated to check if all devices in the task are staged
  checkAutoAdvance: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const task = await getStagingTask(input.taskId);
      if (!task || task.status === "completed" || task.status === "cancelled") return { advanced: false };
      const taskDevices = await getStagingTaskDevices(input.taskId);
      if (taskDevices.length === 0) return { advanced: false };
      // Check all devices in the task via the devices table
      const db = await (await import("../db")).getDb();
      if (!db) return { advanced: false };
      const { devices: devicesTable } = await import("../../drizzle/schema");
      const { inArray } = await import("drizzle-orm");
      const deviceIds = taskDevices.map((td: any) => td.deviceId);
      const deviceRows = await db.select({ stagingStatus: devicesTable.stagingStatus })
        .from(devicesTable)
        .where(inArray(devicesTable.id, deviceIds));
      const allStaged = deviceRows.length > 0 && deviceRows.every((d: any) =>
        ["staged", "labeled", "packed", "ready_to_ship", "shipped", "picked_up"].includes(d.stagingStatus ?? "")
      );
      if (allStaged) {
        await updateStagingTask(input.taskId, { status: "completed", completionDate: new Date() } as any);
        await logActivity({ userId: ctx.user.id, clientId: task.clientId, action: `Staging task #${input.taskId} auto-completed (all ${deviceIds.length} devices staged)`, entityType: "staging_task", entityId: input.taskId });
        return { advanced: true, message: `Task auto-completed — all ${deviceIds.length} devices staged` };
      }
      return { advanced: false };
    }),

  addDevice: protectedProcedure
    .input(z.object({ taskId: z.number(), deviceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await addDeviceToTask(input.taskId, input.deviceId);
      return { success: true };
    }),

  removeDevice: protectedProcedure
    .input(z.object({ taskId: z.number(), deviceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await removeDeviceFromTask(input.taskId, input.deviceId);
      return { success: true };
    }),

  // Customer-facing: staging progress summary for the customer dashboard
  customerProgress: customerProcedure
    .query(async ({ ctx }) => {
      const clientId = ctx.user.clientId;
      if (!clientId) return { tasks: [], totalDevices: 0, stagedDevices: 0 };
      const tasks = await listStagingTasks(clientId);
      // For each active task, count devices via the junction table
      const activeTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress");
      const taskProgress = await Promise.all(
        activeTasks.map(async (task) => {
          const taskDeviceLinks = await getStagingTaskDevices(task.id);
          // Count total linked devices; staged = task is completed or in_progress with devices
          // We approximate staged count from task status since junction table has no status field
          const total = taskDeviceLinks.length;
          // For progress: completed tasks count all devices as staged
          const staged = task.status === "completed" ? total : 0;
          const pct = total > 0 ? Math.round((staged / total) * 100) : (task.status === "completed" ? 100 : 0);
          return {
            id: task.id,
            name: task.title,
            status: task.status,
            totalDevices: total,
            stagedDevices: staged,
            percentComplete: pct,
          };
        })
      );
      const totalDevices = taskProgress.reduce((s, t) => s + t.totalDevices, 0);
      const stagedDevices = taskProgress.reduce((s, t) => s + t.stagedDevices, 0);
      return { tasks: taskProgress, totalDevices, stagedDevices };
    }),
});
