import "server-only";

import { prisma } from "../../db/prisma";
import { requireCurrentUser } from "../auth";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function recommendPlace(spaceId: string, spacePlaceId: string) {
  const currentUser = await requireCurrentUser();

  if (!UUID_PATTERN.test(spaceId) || !UUID_PATTERN.test(spacePlaceId)) {
    return { status: "NOT_FOUND" as const };
  }

  return prisma.$transaction(async (transaction) => {
    // 같은 장소의 동시 추천과 제거를 한 순서로 판정한다.
    const [spacePlace] = await transaction.$queryRaw<Array<{ id: string; deleted_at: Date | null }>>`
      SELECT "id", "deleted_at" FROM "space_place"
      WHERE "id" = ${spacePlaceId}::uuid AND "space_id" = ${spaceId}::uuid
      FOR UPDATE
    `;

    if (!spacePlace || spacePlace.deleted_at) {
      return { status: "NOT_FOUND" as const };
    }

    const [user, membership] = await Promise.all([
      transaction.user.findUnique({
        where: { id: currentUser.id },
        select: { disabledAt: true },
      }),
      transaction.spaceMembership.findUnique({
        where: { spaceId_userId: { spaceId, userId: currentUser.id } },
        select: { revokedAt: true },
      }),
    ]);

    if (!user || user.disabledAt || !membership || membership.revokedAt) {
      return { status: "NOT_FOUND" as const };
    }

    const previous = await transaction.placeRecommendation.findUnique({
      where: { spacePlaceId_userId: { spacePlaceId, userId: currentUser.id } },
      select: { userId: true },
    });

    if (previous) {
      return { status: "ALREADY_RECOMMENDED" as const };
    }

    await transaction.spacePlace.update({
      where: { id: spacePlaceId },
      data: { impactVersion: { increment: 1 } },
    });

    await transaction.placeRecommendation.create({
      data: { spacePlaceId, userId: currentUser.id },
    });

    return { status: "CREATED" as const };
  });
}
