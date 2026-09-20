import type { Request, Response } from "express";

import {
  createComment,
  getTaskComments,
} from "../services/comment.service";

import { createActivity } from "../services/activity.service";

import type { AuthenticatedRequest } from "../middleware/auth";

export async function createCommentController(
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

    const comment = await createComment(
      req.body,
      user.userId,
      user.role
    );

    await createActivity({
      type: "COMMENT_ADDED",
      message: `A comment was added to task`,
      userId: user.userId,
      taskId: comment.taskId,
      metadata: {
        commentId: comment.id,
      },
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create comment";

    const statusCode =
      message.includes("only comment")
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

export async function getTaskCommentsController(
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

    const taskId = String(req.params.taskId);

    const comments = await getTaskComments(
      taskId,
      user.userId,
      user.role
    );

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch comments";

    const statusCode =
      message.includes("only access")
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