import type { Prisma } from "../../generated/prisma/client";
import type { ManualPlaceCandidate } from "./place-candidate";

export async function saveManualPlace(
  transaction: Prisma.TransactionClient,
  userId: string,
  spaceId: string,
  candidate: ManualPlaceCandidate,
) {
  const spaces = await transaction.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "space" WHERE "id" = ${spaceId}::uuid FOR UPDATE
  `;
  if (!spaces.length) return { status: "NOT_FOUND" as const };

  const [user, membership] = await Promise.all([
    transaction.user.findUnique({ where: { id: userId }, select: { disabledAt: true } }),
    transaction.spaceMembership.findUnique({
      where: { spaceId_userId: { spaceId, userId } }, select: { revokedAt: true },
    }),
  ]);
  if (!user || user.disabledAt || !membership || membership.revokedAt) {
    return { status: "NOT_FOUND" as const };
  }

  // 등록 시도의 UUID를 재사용해 응답 유실 후 재시도도 같은 Place로 끝낸다.
  const inserted = await transaction.place.createMany({
    data: [{
      id: candidate.placeId, sourceType: "USER", createdByUserId: userId,
      name: candidate.name, address: candidate.address,
      latitude: candidate.latitude, longitude: candidate.longitude,
    }],
    skipDuplicates: true,
  });

  if (!inserted.count) {
    // 클라이언트 ID만으로 다른 공간·등록자의 장소를 연결하거나 노출하지 않는다.
    const existing = await transaction.spacePlace.findFirst({
      where: {
        spaceId, placeId: candidate.placeId,
        place: { sourceType: "USER", createdByUserId: userId },
      },
      select: { id: true, deletedAt: true },
    });
    if (!existing) return { status: "NOT_FOUND" as const };
    if (existing.deletedAt) return { status: "RESTORE_REQUIRED" as const };
    return { status: "EXISTING" as const, spacePlaceId: existing.id };
  }

  const spacePlace = await transaction.spacePlace.create({
    data: { spaceId, placeId: candidate.placeId, addedByUserId: userId },
    select: { id: true },
  });
  await transaction.placeRecommendation.create({
    data: { spacePlaceId: spacePlace.id, userId },
  });
  return { status: "CREATED" as const, spacePlaceId: spacePlace.id };
}
