import { prisma } from "../config/prisma";
import { broadcastActivity } from "../realtime/socket";

type ActivityInput = {
  type:
    | "PROJECT_CREATED"
    | "PROJECT_UPDATED"
    | "TASK_CREATED"
    | "TASK_UPDATED"
    | "TASK_ASSIGNED"
    | "TASK_STATUS_CHANGED"
    | "COMMENT_ADDED"
    | "USER_LOGIN"
    | "USER_LOGOUT"
    | "NOTIFICATION_CREATED";

  message: string;

  userId?: string;

  projectId?: string;

  taskId?: string;

  metadata?: Record<string, unknown>;
};

export async function createActivity(input: ActivityInput) {
  const data = {
    type: input.type,
    message: input.message,
    ...(input.userId !== undefined && {
      userId: input.userId,
    }),
    ...(input.projectId !== undefined && {
      projectId: input.projectId,
    }),
    ...(input.taskId !== undefined && {
      taskId: input.taskId,
    }),
    ...(input.metadata !== undefined && {
      metadata: input.metadata,
    }),
  };

  const activity = await prisma.activity.create({
    data: data as any,

    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });
    broadcastActivity(activity);

  return activity;
}

export async function getRecentActivities(limit = 50) {
  return prisma.activity.findMany({
    take: limit,

    orderBy: {
      createdAt: "desc",
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },

      project: {
        select: {
          id: true,
          name: true,
        },
      },

      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function getActivitiesSince(
  since: Date,
  limit = 100
) {
  return prisma.activity.findMany({
    where: {
      createdAt: {
        gt: since,
      },
    },

    take: limit,

    orderBy: {
      createdAt: "asc",
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },

      project: {
        select: {
          id: true,
          name: true,
        },
      },

      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}