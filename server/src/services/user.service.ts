import { prisma } from "../config/prisma";

export async function getDevelopers() {
  return prisma.user.findMany({
    where: {
      role: "DEVELOPER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}
