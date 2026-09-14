\set ON_ERROR_STOP on

BEGIN;

INSERT INTO "user" ("id", "name", "email", "updated_at")
VALUES (
  '70000000-0000-0000-0000-000000000001',
  'Space transaction owner',
  'space-transaction-owner@example.com',
  now()
);

INSERT INTO "space" (
  "id",
  "name",
  "visibility",
  "created_by_user_id",
  "updated_at"
)
VALUES (
  '71000000-0000-0000-0000-000000000001',
  '원자 생성 성공 공간',
  'PRIVATE',
  '70000000-0000-0000-0000-000000000001',
  now()
);

INSERT INTO "space_membership" (
  "space_id",
  "user_id",
  "role",
  "updated_at"
)
VALUES (
  '71000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  'OWNER',
  now()
);

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "space" AS s
    JOIN "space_membership" AS sm ON sm."space_id" = s."id"
    WHERE s."id" = '71000000-0000-0000-0000-000000000001'
      AND s."created_by_user_id" = sm."user_id"
      AND s."visibility" = 'PRIVATE'
      AND sm."role" = 'OWNER'
      AND sm."revoked_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'space and owner membership were not created together';
  END IF;
END
$test$;

DO $test$
BEGIN
  BEGIN
    INSERT INTO "space" (
      "id",
      "name",
      "visibility",
      "created_by_user_id",
      "updated_at"
    )
    VALUES (
      '71000000-0000-0000-0000-000000000002',
      '멤버십 실패 공간',
      'PRIVATE',
      '70000000-0000-0000-0000-000000000001',
      now()
    );

    INSERT INTO "space_membership" (
      "space_id",
      "user_id",
      "role",
      "updated_at"
    )
    VALUES (
      '71000000-0000-0000-0000-000000000002',
      '70000000-0000-0000-0000-000000000099',
      'OWNER',
      now()
    );

    RAISE EXCEPTION 'invalid owner membership was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  IF EXISTS (
    SELECT 1
    FROM "space"
    WHERE "id" = '71000000-0000-0000-0000-000000000002'
  ) THEN
    RAISE EXCEPTION 'space remained after owner membership failure';
  END IF;
END
$test$;

ROLLBACK;
