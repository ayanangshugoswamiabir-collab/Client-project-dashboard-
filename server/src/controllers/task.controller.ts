
import type { Request, Response } from "express";

import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../services/task.service";

import { createActivity } from "../services/activity.service";

import type { AuthenticatedRequest } from "../middleware/auth";

export async function createTaskController(
  req: Request,
  res: Response
) {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const task = await createTask(
      req.body,
      user.userId,
      user.role
    );

    const activity = await createActivity({
      type: "TASK_CREATED",
      message: `Task "${task.title}" was created`,
      userId: user.userId,
      projectId: task.projectId,
      taskId: task.id,
      metadata: {
        taskTitle: task.title,
        assigneeId: task.assigneeId,
      },
    });

    res.status(201).json({
      success: true,
      data: task,
      activity,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create task";

    const statusCode =
      message.includes("only create tasks") ||
      message.includes("only be assigned")
        ? 403
        : message.includes("not found")
          ? 404
          : 400;

    res.status(statusCode).json({
      success: false,
      error: { message },
    });
  }
}

export async function getTasksController(
  req: Request,
  res: Response
) {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const tasks = await getTasks(
      user.userId,
      user.role
    );

    res.json({
      success: true,
      data: tasks,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: { message: "Failed to fetch tasks" },
    });
  }
}

export async function getTaskController(
  req: Request,
  res: Response
) {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const taskId = String(req.params.id);

    const task = await getTaskById(
      taskId,
      user.userId,
      user.role
    );

    if (!task) {
      res.status(404).json({
        success: false,
        error: { message: "Task not found" },
      });
      return;
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch task";

    const statusCode =
      message.includes("only access")
        ? 403
        : message.includes("not found")
          ? 404
          : 500;

    res.status(statusCode).json({
      success: false,
      error: { message },
    });
  }
}

export async function updateTaskController(
  req: Request,
  res: Response
) {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const taskId = String(req.params.id);

    // Get the existing task first so we can detect
    // status changes and assignment changes.
    const existingTask = await getTaskById(
      taskId,
      user.userId,
      user.role
    );

    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: { message: "Task not found" },
      });
      return;
    }

    const task = await updateTask(
      taskId,
      req.body,
      user.userId,
      user.role
    );

    await createActivity({
      type: "TASK_UPDATED",
      message: `Task "${task.title}" was updated`,
      userId: user.userId,
      projectId: task.projectId,
      taskId: task.id,
      metadata: {
        taskTitle: task.title,
      },
    });

    if (
      req.body.status !== undefined &&
      req.body.status !== existingTask.status
    ) {
      await createActivity({
        type: "TASK_STATUS_CHANGED",
        message: `Task "${task.title}" status changed from ${existingTask.status} to ${task.status}`,
        userId: user.userId,
        projectId: task.projectId,
        taskId: task.id,
        metadata: {
          previousStatus: existingTask.status,
          newStatus: task.status,
        },
      });
    }

    if (
      req.body.assigneeId !== undefined &&
      req.body.assigneeId !== existingTask.assigneeId
    ) {
      await createActivity({
        type: "TASK_ASSIGNED",
        message: `Task "${task.title}" was assigned to a developer`,
        userId: user.userId,
        projectId: task.projectId,
        taskId: task.id,
        metadata: {
          previousAssigneeId:
            existingTask.assigneeId,
          newAssigneeId: task.assigneeId,
        },
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update task";

    const statusCode =
      message.includes("only update") ||
      message.includes("only be assigned") ||
      message.includes("cannot change task assignment")
        ? 403
        : message.includes("not found")
          ? 404
          : 400;

    res.status(statusCode).json({
      success: false,
      error: { message },
    });
  }
}

export async function deleteTaskController(
  req: Request,
  res: Response
) {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const taskId = String(req.params.id);

    const existingTask = await getTaskById(
      taskId,
      user.userId,
      user.role
    );

    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: { message: "Task not found" },
      });
      return;
    }

    await deleteTask(
      taskId,
      user.userId,
      user.role
    );

    await createActivity({
      type: "TASK_UPDATED",
      message: `Task "${existingTask.title}" was deleted`,
      userId: user.userId,
      projectId: existingTask.projectId,
      metadata: {
        taskId: existingTask.id,
        taskTitle: existingTask.title,
        action: "DELETE",
      },
    });

    res.json({
      success: true,
      data: {
        message: "Task deleted successfully",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete task";

    const statusCode =
      message.includes("only delete") ||
      message.includes("cannot delete tasks")
        ? 403
        : message.includes("not found")
          ? 404
          : 400;

    res.status(statusCode).json({
      success: false,
      error: { message },
    });
  }
}
