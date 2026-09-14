import "server-only";

import { prisma } from "../../db/prisma";
import { requireCurrentUser } from "../auth";

export async function getCurrentUserSpaces() {
  const currentUser = await requireCurrentUser();
  const memberships = await prisma.spaceMembership.findMany({
    where: {
      userId: currentUser.id,
      revokedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      role: true,
      space: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return memberships.map(({ role, space }) => ({ ...space, role }));
}
