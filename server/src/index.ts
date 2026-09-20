import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";
import taskRoutes from "./routes/task.routes";
import activityRoutes from "./routes/activity.routes";

import { initializeSocket } from "./realtime/socket";
import notificationRoutes from "./routes/notification.routes";
import { startOverdueTaskJob } from "./jobs/overdueTasks.job";
import commentRoutes from "./routes/comment.routes";
import presenceRoutes from "./routes/presence.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import userRoutes from "./routes/user.routes";


const app = express();

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/presence", presenceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);


app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Client Project Dashboard API is running",
  });
});

const httpServer = http.createServer(app);

initializeSocket(httpServer);

startOverdueTaskJob();

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready`);
});