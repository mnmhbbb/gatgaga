import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { registerHooks } from "node:module";
import test from "node:test";

test("직접 등록 PostgreSQL: 동시 재시도·권한·출처 격리·제거·rollback", {
  skip: process.env.RUN_MANUAL_PLACE_DB_TEST !== "1",
}, async () => {
  // Node의 TS 실행에서 Prisma 생성 코드의 확장자 없는 상대 import를 해석한다.
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      try { return nextResolve(specifier, context); }
      catch (error) {
        if (specifier.startsWith(".")) return nextResolve(`${specifier}.ts`, context);
        throw error;
      }
    },
  });
  const [{ PrismaClient }, { PrismaPg }, { saveManualPlace }] = await Promise.all([
    import("../../server/generated/prisma/client.ts"),
    import("@prisma/adapter-pg"),
    import("../../server/modules/place/save-manual-place.ts"),
  ]);
  hooks.deregister();
  // 배포 DB 환경 변수는 읽지 않는다. compose.yaml의 로컬 PostgreSQL만 검증한다.
  const prisma = new PrismaClient({ adapter: new PrismaPg({
    connectionString: "postgresql://gatgaga:gatgaga_local@127.0.0.1:54329/gatgaga",
  }) });
  const userId = randomUUID();
  const otherUserId = randomUUID();
  const spaceId = randomUUID();
  const otherSpaceId = randomUUID();
  const candidate = { placeId: randomUUID(), name: "직접 등록 검증", address: "서울", latitude: 37.5, longitude: 127 };
  const kakaoId = randomUUID();
  const add = (input = candidate, actor = userId, space = spaceId) =>
    prisma.$transaction((tx) => saveManualPlace(tx, actor, space, input));

  try {
    await prisma.user.createMany({ data: [userId, otherUserId].map((id) => ({ id, name: "직접 등록 검증", email: `${id}@example.com` })) });
    await prisma.space.createMany({ data: [spaceId, otherSpaceId].map((id) => ({ id, name: "직접 등록 검증", createdByUserId: userId })) });
    await prisma.spaceMembership.createMany({ data: [spaceId, otherSpaceId].map((id) => ({ spaceId: id, userId, role: "OWNER" })) });

    assert.deepEqual(await add(candidate, otherUserId), { status: "NOT_FOUND" });
    assert.equal(await prisma.place.count({ where: { id: candidate.placeId } }), 0);
    assert.deepEqual(await add(candidate, userId, randomUUID()), { status: "NOT_FOUND" });
    await prisma.spaceMembership.update({ where: { spaceId_userId: { spaceId, userId } }, data: { revokedAt: new Date() } });
    assert.deepEqual(await add(), { status: "NOT_FOUND" });
    await prisma.spaceMembership.update({ where: { spaceId_userId: { spaceId, userId } }, data: { revokedAt: null } });
    await prisma.user.update({ where: { id: userId }, data: { disabledAt: new Date() } });
    assert.deepEqual(await add(), { status: "NOT_FOUND" });
    await prisma.user.update({ where: { id: userId }, data: { disabledAt: null } });

    const results = await Promise.all([add(), add()]);
    assert.deepEqual(results.map((result) => result.status).sort(), ["CREATED", "EXISTING"]);
    const spacePlaceId = results[0].spacePlaceId;
    assert.equal(results[1].spacePlaceId, spacePlaceId);
    assert.equal(await prisma.placeRecommendation.count({ where: { spacePlaceId } }), 1);
    const stored = await prisma.place.findUniqueOrThrow({ where: { id: candidate.placeId } });
    assert.equal(stored.sourceType, "USER");
    assert.equal(stored.createdByUserId, userId);
    assert.equal(stored.providerPlaceId, null);
    assert.equal(stored.externalUrl, null);
    assert.equal(stored.address, candidate.address);
    assert.equal(stored.latitude, candidate.latitude);
    assert.equal(stored.longitude, candidate.longitude);
    assert.equal((await add({ ...candidate, name: "재시도로 덮어쓰기" })).status, "EXISTING");
    assert.equal((await prisma.place.findUniqueOrThrow({ where: { id: candidate.placeId } })).name, candidate.name);

    assert.deepEqual(await add(candidate, userId, otherSpaceId), { status: "NOT_FOUND" });
    await prisma.spaceMembership.create({ data: { spaceId, userId: otherUserId, role: "MEMBER" } });
    assert.deepEqual(await add(candidate, otherUserId), { status: "NOT_FOUND" });
    assert.equal(await prisma.spacePlace.count({ where: { placeId: candidate.placeId } }), 1);

    await prisma.place.create({ data: {
      id: kakaoId, sourceType: "KAKAO", providerPlaceId: `manual-smoke-${kakaoId}`,
      name: candidate.name, latitude: candidate.latitude, longitude: candidate.longitude,
    } });
    assert.deepEqual(await add({ ...candidate, placeId: kakaoId }), { status: "NOT_FOUND" });
    assert.equal((await add({ ...candidate, placeId: randomUUID() })).status, "CREATED");
    assert.equal(await prisma.place.count({ where: { createdByUserId: userId } }), 2);

    await prisma.spacePlace.update({ where: { id: spacePlaceId }, data: { deletedAt: new Date(), deletedByUserId: userId } });
    assert.deepEqual(await add(), { status: "RESTORE_REQUIRED" });
    assert.equal(await prisma.spacePlace.count({ where: { placeId: candidate.placeId } }), 1);

    const rollbackId = randomUUID();
    await assert.rejects(prisma.$transaction(async (tx) => {
      const failingTx = new Proxy(tx, { get(target, key) {
        if (key === "placeRecommendation") return { create: async () => { throw new Error("recommendation failure"); } };
        return Reflect.get(target, key);
      } });
      await saveManualPlace(failingTx, userId, spaceId, { ...candidate, placeId: rollbackId });
    }), /recommendation failure/);
    assert.equal(await prisma.place.count({ where: { id: rollbackId } }), 0);
    assert.equal(await prisma.spacePlace.count({ where: { placeId: rollbackId } }), 0);
  } finally {
    await prisma.$transaction(async (tx) => {
      await tx.placeRecommendation.deleteMany({ where: { spacePlace: { spaceId: { in: [spaceId, otherSpaceId] } } } });
      await tx.spacePlace.deleteMany({ where: { spaceId: { in: [spaceId, otherSpaceId] } } });
      await tx.place.deleteMany({ where: { OR: [{ createdByUserId: userId }, { id: kakaoId }] } });
      await tx.spaceMembership.deleteMany({ where: { spaceId: { in: [spaceId, otherSpaceId] } } });
      await tx.space.deleteMany({ where: { id: { in: [spaceId, otherSpaceId] } } });
      await tx.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    });
    await prisma.$disconnect();
  }
});
