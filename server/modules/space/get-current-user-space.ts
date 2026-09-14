import "server-only";

import { prisma } from "../../db/prisma";
import { requireCurrentUser } from "../auth";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getCurrentUserSpace(spaceId: string) {
  const currentUser = await requireCurrentUser();

  if (!UUID_PATTERN.test(spaceId)) {
    return null;
  }

  const membership = await prisma.spaceMembership.findFirst({
    where: {
      spaceId,
      userId: currentUser.id,
      revokedAt: null,
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

  if (!membership) {
    return null;
  }

  return {
    ...membership.space,
    role: membership.role,
  };
}
