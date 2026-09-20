import type { Request, Response } from "express";

import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../services/project.service";

import { createActivity } from "../services/activity.service";

import type { AuthenticatedRequest } from "../middleware/auth";

export async function createProjectController(
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

    const project = await createProject({
      ...req.body,
      ownerId:
        user.role === "PROJECT_MANAGER"
          ? user.userId
          : req.body.ownerId,
    });

    const activity = await createActivity({
      type: "PROJECT_CREATED",
      message: `Project "${project.name}" was created`,
      userId: user.userId,
      projectId: project.id,
      metadata: {
        projectName: project.name,
        ownerId: project.ownerId,
      },
    });

    res.status(201).json({
      success: true,
      data: project,
      activity,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create project";

    res.status(400).json({
      success: false,
      error: { message },
    });
  }
}

export async function getProjectsController(
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

    const projects = await getProjects(
      user.userId,
      user.role
    );

    res.json({
      success: true,
      data: projects,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: { message: "Failed to fetch projects" },
    });
  }
}

export async function getProjectController(
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

    const projectId = String(req.params.id);

    const project = await getProjectById(
      projectId,
      user.userId,
      user.role
    );

    if (!project) {
      res.status(404).json({
        success: false,
        error: { message: "Project not found" },
      });
      return;
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch project";

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

export async function updateProjectController(
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

    const projectId = String(req.params.id);

    const project = await updateProject(
      projectId,
      req.body,
      user.userId,
      user.role
    );

    await createActivity({
      type: "PROJECT_UPDATED",
      message: `Project "${project.name}" was updated`,
      userId: user.userId,
      projectId: project.id,
      metadata: {
        projectName: project.name,
      },
    });

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update project";

    const statusCode =
      message.includes("only update projects you own")
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

export async function deleteProjectController(
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

    const projectId = String(req.params.id);

    const project = await getProjectById(
      projectId,
      user.userId,
      user.role
    );

    if (!project) {
      res.status(404).json({
        success: false,
        error: { message: "Project not found" },
      });
      return;
    }

    await deleteProject(
      projectId,
      user.userId,
      user.role
    );

    await createActivity({
      type: "PROJECT_UPDATED",
      message: `Project "${project.name}" was deleted`,
      userId: user.userId,
      projectId,
      metadata: {
        projectName: project.name,
        action: "DELETE",
      },
    });

    res.json({
      success: true,
      data: {
        message: "Project deleted successfully",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete project";

    const statusCode =
      message.includes("only delete projects you own") ||
      message.includes("only access projects")
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