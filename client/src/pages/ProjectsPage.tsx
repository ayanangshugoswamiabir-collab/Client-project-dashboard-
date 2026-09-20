import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../services/api";
import type { Project } from "../types";

export default function ProjectsPage() {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        setError("");

        const response = await api.get("/projects");

        setProjects(response.data.data);
      } catch (error) {
        console.error(
          "Failed to load projects:",
          error
        );

        setError("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    }

    void loadProjects();
  }, []);

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
        <p>Loading projects...</p>
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
            Projects
          </h1>

          <p
            style={{
              margin: 0,
            }}
          >
            View all projects available to you.
          </p>
        </div>

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
      </header>

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

      {projects.length === 0 ? (
        <section
          style={{
            padding: "32px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <h2>No projects available</h2>

          <p>
            There are currently no projects available
            for your account.
          </p>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {projects.map((project) => (
            <article
              key={project.id}
              style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  {project.name}
                </h2>

                <StatusBadge
                  status={project.status}
                />
              </div>

              <p
                style={{
                  marginTop: "16px",
                  minHeight: "48px",
                }}
              >
                {project.description ||
                  "No description provided."}
              </p>

              <div
                style={{
                  marginTop: "16px",
                  fontSize: "14px",
                  lineHeight: 1.7,
                }}
              >
                <div>
                  <strong>Owner:</strong>{" "}
                  {project.owner?.name ||
                    "Unknown"}
                </div>

                <div>
                  <strong>Tasks:</strong>{" "}
                  {project._count?.tasks ?? 0}
                </div>

                <div>
                  <strong>Created:</strong>{" "}
                  {new Date(
                    project.createdAt
                  ).toLocaleDateString()}
                </div>
              </div>

              <Link
                to={`/projects/${project.id}`}
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
                View Project
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

type StatusBadgeProps = {
  status: Project["status"];
};

function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 9px",
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
  status: Project["status"]
) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}