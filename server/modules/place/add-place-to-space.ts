import "server-only";

import { prisma } from "../../db/prisma";
import { requireCurrentUser } from "../auth";

import { validateKakaoPlaceCandidate } from "./place-candidate";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function addPlaceToSpace(spaceId: string, candidateInput: unknown) {
  const currentUser = await requireCurrentUser();

  if (!UUID_PATTERN.test(spaceId)) {
    return { status: "NOT_FOUND" as const };
  }

  const candidate = validateKakaoPlaceCandidate(candidateInput);

  return prisma.$transaction(async (transaction) => {
    // 같은 공간의 동시 추가를 직렬화해 중복·제거 상태를 한 순서로 판정한다.
    const spaceRows = await transaction.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "space" WHERE "id" = ${spaceId}::uuid FOR UPDATE
    `;

    if (!spaceRows.length) return { status: "NOT_FOUND" as const };

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

    // Prisma schema는 부분 unique 인덱스를 표현하지 못하므로 해당 인덱스를 직접 사용한다.
    const [insertedPlace] = await transaction.$queryRaw<Array<{ id: string }>>`
      INSERT INTO "place" (
        "source_type", "provider_place_id", "name", "category", "address",
        "latitude", "longitude", "external_url", "updated_at"
      ) VALUES (
        'KAKAO'::"place_source_type", ${candidate.providerPlaceId},
        ${candidate.name}, ${candidate.category}, ${candidate.address},
        ${candidate.latitude}, ${candidate.longitude}, ${candidate.externalUrl ?? null}, now()
      )
      ON CONFLICT ("source_type", "provider_place_id")
        WHERE "provider_place_id" IS NOT NULL
      DO NOTHING
      RETURNING "id"
    `;

    // 중복 요청의 후보 값으로 이미 저장된 장소 사실을 덮어쓰지 않는다.
    const placeId = insertedPlace?.id ?? (await transaction.place.findFirstOrThrow({
      where: { sourceType: "KAKAO", providerPlaceId: candidate.providerPlaceId },
      select: { id: true },
    })).id;

    const inserted = await transaction.spacePlace.createMany({
      data: [{ spaceId, placeId, addedByUserId: currentUser.id }],
      skipDuplicates: true,
    });

    const spacePlace = await transaction.spacePlace.findUniqueOrThrow({
      where: { spaceId_placeId: { spaceId, placeId } },
      select: { id: true, deletedAt: true },
    });

    if (spacePlace.deletedAt) {
      return { status: "RESTORE_REQUIRED" as const };
    }

    if (!inserted.count) {
      return { status: "EXISTING" as const, spacePlaceId: spacePlace.id };
    }

    await transaction.placeRecommendation.create({
      data: { spacePlaceId: spacePlace.id, userId: currentUser.id },
    });

    return { status: "CREATED" as const, spacePlaceId: spacePlace.id };
  });
}
