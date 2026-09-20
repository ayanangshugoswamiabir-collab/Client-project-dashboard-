export type Role =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "COMPLETED"
  | "ARCHIVED";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE";

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  _count?: {
    tasks: number;
  };
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    ownerId: string;
  };
  assignee?: User | null;
  _count?: {
    comments: number;
  };
};

export type Comment = {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: User;
};

export type ActivityType =
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

export type Activity = {
  id: string;
  type: ActivityType;
  message: string;
  metadata?: Record<string, unknown> | null;
  userId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: string;
  user?: User | null;
  project?: {
    id: string;
    name: string;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  createdAt: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: {
    message: string;
    details?: unknown;
  };
};