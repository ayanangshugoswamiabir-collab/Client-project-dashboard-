import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Task title must be at least 2 characters")
    .max(200, "Task title must be at most 200 characters"),

  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional(),

  status: z
    .enum([
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "DONE",
    ])
    .default("TODO"),

  priority: z
    .enum([
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ])
    .default("MEDIUM"),

  dueDate: z
    .string()
    .datetime("Invalid due date")
    .optional(),

  projectId: z
    .string()
    .uuid("Invalid project ID"),

  assigneeId: z
    .string()
    .uuid("Invalid assignee ID")
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(2)
    .max(200)
    .optional(),

  description: z
    .string()
    .max(2000)
    .nullable()
    .optional(),

  status: z
    .enum([
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "DONE",
    ])
    .optional(),

  priority: z
    .enum([
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ])
    .optional(),

  dueDate: z
    .string()
    .datetime("Invalid due date")
    .nullable()
    .optional(),

  assigneeId: z
    .string()
    .uuid("Invalid assignee ID")
    .nullable()
    .optional(),
});