import { useEffect, useState } from "react";

import { api } from "../services/api";
import { socket } from "../services/socket";

export type Activity = {
  id: string;
  type: string;
  message: string;
  createdAt: string;

  user?: {
    id: string;
    name: string;
    role: string;
  } | null;

  project?: {
    id: string;
    name: string;
  } | null;

  task?: {
    id: string;
    title: string;
  } | null;
};

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadActivities() {
      try {
        const response = await api.get("/activities");

        const data = response.data.data;

        if (mounted) {
          setActivities(data);
        }
      } catch (error) {
        console.error(
          "Failed to load activities:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadActivities();

    function handleNewActivity(
      activity: Activity
    ) {
      setActivities((current) => {
        const exists = current.some(
          (item) => item.id === activity.id
        );

        if (exists) {
          return current;
        }

        return [activity, ...current].slice(0, 50);
      });
    }

    socket.on(
      "activity:new",
      handleNewActivity
    );

    return () => {
      mounted = false;

      socket.off(
        "activity:new",
        handleNewActivity
      );
    };
  }, []);

  return {
    activities,
    loading,
  };
}