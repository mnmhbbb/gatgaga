\set ON_ERROR_STOP on

BEGIN;

INSERT INTO "user" ("id", "name", "email", "updated_at")
VALUES
  ('80000000-0000-0000-0000-000000000001', 'Invitation owner', 'invitation-owner@example.com', now()),
  ('80000000-0000-0000-0000-000000000002', 'Invitation member', 'invitation-member@example.com', now());

INSERT INTO "space" ("id", "name", "created_by_user_id", "updated_at")
VALUES (
  '81000000-0000-0000-0000-000000000001',
  '초대 검증 공간',
  '80000000-0000-0000-0000-000000000001',
  now()
);

INSERT INTO "space_membership" ("space_id", "user_id", "role", "updated_at")
VALUES (
  '81000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000001',
  'OWNER',
  now()
);

INSERT INTO "space_invitation" (
  "id",
  "space_id",
  "created_by_user_id",
  "token_hash"
)
VALUES (
  '82000000-0000-0000-0000-000000000001',
  '81000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000001',
  decode(repeat('33', 32), 'hex')
);

INSERT INTO "space_membership" ("space_id", "user_id", "role", "updated_at")
VALUES (
  '81000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000002',
  'MEMBER',
  now()
)
ON CONFLICT ("space_id", "user_id") DO UPDATE
SET "revoked_at" = NULL,
    "role" = CASE
      WHEN "space_membership"."revoked_at" IS NULL THEN "space_membership"."role"
      ELSE 'MEMBER'::"membership_role"
    END,
    "updated_at" = now();

INSERT INTO "space_membership" ("space_id", "user_id", "role", "updated_at")
VALUES (
  '81000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000002',
  'MEMBER',
  now()
)
ON CONFLICT ("space_id", "user_id") DO UPDATE
SET "revoked_at" = NULL,
    "role" = CASE
      WHEN "space_membership"."revoked_at" IS NULL THEN "space_membership"."role"
      ELSE 'MEMBER'::"membership_role"
    END,
    "updated_at" = now();

DO $test$
BEGIN
  IF (
    SELECT count(*)
    FROM "space_membership"
    WHERE "space_id" = '81000000-0000-0000-0000-000000000001'
      AND "user_id" = '80000000-0000-0000-0000-000000000002'
      AND "revoked_at" IS NULL
  ) <> 1 THEN
    RAISE EXCEPTION 'repeated invitation acceptance created an invalid membership state';
  END IF;
END
$test$;

UPDATE "space_invitation"
SET "revoked_at" = now(),
    "revoked_by_user_id" = '80000000-0000-0000-0000-000000000001'
WHERE "id" = '82000000-0000-0000-0000-000000000001'
  AND "revoked_at" IS NULL;

INSERT INTO "space_invitation" (
  "id",
  "space_id",
  "created_by_user_id",
  "token_hash"
)
VALUES (
  '82000000-0000-0000-0000-000000000002',
  '81000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000001',
  decode(repeat('44', 32), 'hex')
);

DO $test$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "space_invitation"
    WHERE "token_hash" = decode(repeat('33', 32), 'hex')
      AND "revoked_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'rotated invitation remained active';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "space_invitation"
    WHERE "token_hash" = decode(repeat('44', 32), 'hex')
      AND "revoked_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'replacement invitation was not active';
  END IF;
END
$test$;

ROLLBACK;

SELECT 'invitation transaction smoke test passed' AS result;
