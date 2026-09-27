import "server-only";

import { prisma } from "../../db/prisma";
import { requireCurrentUser } from "../auth";
import { getCurrentUserSpace } from "../space";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getSpacePlaces(spaceId: string) {
  const space = await getCurrentUserSpace(spaceId);
  if (!space) return null;

  return prisma.spacePlace.findMany({
    where: { spaceId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      place: {
        select: { name: true, category: true, address: true, latitude: true, longitude: true, externalUrl: true },
      },
      _count: { select: { recommendations: true } },
    },
  });
}

export async function getSpacePlace(spaceId: string, spacePlaceId: string) {
  const currentUser = await requireCurrentUser();
  if (!UUID_PATTERN.test(spaceId) || !UUID_PATTERN.test(spacePlaceId)) return null;

  const spacePlace = await prisma.spacePlace.findFirst({
    where: {
      id: spacePlaceId,
      spaceId,
      deletedAt: null,
      space: { memberships: { some: { userId: currentUser.id, revokedAt: null } } },
    },
    select: {
      id: true,
      place: {
        select: { name: true, category: true, address: true, latitude: true, longitude: true, externalUrl: true },
      },
      _count: { select: { recommendations: true } },
      recommendations: {
        orderBy: { createdAt: "asc" },
        select: { userId: true, user: { select: { name: true } } },
      },
    },
  });

  if (!spacePlace) return null;

  return {
    ...spacePlace,
    recommendedByCurrentUser: spacePlace.recommendations.some(
      (recommendation) => recommendation.userId === currentUser.id,
    ),
    recommendations: spacePlace.recommendations.map(({ user }) => ({ user })),
  };
}
