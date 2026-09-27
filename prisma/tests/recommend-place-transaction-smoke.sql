\set ON_ERROR_STOP on

BEGIN;

INSERT INTO "user" ("id", "name", "email", "updated_at")
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Place owner', 'recommend-owner@example.com', now()),
  ('a0000000-0000-0000-0000-000000000002', 'Place member', 'recommend-member@example.com', now());

INSERT INTO "space" ("id", "name", "created_by_user_id", "updated_at")
VALUES ('b0000000-0000-0000-0000-000000000001', '추천 검증 공간', 'a0000000-0000-0000-0000-000000000001', now());

INSERT INTO "space_membership" ("space_id", "user_id", "role", "updated_at")
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'OWNER', now()),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'MEMBER', now());

INSERT INTO "place" ("id", "source_type", "provider_place_id", "name", "latitude", "longitude", "updated_at")
VALUES ('c0000000-0000-0000-0000-000000000001', 'KAKAO', 'recommend-place-smoke', '추천 검증 장소', 37.5, 127, now());

INSERT INTO "space_place" ("id", "space_id", "place_id", "added_by_user_id", "updated_at")
VALUES ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', now());

INSERT INTO "place_recommendation" ("space_place_id", "user_id")
VALUES ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');

-- 새 멤버의 추천은 버전 증가와 함께 저장된다.
UPDATE "space_place"
SET "impact_version" = "impact_version" + 1, "updated_at" = now()
WHERE "id" = 'd0000000-0000-0000-0000-000000000001' AND "deleted_at" IS NULL;

INSERT INTO "place_recommendation" ("space_place_id", "user_id")
VALUES ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002');

DO $test$
BEGIN
  IF (SELECT "impact_version" FROM "space_place" WHERE "id" = 'd0000000-0000-0000-0000-000000000001') <> 1
    OR (SELECT count(*) FROM "place_recommendation" WHERE "space_place_id" = 'd0000000-0000-0000-0000-000000000001') <> 2
  THEN
    RAISE EXCEPTION 'new recommendation did not change count and version exactly once';
  END IF;

  -- 사용자별 기본 키가 중복을 막고, 실패한 삽입은 기존 추천을 바꾸지 않는다.
  BEGIN
    INSERT INTO "place_recommendation" ("space_place_id", "user_id")
    VALUES ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002');
    RAISE EXCEPTION 'duplicate recommendation was accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  IF (SELECT "impact_version" FROM "space_place" WHERE "id" = 'd0000000-0000-0000-0000-000000000001') <> 1
    OR (SELECT count(*) FROM "place_recommendation" WHERE "space_place_id" = 'd0000000-0000-0000-0000-000000000001') <> 2
  THEN
    RAISE EXCEPTION 'duplicate recommendation changed stored impact';
  END IF;

  -- 추천 생성 실패 시 버전 증가도 함께 되돌아가야 한다.
  BEGIN
    UPDATE "space_place"
    SET "impact_version" = "impact_version" + 1, "updated_at" = now()
    WHERE "id" = 'd0000000-0000-0000-0000-000000000001' AND "deleted_at" IS NULL;
    INSERT INTO "place_recommendation" ("space_place_id", "user_id")
    VALUES ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000099');
    RAISE EXCEPTION 'invalid recommendation was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  IF (SELECT "impact_version" FROM "space_place" WHERE "id" = 'd0000000-0000-0000-0000-000000000001') <> 1 THEN
    RAISE EXCEPTION 'failed recommendation left impact version changed';
  END IF;
END
$test$;

UPDATE "space_place"
SET "deleted_at" = now(), "deleted_by_user_id" = 'a0000000-0000-0000-0000-000000000001', "updated_at" = now()
WHERE "id" = 'd0000000-0000-0000-0000-000000000001';

DO $test$
DECLARE
  updated_rows integer;
BEGIN
  UPDATE "space_place"
  SET "impact_version" = "impact_version" + 1, "updated_at" = now()
  WHERE "id" = 'd0000000-0000-0000-0000-000000000001' AND "deleted_at" IS NULL;
  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows <> 0
    OR (SELECT "impact_version" FROM "space_place" WHERE "id" = 'd0000000-0000-0000-0000-000000000001') <> 1
  THEN
    RAISE EXCEPTION 'removed place accepted recommendation impact';
  END IF;
END
$test$;

ROLLBACK;

SELECT 'recommend place transaction smoke test passed' AS result;
