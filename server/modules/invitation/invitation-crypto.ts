import {
  createHash,
  createHmac,
  hkdfSync,
  timingSafeEqual,
} from "node:crypto";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_VERSION = "v1";
const INTENT_LIFETIME_SECONDS = 10 * 60;
const HKDF_SALT = Buffer.from("gatgaga-space-invitation-v1", "utf8");

function readMasterKey() {
  const encodedKey = process.env.SPACE_INVITATION_MASTER_KEY?.trim();

  if (!encodedKey) {
    throw new Error("SPACE_INVITATION_MASTER_KEY 환경 변수가 필요합니다.");
  }

  const key = Buffer.from(encodedKey, "base64");

  if (key.length !== 32 || key.toString("base64") !== encodedKey) {
    throw new Error("SPACE_INVITATION_MASTER_KEY는 base64로 인코딩한 32바이트여야 합니다.");
  }

  return key;
}

function deriveKey(purpose: "token" | "intent") {
  return Buffer.from(
    hkdfSync(
      "sha256",
      readMasterKey(),
      HKDF_SALT,
      Buffer.from(`gatgaga:invitation-${purpose}:v1`, "utf8"),
      32,
    ),
  );
}

function assertUuid(value: string) {
  if (!UUID_PATTERN.test(value)) {
    throw new Error("초대 식별자 형식이 올바르지 않습니다.");
  }
}

export function isCanonicalInvitationToken(value: unknown): value is string {
  if (typeof value !== "string" || !TOKEN_PATTERN.test(value)) {
    return false;
  }

  const decoded = Buffer.from(value, "base64url");
  return decoded.length === 32 && decoded.toString("base64url") === value;
}

export function createInvitationToken(invitationId: string, spaceId: string) {
  assertUuid(invitationId);
  assertUuid(spaceId);

  return createHmac("sha256", deriveKey("token"))
    .update(`${TOKEN_VERSION}|${invitationId}|${spaceId}`, "utf8")
    .digest("base64url");
}

export function hashInvitationToken(token: string) {
  if (!isCanonicalInvitationToken(token)) {
    throw new Error("초대 토큰 형식이 올바르지 않습니다.");
  }

  return createHash("sha256").update(token, "utf8").digest();
}

export function invitationTokenMatchesHash(
  token: string,
  tokenHash: Uint8Array,
) {
  const expectedHash = hashInvitationToken(token);
  const storedHash = Buffer.from(tokenHash);

  return (
    storedHash.length === expectedHash.length &&
    timingSafeEqual(storedHash, expectedHash)
  );
}

export function createInvitationIntent(
  invitationId: string,
  now = new Date(),
) {
  assertUuid(invitationId);

  const expiresAt = Math.floor(now.getTime() / 1000) + INTENT_LIFETIME_SECONDS;
  const payload = `${TOKEN_VERSION}.${invitationId}.${expiresAt}`;
  const signature = createHmac("sha256", deriveKey("intent"))
    .update(payload, "utf8")
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function verifyInvitationIntent(value: string, now = new Date()) {
  const [version, invitationId, encodedExpiresAt, signature, extra] = value.split(".");

  if (
    version !== TOKEN_VERSION ||
    !invitationId ||
    !UUID_PATTERN.test(invitationId) ||
    !encodedExpiresAt ||
    !/^\d+$/.test(encodedExpiresAt) ||
    !signature ||
    extra
  ) {
    return null;
  }

  const expiresAt = Number(encodedExpiresAt);

  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now.getTime() / 1000)) {
    return null;
  }

  const payload = `${version}.${invitationId}.${encodedExpiresAt}`;
  const expectedSignature = createHmac("sha256", deriveKey("intent"))
    .update(payload, "utf8")
    .digest();
  const receivedSignature = Buffer.from(signature, "base64url");

  if (
    receivedSignature.length !== expectedSignature.length ||
    receivedSignature.toString("base64url") !== signature ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return null;
  }

  return { invitationId, expiresAt };
}

export const invitationIntentMaxAge = INTENT_LIFETIME_SECONDS;
