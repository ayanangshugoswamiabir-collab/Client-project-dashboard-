import { prisma } from "../config/prisma";

type CreateProjectInput = {
  name: string;
  description?: string;
  status?:
    | "PLANNING"
    | "ACTIVE"
    | "COMPLETED"
    | "ARCHIVED";
  ownerId: string;
};

type UpdateProjectInput = {
  name?: string;
  description?: string | null;
  status?:
    | "PLANNING"
    | "ACTIVE"
    | "COMPLETED"
    | "ARCHIVED";
  ownerId?: string;
};

export async function createProject(
  input: CreateProjectInput
) {
  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      status: input.status,
      ownerId: input.ownerId,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function getProjects(
  userId: string,
  role:
    | "ADMIN"
    | "PROJECT_MANAGER"
    | "DEVELOPER"
) {
  const where =
    role === "PROJECT_MANAGER"
      ? {
          ownerId: userId,
        }
      : role === "DEVELOPER"
        ? {
            tasks: {
              some: {
                assigneeId: userId,
              },
            },
          }
        : {};

  return prisma.project.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getProjectById(
  projectId: string,
  userId: string,
  role:
    | "ADMIN"
    | "PROJECT_MANAGER"
    | "DEVELOPER"
) {
  const project =
    await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        tasks: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            _count: {
              select: {
                comments: true,
              },
            },
          },
        },
      },
    });

  if (!project) {
    return null;
  }

  if (
    role === "PROJECT_MANAGER" &&
    project.ownerId !== userId
  ) {
    throw new Error(
      "You can only access projects you own"
    );
  }

  if (role === "DEVELOPER") {
    const hasAssignedTask =
      project.tasks.some(
        (task) =>
          task.assigneeId === userId
      );

    if (!hasAssignedTask) {
      throw new Error(
        "You can only access projects containing your assigned tasks"
      );
    }
  }

  return project;
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  userId: string,
  role:
    | "ADMIN"
    | "PROJECT_MANAGER"
    | "DEVELOPER"
) {
  const existingProject =
    await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

  if (!existingProject) {
    throw new Error("Project not found");
  }

  if (
    role === "PROJECT_MANAGER" &&
    existingProject.ownerId !== userId
  ) {
    throw new Error(
      "You can only update projects you own"
    );
  }

  if (role === "DEVELOPER") {
    throw new Error(
      "Developers cannot update projects"
    );
  }

  let data: UpdateProjectInput = input;

  /*
   * Project Managers cannot transfer ownership.
   * Their project must remain owned by themselves.
   */
  if (role === "PROJECT_MANAGER") {
    data = {
      ...input,
      ownerId: userId,
    };
  }

  /*
   * If an Admin changes the owner, make sure
   * the new owner exists and is a Project Manager.
   */
  if (
    role === "ADMIN" &&
    input.ownerId !== undefined
  ) {
    const owner =
      await prisma.user.findUnique({
        where: {
          id: input.ownerId,
        },
      });

    if (!owner) {
      throw new Error(
        "Project owner not found"
      );
    }

    if (owner.role !== "PROJECT_MANAGER") {
      throw new Error(
        "Projects can only be owned by Project Managers"
      );
    }
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function deleteProject(
  projectId: string,
  userId: string,
  role:
    | "ADMIN"
    | "PROJECT_MANAGER"
    | "DEVELOPER"
) {
  if (role === "PROJECT_MANAGER") {
    const project =
      await prisma.project.findFirst({
        where: {
          id: projectId,
          ownerId: userId,
        },
      });

    if (!project) {
      throw new Error(
        "You can only delete projects you own"
      );
    }
  }

  return prisma.project.delete({
    where: {
      id: projectId,
    },
  });
}