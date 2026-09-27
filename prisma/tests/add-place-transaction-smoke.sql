\set ON_ERROR_STOP on

BEGIN;

INSERT INTO "user" ("id", "name", "email", "updated_at")
VALUES ('90000000-0000-0000-0000-000000000001', 'Place member', 'place-member@example.com', now());

INSERT INTO "space" ("id", "name", "created_by_user_id", "updated_at")
VALUES ('91000000-0000-0000-0000-000000000001', '장소 저장 검증 공간', '90000000-0000-0000-0000-000000000001', now());

INSERT INTO "space_membership" ("space_id", "user_id", "role", "updated_at")
VALUES ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'OWNER', now());

INSERT INTO "place" ("id", "source_type", "provider_place_id", "name", "category", "address", "latitude", "longitude", "updated_at")
VALUES ('92000000-0000-0000-0000-000000000001', 'KAKAO', '123456', '첫 이름', '식당', '서울', 37.5, 127, now())
ON CONFLICT ("source_type", "provider_place_id") WHERE "provider_place_id" IS NOT NULL
DO NOTHING;

INSERT INTO "space_place" ("id", "space_id", "place_id", "added_by_user_id", "updated_at")
VALUES ('93000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', now())
ON CONFLICT ("space_id", "place_id") DO NOTHING;

INSERT INTO "place_recommendation" ("space_place_id", "user_id")
VALUES ('93000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001');

INSERT INTO "place" ("source_type", "provider_place_id", "name", "category", "address", "latitude", "longitude", "updated_at")
VALUES ('KAKAO', '123456', '변조된 이름', '식당', '서울', 37.5, 127, now())
ON CONFLICT ("source_type", "provider_place_id") WHERE "provider_place_id" IS NOT NULL
DO NOTHING;

INSERT INTO "space_place" ("space_id", "place_id", "added_by_user_id", "updated_at")
VALUES ('91000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', now())
ON CONFLICT ("space_id", "place_id") DO NOTHING;

DO $test$
BEGIN
  IF (SELECT count(*) FROM "place" WHERE "provider_place_id" = '123456') <> 1
    OR (SELECT "name" FROM "place" WHERE "provider_place_id" = '123456') <> '첫 이름'
    OR (SELECT count(*) FROM "space_place" WHERE "space_id" = '91000000-0000-0000-0000-000000000001') <> 1
    OR (SELECT count(*) FROM "place_recommendation" WHERE "space_place_id" = '93000000-0000-0000-0000-000000000001') <> 1
  THEN
    RAISE EXCEPTION 'repeated place addition changed identity or first recommendation';
  END IF;
END
$test$;

UPDATE "space_place"
SET "deleted_at" = now(), "deleted_by_user_id" = '90000000-0000-0000-0000-000000000001', "updated_at" = now()
WHERE "id" = '93000000-0000-0000-0000-000000000001';

INSERT INTO "space_place" ("space_id", "place_id", "added_by_user_id", "updated_at")
VALUES ('91000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', now())
ON CONFLICT ("space_id", "place_id") DO NOTHING;

DO $test$
BEGIN
  IF (SELECT "deleted_at" FROM "space_place" WHERE "id" = '93000000-0000-0000-0000-000000000001') IS NULL
    OR (SELECT count(*) FROM "space_place" WHERE "space_id" = '91000000-0000-0000-0000-000000000001') <> 1
  THEN
    RAISE EXCEPTION 'removed place was restored or duplicated';
  END IF;

  BEGIN
    INSERT INTO "place" ("id", "source_type", "provider_place_id", "name", "latitude", "longitude", "updated_at")
    VALUES ('92000000-0000-0000-0000-000000000002', 'KAKAO', '999999', '원자성 검증', 37.5, 127, now());
    INSERT INTO "space_place" ("id", "space_id", "place_id", "added_by_user_id", "updated_at")
    VALUES ('93000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', now());
    INSERT INTO "place_recommendation" ("space_place_id", "user_id")
    VALUES ('93000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000099');
    RAISE EXCEPTION 'invalid recommendation was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  IF EXISTS (SELECT 1 FROM "place" WHERE "provider_place_id" = '999999') THEN
    RAISE EXCEPTION 'place remained after recommendation failure';
  END IF;
END
$test$;

ROLLBACK;

SELECT 'add place transaction smoke test passed' AS result;
