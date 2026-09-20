import { prisma } from "../config/prisma";

type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

export async function getDashboardStats(
  userId: string,
  role: UserRole
) {
  const projectWhere =
    role === "PROJECT_MANAGER"
      ? {
          ownerId: userId,
        }
      : role === "DEVELOPER"
        ? {
            tasks: {
              some: {
                assigneeId: userId,
              },
            },
          }
        : {};

  const taskWhere =
    role === "PROJECT_MANAGER"
      ? {
          project: {
            ownerId: userId,
          },
        }
      : role === "DEVELOPER"
        ? {
            assigneeId: userId,
          }
        : {};

  const [
    totalProjects,
    totalTasks,
    todoTasks,
    inProgressTasks,
    inReviewTasks,
    completedTasks,
    overdueTasks,
  ] = await Promise.all([
    prisma.project.count({
      where: projectWhere,
    }),

    prisma.task.count({
      where: taskWhere,
    }),

    prisma.task.count({
      where: {
        ...taskWhere,
        status: "TODO",
      },
    }),

    prisma.task.count({
      where: {
        ...taskWhere,
        status: "IN_PROGRESS",
      },
    }),

    prisma.task.count({
      where: {
        ...taskWhere,
        status: "IN_REVIEW",
      },
    }),

    prisma.task.count({
      where: {
        ...taskWhere,
        status: "DONE",
      },
    }),

    prisma.task.count({
      where: {
        ...taskWhere,
        dueDate: {
          lt: new Date(),
        },
        status: {
          not: "DONE",
        },
      },
    }),
  ]);

  return {
    projects: totalProjects,
    tasks: {
      total: totalTasks,
      todo: todoTasks,
      inProgress: inProgressTasks,
      inReview: inReviewTasks,
      completed: completedTasks,
      overdue: overdueTasks,
    },
  };
}