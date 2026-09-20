
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { api } from "../services/api";
import { useAuth } from "../context/useAuth";
import type {
  Comment,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from "../types";

type TaskFormData = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
};

export default function TaskDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] =
    useState<Task | null>(null);

  const [comments, setComments] =
    useState<Comment[]>([]);

  const [developers, setDevelopers] =
    useState<User[]>([]);

  const [commentText, setCommentText] =
    useState("");

  const [commentLoading, setCommentLoading] =
    useState(false);

  const [commentError, setCommentError] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editLoading, setEditLoading] =
    useState(false);
  const [editError, setEditError] =
    useState("");

  const [deleting, setDeleting] =
    useState(false);
  const [deleteError, setDeleteError] =
    useState("");

  const [formData, setFormData] =
    useState<TaskFormData>({
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "",
      assigneeId: "",
    });

  const canEditTask =
    user?.role === "ADMIN" ||
    user?.role === "PROJECT_MANAGER" ||
    user?.role === "DEVELOPER";

  const canChangeAssignee =
    user?.role === "ADMIN" ||
    user?.role === "PROJECT_MANAGER";

  const canDeleteTask =
    user?.role === "ADMIN" ||
    user?.role === "PROJECT_MANAGER";

  useEffect(() => {
    async function loadTask() {
      if (!id) {
        setError("Task ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        const response = await api.get(
          `/tasks/${id}`
        );

        const data = response.data.data as Task & {
          comments?: Comment[];
        };

        setTask(data);
        setComments(data.comments ?? []);

        setFormData({
          title: data.title,
          description:
            data.description ?? "",
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate
            ? data.dueDate.slice(0, 10)
            : "",
          assigneeId:
            data.assigneeId ?? "",
        });
      } catch (error: unknown) {
        console.error(
          "Failed to load task:",
          error
        );

        const message =
          getApiErrorMessage(
            error,
            "Failed to load task."
          );

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadTask();
  }, [id]);

  useEffect(() => {
    if (!canChangeAssignee) {
      return;
    }

    async function loadDevelopers() {
      try {
        const response = await api.get(
          "/users/developers"
        );

        setDevelopers(
          response.data.data as User[]
        );
      } catch (error: unknown) {
        console.error(
          "Failed to load developers:",
          error
        );

        setEditError(
          "Failed to load developers."
        );
      }
    }

    void loadDevelopers();
  }, [canChangeAssignee]);

  function updateFormField(
    field: keyof TaskFormData,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEditing() {
    if (!task) {
      return;
    }

    setFormData({
      title: task.title,
      description:
        task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
        ? task.dueDate.slice(0, 10)
        : "",
      assigneeId:
        task.assigneeId ?? "",
    });

    setEditError("");
    setDeleteError("");
    setEditing(true);
  }

  function cancelEditing() {
    if (!task) {
      return;
    }

    setFormData({
      title: task.title,
      description:
        task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
        ? task.dueDate.slice(0, 10)
        : "",
      assigneeId:
        task.assigneeId ?? "",
    });

    setEditError("");
    setEditing(false);
  }

  async function handleUpdateTask(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id || !task) {
      setEditError("Task ID is missing.");
      return;
    }

    if (!formData.title.trim()) {
      setEditError(
        "Task title is required."
      );
      return;
    }

    try {
      setEditLoading(true);
      setEditError("");

      const updateData: {
        title: string;
        description: string | null;
        status: TaskStatus;
        priority: TaskPriority;
        dueDate: string | null;
        assigneeId?: string | null;
      } = {
        title: formData.title.trim(),
        description:
          formData.description.trim() ||
          null,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate
          ? new Date(
              `${formData.dueDate}T00:00:00`
            ).toISOString()
          : null,
      };

      if (canChangeAssignee) {
        updateData.assigneeId =
          formData.assigneeId || null;
      }

      const response = await api.patch(
        `/tasks/${id}`,
        updateData
      );

      const updatedTask =
        response.data.data as Task;

      setTask((current) => {
        if (!current) {
          return updatedTask;
        }

        return {
          ...current,
          ...updatedTask,
        };
      });

      setFormData({
        title: updatedTask.title,
        description:
          updatedTask.description ?? "",
        status: updatedTask.status,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate
          ? updatedTask.dueDate.slice(0, 10)
          : "",
        assigneeId:
          updatedTask.assigneeId ?? "",
      });

      setEditing(false);
    } catch (error: unknown) {
      console.error(
        "Failed to update task:",
        error
      );

      setEditError(
        getApiErrorMessage(
          error,
          "Failed to update task."
        )
      );
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteTask() {
    if (!id || !task) {
      setDeleteError("Task ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      await api.delete(`/tasks/${id}`);

      navigate("/tasks");
    } catch (error: unknown) {
      console.error(
        "Failed to delete task:",
        error
      );

      setDeleteError(
        getApiErrorMessage(
          error,
          "Failed to delete task."
        )
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddComment() {
    if (!id) {
      setCommentError(
        "Task ID is missing."
      );
      return;
    }

    const content = commentText.trim();

    if (!content) {
      setCommentError(
        "Comment cannot be empty."
      );
      return;
    }

    try {
      setCommentLoading(true);
      setCommentError("");

      const response = await api.post(
        "/comments",
        {
          content,
          taskId: id,
        }
      );

      const newComment =
        response.data.data as Comment;

      setComments((current) => [
        ...current,
        newComment,
      ]);

      setCommentText("");
    } catch (error: unknown) {
      console.error(
        "Failed to add comment:",
        error
      );

      setCommentError(
        getApiErrorMessage(
          error,
          "Failed to add comment."
        )
      );
    } finally {
      setCommentLoading(false);
    }
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p>Loading task...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "32px",
          boxSizing: "border-box",
          fontFamily: "Arial, sans-serif",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <Link
          to="/tasks"
          style={{
            textDecoration: "none",
            color: "#222",
            fontWeight: "600",
          }}
        >
          ← Back to Tasks
        </Link>

        <section
          style={{
            marginTop: "24px",
            padding: "20px",
            border: "1px solid #f0b4b4",
            borderRadius: "12px",
          }}
        >
          <h1>Unable to load task</h1>

          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!task) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "32px",
          boxSizing: "border-box",
          fontFamily: "Arial, sans-serif",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <h1>Task not found</h1>

        <Link
          to="/tasks"
          style={{
            textDecoration: "none",
            color: "#222",
            fontWeight: "600",
          }}
        >
          ← Back to Tasks
        </Link>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <Link
          to="/tasks"
          style={{
            textDecoration: "none",
            padding: "10px 16px",
            border: "1px solid #222",
            borderRadius: "8px",
            color: "#222",
            fontWeight: "600",
          }}
        >
          ← Back to Tasks
        </Link>

        {!editing && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {canEditTask && (
              <button
                type="button"
                onClick={startEditing}
                disabled={deleting}
                style={{
                  ...primaryButtonStyle,
                  opacity: deleting ? 0.7 : 1,
                  cursor: deleting
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Edit Task
              </button>
            )}

            {canDeleteTask && (
              <button
                type="button"
                onClick={() =>
                  void handleDeleteTask()
                }
                disabled={deleting}
                style={{
                  ...deleteButtonStyle,
                  opacity: deleting ? 0.7 : 1,
                  cursor: deleting
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Task"}
              </button>
            )}
          </div>
        )}
      </header>

      {deleteError && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px",
            border: "1px solid #f0b4b4",
            borderRadius: "8px",
            color: "#b42318",
          }}
        >
          {deleteError}
        </div>
      )}

      {editing ? (
        <section
          style={{
            padding: "24px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              marginBottom: "20px",
            }}
          >
            Edit Task
          </h1>

          {editError && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                border: "1px solid #f0b4b4",
                borderRadius: "8px",
                color: "#b42318",
              }}
            >
              {editError}
            </div>
          )}

          <form
            onSubmit={handleUpdateTask}
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            <label
              style={{
                display: "grid",
                gap: "6px",
              }}
            >
              <strong>Title</strong>

              <input
                type="text"
                value={formData.title}
                onChange={(event) =>
                  updateFormField(
                    "title",
                    event.target.value
                  )
                }
                maxLength={200}
                required
                style={inputStyle}
              />
            </label>

            <label
              style={{
                display: "grid",
                gap: "6px",
              }}
            >
              <strong>Description</strong>

              <textarea
                value={formData.description}
                onChange={(event) =>
                  updateFormField(
                    "description",
                    event.target.value
                  )
                }
                maxLength={2000}
                rows={5}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <label
                style={{
                  display: "grid",
                  gap: "6px",
                }}
              >
                <strong>Status</strong>

                <select
                  value={formData.status}
                  onChange={(event) =>
                    updateFormField(
                      "status",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="TODO">
                    To Do
                  </option>

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="IN_REVIEW">
                    In Review
                  </option>

                  <option value="DONE">
                    Done
                  </option>
                </select>
              </label>

              <label
                style={{
                  display: "grid",
                  gap: "6px",
                }}
              >
                <strong>Priority</strong>

                <select
                  value={formData.priority}
                  onChange={(event) =>
                    updateFormField(
                      "priority",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="LOW">
                    Low
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HIGH">
                    High
                  </option>

                  <option value="URGENT">
                    Urgent
                  </option>
                </select>
              </label>

              <label
                style={{
                  display: "grid",
                  gap: "6px",
                }}
              >
                <strong>Due Date</strong>

                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(event) =>
                    updateFormField(
                      "dueDate",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </label>

              {canChangeAssignee && (
                <label
                  style={{
                    display: "grid",
                    gap: "6px",
                  }}
                >
                  <strong>Assignee</strong>

                  <select
                    value={formData.assigneeId}
                    onChange={(event) =>
                      updateFormField(
                        "assigneeId",
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {developers.map(
                      (developer) => (
                        <option
                          key={developer.id}
                          value={developer.id}
                        >
                          {developer.name} —{" "}
                          {developer.email}
                        </option>
                      )
                    )}
                  </select>
                </label>
              )}
            </div>

            {!canChangeAssignee && (
              <div
                style={{
                  padding: "12px",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                <strong>Assignee:</strong>{" "}
                {task.assignee?.name ||
                  "Unassigned"}

                <div
                  style={{
                    marginTop: "4px",
                    color: "#666",
                  }}
                >
                  Developers cannot change task
                  assignment.
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                disabled={editLoading}
                style={{
                  ...primaryButtonStyle,
                  opacity: editLoading
                    ? 0.7
                    : 1,
                  cursor: editLoading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {editLoading
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={cancelEditing}
                disabled={editLoading}
                style={{
                  padding: "10px 16px",
                  border: "1px solid #222",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  color: "#222",
                  fontWeight: "600",
                  cursor: editLoading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <section
            style={{
              padding: "24px",
              border: "1px solid #ddd",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1
                  style={{
                    margin: "0 0 12px",
                  }}
                >
                  {task.title}
                </h1>

                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {task.description ||
                    "No description provided."}
                </p>
              </div>

              <StatusBadge
                status={task.status}
              />
            </div>

            <div
              style={{
                marginTop: "28px",
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <InfoCard
                label="Priority"
                value={formatPriority(
                  task.priority
                )}
              />

              <InfoCard
                label="Status"
                value={formatStatus(
                  task.status
                )}
              />

              <InfoCard
                label="Assignee"
                value={
                  task.assignee?.name ||
                  "Unassigned"
                }
              />

              <InfoCard
                label="Assignee Email"
                value={
                  task.assignee?.email ||
                  "Not assigned"
                }
              />

              <InfoCard
                label="Due Date"
                value={
                  task.dueDate
                    ? new Date(
                        task.dueDate
                      ).toLocaleDateString()
                    : "No due date"
                }
              />

              <InfoCard
                label="Comments"
                value={String(
                  comments.length
                )}
              />

              <InfoCard
                label="Created"
                value={new Date(
                  task.createdAt
                ).toLocaleDateString()}
              />

              <InfoCard
                label="Last Updated"
                value={new Date(
                  task.updatedAt
                ).toLocaleDateString()}
              />
            </div>
          </section>

          <section
            style={{
              marginTop: "24px",
              padding: "24px",
              border: "1px solid #ddd",
              borderRadius: "12px",
            }}
          >
            <h2>Project</h2>

            {task.project ? (
              <>
                <p>
                  <strong>
                    {task.project.name}
                  </strong>
                </p>

                <Link
                  to={`/projects/${task.project.id}`}
                  style={{
                    display: "inline-block",
                    marginTop: "8px",
                    textDecoration: "none",
                    padding: "10px 14px",
                    border: "1px solid #222",
                    borderRadius: "8px",
                    color: "#fff",
                    backgroundColor: "#222",
                    fontWeight: "600",
                  }}
                >
                  View Project
                </Link>
              </>
            ) : (
              <p>
                Project information unavailable.
              </p>
            )}
          </section>
        </>
      )}

      <section
        style={{
          marginTop: "24px",
          padding: "24px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2>Comments</h2>

        <p>
          {comments.length} comment
          {comments.length === 1
            ? ""
            : "s"}{" "}
          on this task.
        </p>

        <div
          style={{
            marginTop: "20px",
          }}
        >
          <textarea
            value={commentText}
            onChange={(event) =>
              setCommentText(
                event.target.value
              )
            }
            placeholder="Write a comment..."
            maxLength={2000}
            rows={5}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              resize: "vertical",
              fontFamily:
                "Arial, sans-serif",
              fontSize: "14px",
            }}
          />

          <div
            style={{
              marginTop: "6px",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: "#666",
              }}
            >
              {commentText.length}/2000
            </span>

            <button
              type="button"
              onClick={() =>
                void handleAddComment()
              }
              disabled={commentLoading}
              style={{
                padding: "10px 16px",
                border: "1px solid #222",
                borderRadius: "8px",
                backgroundColor:
                  commentLoading
                    ? "#ddd"
                    : "#222",
                color:
                  commentLoading
                    ? "#666"
                    : "#fff",
                fontWeight: "600",
                cursor: commentLoading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {commentLoading
                ? "Adding..."
                : "Add Comment"}
            </button>
          </div>

          {commentError && (
            <p
              style={{
                marginTop: "12px",
                color: "#b42318",
              }}
            >
              {commentError}
            </p>
          )}
        </div>

        {comments.length === 0 ? (
          <p
            style={{
              marginTop: "24px",
              color: "#666",
            }}
          >
            No comments yet.
          </p>
        ) : (
          <div
            style={{
              marginTop: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {comments.map((comment) => (
              <article
                key={comment.id}
                style={{
                  padding: "16px",
                  border: "1px solid #eee",
                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>
                      {comment.author.name}
                    </strong>

                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "13px",
                        color: "#666",
                      }}
                    >
                      {formatRole(
                        comment.author.role
                      )}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "13px",
                      color: "#666",
                    }}
                  >
                    {new Date(
                      comment.createdAt
                    ).toLocaleString()}
                  </span>
                </div>

                <p
                  style={{
                    margin: "14px 0 0",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {comment.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "14px",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: "1px solid #222",
  borderRadius: "8px",
  backgroundColor: "#222",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
};

const deleteButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: "1px solid #b42318",
  borderRadius: "8px",
  backgroundColor: "#b42318",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
};

type StatusBadgeProps = {
  status: TaskStatus;
};

function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        border: "1px solid #ddd",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "600",
        whiteSpace: "nowrap",
      }}
    >
      {formatStatus(status)}
    </span>
  );
}

type InfoCardProps = {
  label: string;
  value: string;
};

function InfoCard({
  label,
  value,
}: InfoCardProps) {
  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid #eee",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>

      <strong>{value}</strong>
    </div>
  );
}

function formatStatus(
  status: TaskStatus
) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatPriority(
  priority: TaskPriority
) {
  return priority
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatRole(role: string) {
  return role
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getApiErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            error?: {
              message?: string;
            };
          };
        };
      }
    ).response;

    return (
      response?.data?.error?.message ||
      fallback
    );
  }

  return fallback;
}
