import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import { api } from "../services/api";
import type {
  ProjectStatus,
  Task,
  TaskPriority,
  TaskStatus,
} from "../types";

type ProjectDetails = {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  tasks: Task[];
};

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] =
    useState<ProjectDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProject() {
      if (!id) {
        setError("Project ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        const response = await api.get(
          `/projects/${id}`
        );

        setProject(response.data.data);
      } catch (error: unknown) {
        console.error(
          "Failed to load project:",
          error
        );

        const message =
          error &&
          typeof error === "object" &&
          "response" in error
            ? String(
                (
                  error as {
                    response?: {
                      data?: {
                        error?: {
                          message?: string;
                        };
                      };
                    };
                  }
                ).response?.data?.error?.message ||
                  "Failed to load project."
              )
            : "Failed to load project.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadProject();
  }, [id]);

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
        <p>Loading project...</p>
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
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <Link
          to="/projects"
          style={{
            textDecoration: "none",
            color: "#222",
            fontWeight: "600",
          }}
        >
          ← Back to Projects
        </Link>

        <section
          style={{
            marginTop: "24px",
            padding: "20px",
            border: "1px solid #f0b4b4",
            borderRadius: "12px",
          }}
        >
          <h1>Unable to load project</h1>

          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!project) {
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
        <h1>Project not found</h1>

        <Link
          to="/projects"
          style={{
            textDecoration: "none",
            color: "#222",
            fontWeight: "600",
          }}
        >
          ← Back to Projects
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
          marginBottom: "24px",
        }}
      >
        <Link
          to="/projects"
          style={{
            textDecoration: "none",
            padding: "10px 16px",
            border: "1px solid #222",
            borderRadius: "8px",
            color: "#222",
            fontWeight: "600",
          }}
        >
          ← Back to Projects
        </Link>
      </header>

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
              {project.name}
            </h1>

            <p
              style={{
                margin: 0,
              }}
            >
              {project.description ||
                "No description provided."}
            </p>
          </div>

          <StatusBadge
            status={project.status}
          />
        </div>

        <div
          style={{
            marginTop: "24px",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <InfoCard
            label="Owner"
            value={
              project.owner?.name ||
              "Unknown"
            }
          />

          <InfoCard
            label="Owner Email"
            value={
              project.owner?.email ||
              "Unknown"
            }
          />

          <InfoCard
            label="Tasks"
            value={String(
              project.tasks.length
            )}
          />

          <InfoCard
            label="Created"
            value={new Date(
              project.createdAt
            ).toLocaleDateString()}
          />
        </div>
      </section>

      <section
        style={{
          marginTop: "24px",
        }}
      >
        <h2>Project Tasks</h2>

        {project.tasks.length === 0 ? (
          <div
            style={{
              padding: "24px",
              border: "1px solid #ddd",
              borderRadius: "12px",
            }}
          >
            <p>
              This project currently has no
              tasks.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {project.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

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
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 8px",
            }}
          >
            {task.title}
          </h3>

          <p
            style={{
              margin: 0,
            }}
          >
            {task.description ||
              "No description provided."}
          </p>
        </div>

        <TaskStatusBadge
          status={task.status}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginTop: "20px",
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
    </article>
  );
}

type StatusBadgeProps = {
  status: ProjectStatus;
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
      {formatProjectStatus(status)}
    </span>
  );
}

type TaskStatusBadgeProps = {
  status: TaskStatus;
};

function TaskStatusBadge({
  status,
}: TaskStatusBadgeProps) {
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
      {formatTaskStatus(status)}
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

function formatProjectStatus(
  status: ProjectStatus
) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatTaskStatus(
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