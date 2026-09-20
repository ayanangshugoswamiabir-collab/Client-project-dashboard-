import { prisma } from "../config/prisma";

type CreateTaskInput = {
  title: string;
  description?: string;
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "IN_REVIEW"
    | "DONE";
  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";
  dueDate?: string;
  projectId: string;
  assigneeId?: string;
};

type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  status?:
    | "TODO"
    | "IN_PROGRESS"
    | "IN_REVIEW"
    | "DONE";
  priority?:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";
  dueDate?: string | null;
  assigneeId?: string | null;
};

type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

export async function createTask(
  input: CreateTaskInput,
  userId: string,
  role: UserRole
) {
  const project =
    await prisma.project.findUnique({
      where: {
        id: input.projectId,
      },
    });

  if (!project) {
    throw new Error("Project not found");
  }

  if (
    role === "PROJECT_MANAGER" &&
    project.ownerId !== userId
  ) {
    throw new Error(
      "You can only create tasks in projects you own"
    );
  }

  if (input.assigneeId) {
    const assignee =
      await prisma.user.findUnique({
        where: {
          id: input.assigneeId,
        },
      });

    if (!assignee) {
      throw new Error(
        "Assignee not found"
      );
    }

    if (assignee.role !== "DEVELOPER") {
      throw new Error(
        "Tasks can only be assigned to developers"
      );
    }
  }

  return prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate
        ? new Date(input.dueDate)
        : undefined,
      projectId: input.projectId,
      assigneeId: input.assigneeId,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function getTasks(
  userId: string,
  role: UserRole
) {
  const where =
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

  return prisma.task.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getTaskById(
  taskId: string,
  userId: string,
  role: UserRole
) {
  const task =
    await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

  if (!task) {
    return null;
  }

  if (
    role === "PROJECT_MANAGER" &&
    task.project.ownerId !== userId
  ) {
    throw new Error(
      "You can only access tasks in projects you own"
    );
  }

  if (
    role === "DEVELOPER" &&
    task.assigneeId !== userId
  ) {
    throw new Error(
      "You can only access tasks assigned to you"
    );
  }

  return task;
}

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
  userId: string,
  role: UserRole
) {
  const task =
    await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: true,
      },
    });

  if (!task) {
    throw new Error("Task not found");
  }

  if (
    role === "PROJECT_MANAGER" &&
    task.project.ownerId !== userId
  ) {
    throw new Error(
      "You can only update tasks in projects you own"
    );
  }

  if (
    role === "DEVELOPER" &&
    task.assigneeId !== userId
  ) {
    throw new Error(
      "You can only update tasks assigned to you"
    );
  }

  /*
   * Developers can update their own task's work fields,
   * but cannot assign/reassign tasks.
   */
  if (
    role === "DEVELOPER" &&
    input.assigneeId !== undefined
  ) {
    throw new Error(
      "Developers cannot change task assignment"
    );
  }

  if (
    role !== "DEVELOPER" &&
    input.assigneeId !== undefined &&
    input.assigneeId !== null
  ) {
    const assignee =
      await prisma.user.findUnique({
        where: {
          id: input.assigneeId,
        },
      });

    if (!assignee) {
      throw new Error(
        "Assignee not found"
      );
    }

    if (assignee.role !== "DEVELOPER") {
      throw new Error(
        "Tasks can only be assigned to developers"
      );
    }
  }

  return prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate:
        input.dueDate === undefined
          ? undefined
          : input.dueDate === null
            ? null
            : new Date(input.dueDate),
      assigneeId:
        role === "DEVELOPER"
          ? undefined
          : input.assigneeId,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function deleteTask(
  taskId: string,
  userId: string,
  role: UserRole
) {
  const task =
    await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: true,
      },
    });

  if (!task) {
    throw new Error("Task not found");
  }

  if (
    role === "PROJECT_MANAGER" &&
    task.project.ownerId !== userId
  ) {
    throw new Error(
      "You can only delete tasks in projects you own"
    );
  }

  if (role === "DEVELOPER") {
    throw new Error(
      "Developers cannot delete tasks"
    );
  }

  return prisma.task.delete({
    where: {
      id: taskId,
    },
  });
}