import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

import { verifyAccessToken } from "../utils/jwt";
import { getActivitiesSince } from "../services/activity.service";

let io: Server | null = null;

/*
 * Tracks currently connected sockets by user ID.
 * A user can have multiple browser tabs/devices connected.
 */
const onlineUsers = new Map<string, Set<string>>();

function broadcastPresence() {
  if (!io) {
    return;
  }

  io.emit("presence:update", {
    onlineCount: onlineUsers.size,
  });
}

export function initializeSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin:
        process.env.CLIENT_URL ||
        "http://localhost:5173",
      credentials: true,
    },

    transports: ["websocket"],
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error("Authentication required")
        );
      }

      const payload = verifyAccessToken(token);

      socket.data.user = payload;

      next();
    } catch {
      next(
        new Error("Invalid or expired access token")
      );
    }
  });

  io.on("connection", async (socket) => {
    console.log(
      `WebSocket connected: ${socket.id}`
    );

    const userId = socket.data.user.userId;

    /*
     * Add socket to the user's connection set.
     */
    const userSockets =
      onlineUsers.get(userId) ??
      new Set<string>();

    userSockets.add(socket.id);

    onlineUsers.set(userId, userSockets);

    socket.join(`user:${userId}`);

    socket.emit("connected", {
      message:
        "WebSocket connection established",
    });

    /*
     * Tell all connected clients about
     * the updated online count.
     */
    broadcastPresence();

    /*
     * Missed activity recovery.
     */
    socket.on(
      "activities:since",
      async (since: string) => {
        try {
          const timestamp = new Date(since);

          if (Number.isNaN(timestamp.getTime())) {
            socket.emit("activities:error", {
              message: "Invalid timestamp",
            });

            return;
          }

          const activities =
            await getActivitiesSince(timestamp);

          socket.emit(
            "activities:recovered",
            activities
          );
        } catch {
          socket.emit("activities:error", {
            message:
              "Failed to recover activities",
          });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log(
        `WebSocket disconnected: ${socket.id}`
      );

      const sockets =
        onlineUsers.get(userId);

      if (sockets) {
        sockets.delete(socket.id);

        /*
         * Remove the user completely once
         * their last connection disconnects.
         */
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }

      broadcastPresence();
    });
  });

  return io;
}

export function broadcastActivity(
  activity: unknown
) {
  if (!io) {
    return;
  }

  io.emit("activity:new", activity);
}

export function broadcastNotification(
  userId: string,
  notification: unknown
) {
  if (!io) {
    return;
  }

  io.to(`user:${userId}`).emit(
    "notification:new",
    notification
  );
}

export function getOnlineUserCount() {
  return onlineUsers.size;
}