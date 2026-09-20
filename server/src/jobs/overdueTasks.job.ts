import cron from "node-cron";

import { prisma } from "../config/prisma";
import { createNotification } from "../services/notification.service";
import { createActivity } from "../services/activity.service";

export function startOverdueTaskJob() {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();

      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: {
            lt: now,
          },
          status: {
            not: "DONE",
          },
          assigneeId: {
            not: null,
          },
        },
        include: {
          assignee: true,
          project: true,
        },
      });

      for (const task of overdueTasks) {
        if (!task.assigneeId || !task.assignee) {
          continue;
        }

        await createNotification({
          userId: task.assigneeId,
          title: "Overdue task",
          message: `Task "${task.title}" in "${task.project.name}" is overdue.`,
        });

        await createActivity({
          type: "NOTIFICATION_CREATED",
          message: `Task "${task.title}" was detected as overdue`,
          userId: task.assigneeId,
          projectId: task.projectId,
          taskId: task.id,
          metadata: {
            dueDate: task.dueDate,
          },
        });
      }

      console.log(
        `Overdue task job completed: ${overdueTasks.length} task(s) checked`
      );
    } catch (error) {
      console.error("Overdue task job failed:", error);
    }
  });

  console.log("Overdue task scheduler started");
}