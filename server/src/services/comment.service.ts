import { prisma } from "../config/prisma";

type CreateCommentInput = {
  content: string;
  taskId: string;
};

export async function createComment(
  input: CreateCommentInput,
  authorId: string,
  role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER"
) {
  const task = await prisma.task.findUnique({
    where: { id: input.taskId },
    include: {
      project: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (
    role === "PROJECT_MANAGER" &&
    task.project.ownerId !== authorId
  ) {
    throw new Error(
      "You can only comment on tasks in projects you own"
    );
  }

  if (
    role === "DEVELOPER" &&
    task.assigneeId !== authorId
  ) {
    throw new Error(
      "You can only comment on tasks assigned to you"
    );
  }

  return prisma.comment.create({
    data: {
      content: input.content,
      taskId: input.taskId,
      authorId,
    },
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
  });
}

export async function getTaskComments(
  taskId: string,
  userId: string,
  role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER"
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
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
      "You can only access comments in projects you own"
    );
  }

  if (
    role === "DEVELOPER" &&
    task.assigneeId !== userId
  ) {
    throw new Error(
      "You can only access comments on tasks assigned to you"
    );
  }

  return prisma.comment.findMany({
    where: { taskId },
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
  });
}