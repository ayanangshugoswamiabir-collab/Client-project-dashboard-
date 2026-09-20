import "dotenv/config";

import bcrypt from "bcryptjs";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting database seed...");

  /*
   * Passwords used by the assessment/demo accounts.
   */
  const adminPassword = await bcrypt.hash(
    "Admin@12345",
    12
  );

  const pmPassword = await bcrypt.hash(
    "PM@12345",
    12
  );

  const developerPassword = await bcrypt.hash(
    "Dev@12345",
    12
  );

  /*
   * 1 Admin
   */
  const admin = await prisma.user.upsert({
    where: {
      email: "admin@example.com",
    },
    update: {
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
    create: {
      name: "Admin User",
      email: "admin@example.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  /*
   * 2 Project Managers
   */
  const pm1 = await prisma.user.upsert({
    where: {
      email: "pm1@example.com",
    },
    update: {
      name: "Project Manager One",
      passwordHash: pmPassword,
      role: "PROJECT_MANAGER",
    },
    create: {
      name: "Project Manager One",
      email: "pm1@example.com",
      passwordHash: pmPassword,
      role: "PROJECT_MANAGER",
    },
  });

  const pm2 = await prisma.user.upsert({
    where: {
      email: "pm2@example.com",
    },
    update: {
      name: "Project Manager Two",
      passwordHash: pmPassword,
      role: "PROJECT_MANAGER",
    },
    create: {
      name: "Project Manager Two",
      email: "pm2@example.com",
      passwordHash: pmPassword,
      role: "PROJECT_MANAGER",
    },
  });

  /*
   * 4 Developers
   */
  const developers = await Promise.all([
    prisma.user.upsert({
      where: {
        email: "dev1@example.com",
      },
      update: {
        name: "Developer One",
        passwordHash: developerPassword,
        role: "DEVELOPER",
      },
      create: {
        name: "Developer One",
        email: "dev1@example.com",
        passwordHash: developerPassword,
        role: "DEVELOPER",
      },
    }),

    prisma.user.upsert({
      where: {
        email: "dev2@example.com",
      },
      update: {
        name: "Developer Two",
        passwordHash: developerPassword,
        role: "DEVELOPER",
      },
      create: {
        name: "Developer Two",
        email: "dev2@example.com",
        passwordHash: developerPassword,
        role: "DEVELOPER",
      },
    }),

    prisma.user.upsert({
      where: {
        email: "dev3@example.com",
      },
      update: {
        name: "Developer Three",
        passwordHash: developerPassword,
        role: "DEVELOPER",
      },
      create: {
        name: "Developer Three",
        email: "dev3@example.com",
        passwordHash: developerPassword,
        role: "DEVELOPER",
      },
    }),

    prisma.user.upsert({
      where: {
        email: "dev4@example.com",
      },
      update: {
        name: "Developer Four",
        passwordHash: developerPassword,
        role: "DEVELOPER",
      },
      create: {
        name: "Developer Four",
        email: "dev4@example.com",
        passwordHash: developerPassword,
        role: "DEVELOPER",
      },
    }),
  ]);

  /*
   * Remove old demo data.
   *
   * Users are preserved so their credentials remain stable.
   */
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  /*
   * Create 3 projects.
   */
  const project1 = await prisma.project.create({
    data: {
      name: "Client Portal Redesign",
      description:
        "Redesign and modernization of the client-facing portal.",
      status: "ACTIVE",
      ownerId: pm1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Mobile Banking App",
      description:
        "Development of a responsive mobile banking experience.",
      status: "ACTIVE",
      ownerId: pm1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "Analytics Dashboard",
      description:
        "Internal analytics and reporting dashboard.",
      status: "PLANNING",
      ownerId: pm2.id,
    },
  });

  const now = new Date();

  /*
   * Helper for creating tasks.
   */
  async function createProjectTasks(
    projectId: string,
    taskData: Array<{
      title: string;
      description: string;
      status:
        | "TODO"
        | "IN_PROGRESS"
        | "IN_REVIEW"
        | "DONE";
      priority:
        | "LOW"
        | "MEDIUM"
        | "HIGH"
        | "URGENT";
      dueDate: Date;
      assigneeId: string;
    }>
  ) {
    const tasks = [];

    for (const task of taskData) {
      const createdTask =
        await prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            projectId,
            assigneeId: task.assigneeId,
          },
        });

      tasks.push(createdTask);
    }

    return tasks;
  }

  /*
   * Project 1 tasks.
   */
  const project1Tasks =
    await createProjectTasks(
      project1.id,
      [
        {
          title: "Design new dashboard",
          description:
            "Create the new dashboard UI and responsive layouts.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueDate: new Date(
            now.getTime() +
              5 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[0].id,
        },
        {
          title: "Implement authentication screens",
          description:
            "Build login, registration and password reset screens.",
          status: "IN_REVIEW",
          priority: "HIGH",
          dueDate: new Date(
            now.getTime() +
              2 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[1].id,
        },
        {
          title: "Build project overview",
          description:
            "Implement project summary and statistics.",
          status: "TODO",
          priority: "MEDIUM",
          dueDate: new Date(
            now.getTime() +
              7 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[2].id,
        },
        {
          title: "Fix navigation issues",
          description:
            "Resolve responsive navigation problems.",
          status: "DONE",
          priority: "LOW",
          dueDate: new Date(
            now.getTime() -
              3 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[3].id,
        },
        {
          title: "Optimize API requests",
          description:
            "Reduce unnecessary API calls and improve loading performance.",
          status: "TODO",
          priority: "URGENT",
          dueDate: new Date(
            now.getTime() -
              2 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[0].id,
        },
      ]
    );

  /*
   * Project 2 tasks.
   */
  const project2Tasks =
    await createProjectTasks(
      project2.id,
      [
        {
          title: "Create account flow",
          description:
            "Implement the mobile account creation workflow.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueDate: new Date(
            now.getTime() +
              4 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[1].id,
        },
        {
          title: "Implement transaction list",
          description:
            "Create transaction history and filtering.",
          status: "TODO",
          priority: "MEDIUM",
          dueDate: new Date(
            now.getTime() +
              8 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[2].id,
        },
        {
          title: "Add biometric login",
          description:
            "Integrate biometric authentication support.",
          status: "IN_REVIEW",
          priority: "URGENT",
          dueDate: new Date(
            now.getTime() +
              1 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[3].id,
        },
        {
          title: "Improve error handling",
          description:
            "Add consistent API and UI error handling.",
          status: "DONE",
          priority: "MEDIUM",
          dueDate: new Date(
            now.getTime() -
              5 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[0].id,
        },
        {
          title: "Write mobile tests",
          description:
            "Add unit and integration tests for key flows.",
          status: "TODO",
          priority: "HIGH",
          dueDate: new Date(
            now.getTime() -
              1 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[1].id,
        },
      ]
    );

  /*
   * Project 3 tasks.
   */
  const project3Tasks =
    await createProjectTasks(
      project3.id,
      [
        {
          title: "Define analytics metrics",
          description:
            "Finalize the metrics required by stakeholders.",
          status: "DONE",
          priority: "HIGH",
          dueDate: new Date(
            now.getTime() -
              4 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[2].id,
        },
        {
          title: "Build analytics API",
          description:
            "Create backend endpoints for analytics data.",
          status: "IN_PROGRESS",
          priority: "URGENT",
          dueDate: new Date(
            now.getTime() +
              3 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[3].id,
        },
        {
          title: "Create charts",
          description:
            "Implement charts for dashboard metrics.",
          status: "TODO",
          priority: "MEDIUM",
          dueDate: new Date(
            now.getTime() +
              10 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[0].id,
        },
        {
          title: "Add date filters",
          description:
            "Allow users to filter analytics by date range.",
          status: "IN_REVIEW",
          priority: "MEDIUM",
          dueDate: new Date(
            now.getTime() +
              2 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[1].id,
        },
        {
          title: "Export analytics report",
          description:
            "Allow reports to be exported for stakeholders.",
          status: "TODO",
          priority: "LOW",
          dueDate: new Date(
            now.getTime() -
              2 * 24 * 60 * 60 * 1000
          ),
          assigneeId: developers[2].id,
        },
      ]
    );

  /*
   * Sample comments.
   */
  await prisma.comment.create({
    data: {
      content:
        "The first dashboard version is ready for review.",
      taskId: project1Tasks[0].id,
      authorId: developers[0].id,
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "Please verify the mobile layout before approval.",
      taskId: project2Tasks[0].id,
      authorId: pm1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "The analytics API structure has been finalized.",
      taskId: project3Tasks[1].id,
      authorId: developers[3].id,
    },
  });

  /*
   * Sample activity history.
   */
  await prisma.activity.createMany({
    data: [
      {
        type: "PROJECT_CREATED",
        message:
          `Project "${project1.name}" was created`,
        userId: pm1.id,
        projectId: project1.id,
      },
      {
        type: "PROJECT_CREATED",
        message:
          `Project "${project2.name}" was created`,
        userId: pm1.id,
        projectId: project2.id,
      },
      {
        type: "PROJECT_CREATED",
        message:
          `Project "${project3.name}" was created`,
        userId: pm2.id,
        projectId: project3.id,
      },
      {
        type: "TASK_CREATED",
        message:
          `Task "${project1Tasks[0].title}" was created`,
        userId: pm1.id,
        projectId: project1.id,
        taskId: project1Tasks[0].id,
      },
      {
        type: "TASK_STATUS_CHANGED",
        message:
          `Task "${project2Tasks[0].title}" status changed`,
        userId: developers[1].id,
        projectId: project2.id,
        taskId: project2Tasks[0].id,
      },
      {
        type: "COMMENT_ADDED",
        message:
          "A comment was added to a task",
        userId: developers[0].id,
        projectId: project1.id,
        taskId: project1Tasks[0].id,
      },
    ],
  });

  /*
   * Sample notifications.
   */
  await prisma.notification.createMany({
    data: [
      {
        userId: developers[0].id,
        title: "Task assigned",
        message:
          `You have been assigned to "${project1Tasks[0].title}".`,
        read: false,
      },
      {
        userId: developers[1].id,
        title: "Task assigned",
        message:
          `You have been assigned to "${project2Tasks[0].title}".`,
        read: false,
      },
      {
        userId: pm1.id,
        title: "Project activity",
        message:
          `New activity was recorded in "${project1.name}".`,
        read: false,
      },
      {
        userId: admin.id,
        title: "Dashboard ready",
        message:
          "The client project dashboard seed data is ready.",
        read: true,
      },
    ],
  });

  console.log("");
  console.log("✅ Database seed completed");
  console.log("");
  console.log("Accounts:");
  console.log(
    "Admin:       admin@example.com / Admin@12345"
  );
  console.log(
    "PM 1:        pm1@example.com / PM@12345"
  );
  console.log(
    "PM 2:        pm2@example.com / PM@12345"
  );
  console.log(
    "Developers:  dev1@example.com / Dev@12345"
  );
  console.log(
    "             dev2@example.com / Dev@12345"
  );
  console.log(
    "             dev3@example.com / Dev@12345"
  );
  console.log(
    "             dev4@example.com / Dev@12345"
  );
  console.log("");
  console.log("Projects: 3");
  console.log("Tasks: 15");
  console.log("");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });