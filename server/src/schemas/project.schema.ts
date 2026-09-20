import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must be at most 100 characters"),

  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),

  status: z
    .enum([
      "PLANNING",
      "ACTIVE",
      "COMPLETED",
      "ARCHIVED",
    ])
    .default("PLANNING"),

  ownerId: z
    .string()
    .uuid("Invalid owner ID")
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must be at most 100 characters")
    .optional(),

  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .nullable()
    .optional(),

  status: z
    .enum([
      "PLANNING",
      "ACTIVE",
      "COMPLETED",
      "ARCHIVED",
    ])
    .optional(),

  ownerId: z
    .string()
    .uuid("Invalid owner ID")
    .optional(),
});