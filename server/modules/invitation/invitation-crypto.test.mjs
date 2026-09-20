import assert from "node:assert/strict";
import test from "node:test";

import {
  createInvitationIntent,
  createInvitationToken,
  hashInvitationToken,
  invitationTokenMatchesHash,
  isCanonicalInvitationToken,
  verifyInvitationIntent,
} from "./invitation-crypto.ts";

process.env.SPACE_INVITATION_MASTER_KEY = Buffer.alloc(32, 7).toString("base64");

const invitationId = "90000000-0000-4000-8000-000000000001";
const spaceId = "91000000-0000-4000-8000-000000000001";

test("초대 행마다 재생성 가능한 32바이트 base64url 토큰을 만든다", () => {
  const token = createInvitationToken(invitationId, spaceId);
  const sameToken = createInvitationToken(invitationId, spaceId);
  const otherToken = createInvitationToken(
    "90000000-0000-4000-8000-000000000002",
    spaceId,
  );

  assert.equal(token.length, 43);
  assert.equal(isCanonicalInvitationToken(token), true);
  assert.equal(token, sameToken);
  assert.notEqual(token, otherToken);
  assert.equal(isCanonicalInvitationToken(`${token}=`), false);
});

test("재생성한 토큰이 저장된 SHA-256 해시와 일치할 때만 복사한다", () => {
  const token = createInvitationToken(invitationId, spaceId);
  const tokenHash = hashInvitationToken(token);
  const otherHash = hashInvitationToken(
    createInvitationToken("90000000-0000-4000-8000-000000000002", spaceId),
  );

  assert.equal(invitationTokenMatchesHash(token, tokenHash), true);
  assert.equal(invitationTokenMatchesHash(token, otherHash), false);
});

test("로그인 복귀 intent의 서명과 10분 만료를 검증한다", () => {
  const issuedAt = new Date("2026-09-19T00:00:00.000Z");
  const intent = createInvitationIntent(invitationId, issuedAt);

  assert.deepEqual(
    verifyInvitationIntent(intent, new Date("2026-09-19T00:09:59.000Z")),
    {
      invitationId,
      expiresAt: Math.floor(issuedAt.getTime() / 1000) + 600,
    },
  );
  assert.equal(
    verifyInvitationIntent(intent, new Date("2026-09-19T00:10:00.000Z")),
    null,
  );
  assert.equal(
    verifyInvitationIntent(`${intent.slice(0, -1)}x`, issuedAt),
    null,
  );
});

test("잘못된 master key 길이는 즉시 실패한다", () => {
  const previousKey = process.env.SPACE_INVITATION_MASTER_KEY;
  process.env.SPACE_INVITATION_MASTER_KEY = Buffer.alloc(16, 1).toString("base64");

  assert.throws(
    () => createInvitationIntent(invitationId),
    /base64로 인코딩한 32바이트/,
  );

  process.env.SPACE_INVITATION_MASTER_KEY = previousKey;
});
