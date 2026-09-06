\set ON_ERROR_STOP on

BEGIN;

INSERT INTO "user" ("id", "name", "email", "updated_at")
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Owner', 'owner@example.com', now()),
  ('00000000-0000-0000-0000-000000000002', 'Member', 'member@example.com', now());

INSERT INTO "space" ("id", "name", "created_by_user_id", "updated_at")
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '제약 검증 공간',
  '00000000-0000-0000-0000-000000000001',
  now()
);

INSERT INTO "space_membership" ("space_id", "user_id", "role", "updated_at")
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'OWNER',
  now()
);

DO $test$
BEGIN
  BEGIN
    INSERT INTO "space_membership" ("space_id", "user_id", "role", "updated_at")
    VALUES (
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      'OWNER',
      now()
    );
    RAISE EXCEPTION 'duplicate active owner was accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END
$test$;

INSERT INTO "space_invitation" (
  "id",
  "space_id",
  "created_by_user_id",
  "token_hash"
)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  decode(repeat('11', 32), 'hex')
);

DO $test$
BEGIN
  BEGIN
    INSERT INTO "space_invitation" (
      "id",
      "space_id",
      "created_by_user_id",
      "token_hash"
    )
    VALUES (
      '20000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      decode(repeat('22', 32), 'hex')
    );
    RAISE EXCEPTION 'second active invitation was accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END
$test$;

UPDATE "space_invitation"
SET "revoked_at" = now(),
    "revoked_by_user_id" = '00000000-0000-0000-0000-000000000001'
WHERE "id" = '20000000-0000-0000-0000-000000000001';

INSERT INTO "space_invitation" (
  "id",
  "space_id",
  "created_by_user_id",
  "token_hash"
)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  decode(repeat('22', 32), 'hex')
);

DO $test$
BEGIN
  BEGIN
    INSERT INTO "place" (
      "id",
      "source_type",
      "provider_place_id",
      "name",
      "latitude",
      "longitude",
      "created_by_user_id",
      "updated_at"
    )
    VALUES (
      '30000000-0000-0000-0000-000000000099',
      'KAKAO',
      'invalid-kakao',
      '잘못된 카카오 장소',
      37.5,
      127.0,
      '00000000-0000-0000-0000-000000000001',
      now()
    );
    RAISE EXCEPTION 'invalid provider/creator pair was accepted';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END
$test$;

INSERT INTO "place" (
  "id",
  "source_type",
  "provider_place_id",
  "name",
  "latitude",
  "longitude",
  "updated_at"
)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  'KAKAO',
  'kakao-1',
  '카카오 장소',
  37.5,
  127.0,
  now()
);

DO $test$
BEGIN
  BEGIN
    INSERT INTO "place" (
      "id",
      "source_type",
      "provider_place_id",
      "name",
      "latitude",
      "longitude",
      "updated_at"
    )
    VALUES (
      '30000000-0000-0000-0000-000000000002',
      'KAKAO',
      'kakao-1',
      '중복 카카오 장소',
      37.6,
      127.1,
      now()
    );
    RAISE EXCEPTION 'duplicate provider place was accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END
$test$;

INSERT INTO "space_place" (
  "id",
  "space_id",
  "place_id",
  "added_by_user_id",
  "updated_at"
)
VALUES (
  '40000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  now()
);

DO $test$
BEGIN
  BEGIN
    UPDATE "space_place"
    SET "deleted_at" = now()
    WHERE "id" = '40000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'unpaired soft delete was accepted';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    UPDATE "space_place"
    SET "impact_version" = -1
    WHERE "id" = '40000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'negative impact version was accepted';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END
$test$;

INSERT INTO "post" (
  "id",
  "space_place_id",
  "author_user_id",
  "body",
  "updated_at"
)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '검증 글',
  now()
);

DO $test$
BEGIN
  BEGIN
    INSERT INTO "comment" (
      "id",
      "post_id",
      "author_user_id",
      "body",
      "updated_at"
    )
    VALUES (
      '60000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '   ',
      now()
    );
    RAISE EXCEPTION 'blank comment was accepted';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    UPDATE "post"
    SET "revision" = 0
    WHERE "id" = '50000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'invalid post revision was accepted';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END
$test$;

ROLLBACK;

SELECT 'constraint smoke test passed' AS result;
