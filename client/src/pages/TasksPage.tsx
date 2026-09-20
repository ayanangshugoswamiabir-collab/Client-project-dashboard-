
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../services/api";
import { useAuth } from "../context/useAuth";
import type {
  Project,
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
  projectId: string;
  assigneeId: string;
};

const initialFormData: TaskFormData = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: "",
  projectId: "",
  assigneeId: "",
};

export default function TasksPage() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [formData, setFormData] =
    useState<TaskFormData>(initialFormData);

  const canCreateTask =
    user?.role === "ADMIN" ||
    user?.role === "PROJECT_MANAGER";

  useEffect(() => {
    async function loadTasks() {
      try {
        setError("");

        const response = await api.get("/tasks");

        setTasks(response.data.data);
      } catch (error: unknown) {
        console.error(
          "Failed to load tasks:",
          error
        );

        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    }

    void loadTasks();
  }, []);

  useEffect(() => {
    if (!canCreateTask) {
      return;
    }

    async function loadCreateFormData() {
      try {
        setFormError("");

        const [
          projectsResponse,
          developersResponse,
        ] = await Promise.all([
          api.get("/projects"),
          api.get("/users/developers"),
        ]);

        setProjects(
          projectsResponse.data.data
        );

        setDevelopers(
          developersResponse.data.data
        );
      } catch (error: unknown) {
        console.error(
          "Failed to load task form data:",
          error
        );

        setFormError(
          "Failed to load projects or developers."
        );
      }
    }

    void loadCreateFormData();
  }, [canCreateTask]);

  function updateFormField(
    field: keyof TaskFormData,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setFormData(initialFormData);
    setFormError("");
  }

  async function handleCreateTask(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!formData.title.trim()) {
      setFormError("Task title is required.");
      return;
    }

    if (!formData.projectId) {
      setFormError("Please select a project.");
      return;
    }

    try {
      setFormLoading(true);
      setFormError("");

      const response = await api.post("/tasks", {
        title: formData.title.trim(),
        description:
          formData.description.trim() || undefined,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate
          ? new Date(
              `${formData.dueDate}T00:00:00`
            ).toISOString()
          : undefined,
        projectId: formData.projectId,
        assigneeId:
          formData.assigneeId || undefined,
      });

      const createdTask: Task =
        response.data.data;

      setTasks((current) => [
        createdTask,
        ...current,
      ]);

      resetForm();
      setShowCreateForm(false);
    } catch (error: unknown) {
      console.error(
        "Failed to create task:",
        error
      );

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

        setFormError(
          response?.data?.error?.message ||
            "Failed to create task."
        );
      } else {
        setFormError(
          "Failed to create task."
        );
      }
    } finally {
      setFormLoading(false);
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
        <p>Loading tasks...</p>
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
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 8px",
            }}
          >
            Tasks
          </h1>

          <p
            style={{
              margin: 0,
            }}
          >
            View and manage tasks available to you.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {canCreateTask && (
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(
                  (current) => !current
                );
                setFormError("");
              }}
              style={{
                padding: "10px 16px",
                border: "1px solid #222",
                borderRadius: "8px",
                color: "#fff",
                backgroundColor: "#222",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {showCreateForm
                ? "Cancel"
                : "Create Task"}
            </button>
          )}

          <Link
            to="/"
            style={{
              textDecoration: "none",
              padding: "10px 16px",
              border: "1px solid #222",
              borderRadius: "8px",
              color: "#222",
              fontWeight: "600",
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      {showCreateForm && canCreateTask && (
        <section
          style={{
            marginBottom: "32px",
            padding: "24px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "20px",
            }}
          >
            Create Task
          </h2>

          {formError && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                border: "1px solid #f0b4b4",
                borderRadius: "8px",
              }}
            >
              {formError}
            </div>
          )}

          <form
            onSubmit={handleCreateTask}
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
                placeholder="Enter task title"
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
                rows={4}
                placeholder="Enter task description"
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
                <strong>Project</strong>

                <select
                  value={formData.projectId}
                  onChange={(event) =>
                    updateFormField(
                      "projectId",
                      event.target.value
                    )
                  }
                  required
                  style={inputStyle}
                >
                  <option value="">
                    Select project
                  </option>

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

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

                  {developers.map((developer) => (
                    <option
                      key={developer.id}
                      value={developer.id}
                    >
                      {developer.name} —{" "}
                      {developer.email}
                    </option>
                  ))}
                </select>
              </label>

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
                      event.target.value as TaskStatus
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
                      event.target.value as TaskPriority
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
            </div>

            <div>
              <button
                type="submit"
                disabled={formLoading}
                style={{
                  padding: "10px 18px",
                  border: "1px solid #222",
                  borderRadius: "8px",
                  color: "#fff",
                  backgroundColor: "#222",
                  fontWeight: "600",
                  cursor: formLoading
                    ? "not-allowed"
                    : "pointer",
                  opacity: formLoading ? 0.7 : 1,
                }}
              >
                {formLoading
                  ? "Creating..."
                  : "Create Task"}
              </button>
            </div>
          </form>
        </section>
      )}

      {error && (
        <section
          style={{
            marginBottom: "24px",
            padding: "16px",
            border: "1px solid #f0b4b4",
            borderRadius: "10px",
          }}
        >
          <strong>{error}</strong>
        </section>
      )}

      {tasks.length === 0 ? (
        <section
          style={{
            padding: "32px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <h2>No tasks available</h2>

          <p>
            There are currently no tasks available
            for your account.
          </p>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
            />
          ))}
        </section>
      )}
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

type TaskCardProps = {
  task: Task;
};

function TaskCard({
  task,
}: TaskCardProps) {
  return (
    <article
      style={{
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <h2
          style={{
            margin: 0,
          }}
        >
          {task.title}
        </h2>

        <StatusBadge status={task.status} />
      </div>

      <p
        style={{
          marginTop: "16px",
        }}
      >
        {task.description ||
          "No description provided."}
      </p>

      <div
        style={{
          marginTop: "20px",
          display: "grid",
          gap: "10px",
          fontSize: "14px",
        }}
      >
        <div>
          <strong>Priority:</strong>{" "}
          {formatPriority(task.priority)}
        </div>

        <div>
          <strong>Assignee:</strong>{" "}
          {task.assignee?.name ||
            "Unassigned"}
        </div>

        <div>
          <strong>Due Date:</strong>{" "}
          {task.dueDate
            ? new Date(
                task.dueDate
              ).toLocaleDateString()
            : "No due date"}
        </div>

        <div>
          <strong>Comments:</strong>{" "}
          {task._count?.comments ?? 0}
        </div>
      </div>

      <Link
        to={`/tasks/${task.id}`}
        style={{
          display: "inline-block",
          marginTop: "20px",
          textDecoration: "none",
          padding: "10px 14px",
          border: "1px solid #222",
          borderRadius: "8px",
          color: "#fff",
          backgroundColor: "#222",
          fontWeight: "600",
        }}
      >
        View Task
      </Link>
    </article>
  );
}

type StatusBadgeProps = {
  status: Task["status"];
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

function formatStatus(
  status: Task["status"]
) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatPriority(
  priority: Task["priority"]
) {
  return priority
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}
