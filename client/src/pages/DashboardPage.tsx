import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../services/api";
import { usePresence } from "../hooks/usePresence";
import { useActivities } from "../hooks/useActivities";
import { useAuth } from "../context/useAuth";

type DashboardStats = {
  projects: number;
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    inReview: number;
    completed: number;
    overdue: number;
  };
};

type StatCardProps = {
  title: string;
  value: number;
};

type StatusItemProps = {
  label: string;
  value: number;
};

function StatCard({
  title,
  value,
}: StatCardProps) {
  return (
    <div
      style={{
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        backgroundColor: "#fff",
      }}
    >
      <p
        style={{
          margin: "0 0 10px",
          color: "#666",
          fontSize: "14px",
          fontWeight: "600",
        }}
      >
        {title}
      </p>

      <h2
        style={{
          margin: 0,
          fontSize: "32px",
          lineHeight: 1,
        }}
      >
        {value}
      </h2>
    </div>
  );
}

function StatusItem({
  label,
  value,
}: StatusItemProps) {
  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid #eee",
        borderRadius: "8px",
        backgroundColor: "#fafafa",
      }}
    >
      <div
        style={{
          color: "#666",
          fontSize: "14px",
        }}
      >
        {label}
      </div>

      <strong
        style={{
          display: "block",
          marginTop: "6px",
          fontSize: "24px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const onlineCount = usePresence();

  const {
    activities,
    loading: activitiesLoading,
  } = useActivities();

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/dashboard/stats"
        );

        setStats(response.data.data);
      } catch (error) {
        console.error(
          "Failed to load dashboard statistics:",
          error
        );

        setError(
          "Failed to load dashboard statistics."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboardStats();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      setLoggingOut(false);
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
          backgroundColor: "#f7f7f7",
        }}
      >
        <p>Loading dashboard...</p>
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
        backgroundColor: "#f7f7f7",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 12px",
              }}
            >
              Client Project Dashboard
            </h1>

            <p
              style={{
                margin: "6px 0",
                color: "#444",
              }}
            >
              Welcome,{" "}
              <strong>
                {user?.name}
              </strong>
            </p>

            <p
              style={{
                margin: "6px 0",
                color: "#444",
              }}
            >
              Role:{" "}
              <strong>
                {user?.role}
              </strong>
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
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
                backgroundColor: "#fff",
                fontWeight: "600",
              }}
            >
              Projects
            </Link>

            <Link
              to="/tasks"
              style={{
                textDecoration: "none",
                padding: "10px 16px",
                border: "1px solid #222",
                borderRadius: "8px",
                color: "#222",
                backgroundColor: "#fff",
                fontWeight: "600",
              }}
            >
              Tasks
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                padding: "10px 18px",
                border: "1px solid #222",
                borderRadius: "8px",
                backgroundColor: "#222",
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loggingOut
                  ? "not-allowed"
                  : "pointer",
                minWidth: "90px",
                opacity: loggingOut
                  ? 0.7
                  : 1,
              }}
            >
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
          </div>
        </header>

        {error && (
          <section
            style={{
              marginBottom: "24px",
              padding: "16px",
              border: "1px solid #f0b4b4",
              borderRadius: "10px",
              backgroundColor: "#fff5f5",
            }}
          >
            <strong>
              {error}
            </strong>
          </section>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <StatCard
            title="Projects"
            value={
              stats?.projects ?? 0
            }
          />

          <StatCard
            title="Total Tasks"
            value={
              stats?.tasks.total ?? 0
            }
          />

          <StatCard
            title="Completed"
            value={
              stats?.tasks.completed ?? 0
            }
          />

          <StatCard
            title="Overdue"
            value={
              stats?.tasks.overdue ?? 0
            }
          />
        </section>

        <section
          style={{
            marginTop: "24px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            backgroundColor: "#fff",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Task Status
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "12px",
            }}
          >
            <StatusItem
              label="Todo"
              value={
                stats?.tasks.todo ?? 0
              }
            />

            <StatusItem
              label="In Progress"
              value={
                stats?.tasks.inProgress ?? 0
              }
            />

            <StatusItem
              label="In Review"
              value={
                stats?.tasks.inReview ?? 0
              }
            />

            <StatusItem
              label="Done"
              value={
                stats?.tasks.completed ?? 0
              }
            />
          </div>
        </section>

        <section
          style={{
            marginTop: "24px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            backgroundColor: "#fff",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Realtime Status
          </h2>

          <p>
            🟢 Realtime Connected
          </p>

          <p
            style={{
              marginBottom: 0,
            }}
          >
            👥 Online users:{" "}
            <strong>
              {onlineCount}
            </strong>
          </p>
        </section>

        <section
          style={{
            marginTop: "24px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            backgroundColor: "#fff",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Recent Activity
          </h2>

          {activitiesLoading ? (
            <p>
              Loading activities...
            </p>
          ) : activities.length === 0 ? (
            <p>
              No activity yet.
            </p>
          ) : (
            <div>
              {activities.map(
                (activity) => (
                  <article
                    key={activity.id}
                    style={{
                      padding: "12px 0",
                      borderBottom:
                        "1px solid #eee",
                    }}
                  >
                    <strong>
                      {activity.message}
                    </strong>

                    {activity.user && (
                      <div>
                        User:{" "}
                        {activity.user.name}
                      </div>
                    )}

                    {activity.project && (
                      <div>
                        Project:{" "}
                        {
                          activity
                            .project
                            .name
                        }
                      </div>
                    )}

                    {activity.task && (
                      <div>
                        Task:{" "}
                        {
                          activity
                            .task
                            .title
                        }
                      </div>
                    )}

                    <small
                      style={{
                        display: "block",
                        marginTop: "6px",
                        color: "#777",
                      }}
                    >
                      {new Date(
                        activity.createdAt
                      ).toLocaleString()}
                    </small>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}