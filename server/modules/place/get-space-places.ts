import "server-only";

import { prisma } from "../../db/prisma";
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
  const space = await getCurrentUserSpace(spaceId);
  if (!space || !UUID_PATTERN.test(spacePlaceId)) return null;

  return prisma.spacePlace.findFirst({
    where: { id: spacePlaceId, spaceId, deletedAt: null },
    select: {
      id: true,
      place: {
        select: { name: true, category: true, address: true, latitude: true, longitude: true, externalUrl: true },
      },
      _count: { select: { recommendations: true } },
    },
  });
}
