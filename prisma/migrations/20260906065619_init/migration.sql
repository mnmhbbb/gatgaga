-- CreateEnum
CREATE TYPE "space_visibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "membership_role" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "place_source_type" AS ENUM ('KAKAO', 'USER');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "disabled_at" TIMESTAMPTZ(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" UUID NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "issuer" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ(3),
    "refresh_token_expires_at" TIMESTAMPTZ(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "name" VARCHAR(40) NOT NULL,
    "visibility" "space_visibility" NOT NULL DEFAULT 'PRIVATE',
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_membership" (
    "space_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "membership_role" NOT NULL DEFAULT 'MEMBER',
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "space_membership_pkey" PRIMARY KEY ("space_id","user_id")
);

-- CreateTable
CREATE TABLE "space_invitation" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "space_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "token_hash" BYTEA NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "revoked_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "source_type" "place_source_type" NOT NULL,
    "provider_place_id" VARCHAR(100),
    "name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(200),
    "address" VARCHAR(500),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "external_url" VARCHAR(2048),
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_place" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "space_id" UUID NOT NULL,
    "place_id" UUID NOT NULL,
    "added_by_user_id" UUID NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by_user_id" UUID,
    "impact_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "space_place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_recommendation" (
    "space_place_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_recommendation_pkey" PRIMARY KEY ("space_place_id","user_id")
);

-- CreateTable
CREATE TABLE "post" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "space_place_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "post_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- DomainCheckConstraints
ALTER TABLE "space"
    ADD CONSTRAINT "space_name_length_check"
    CHECK (char_length(btrim("name")) BETWEEN 1 AND 40);

ALTER TABLE "space_invitation"
    ADD CONSTRAINT "space_invitation_token_hash_length_check"
    CHECK (octet_length("token_hash") = 32),
    ADD CONSTRAINT "space_invitation_revocation_pair_check"
    CHECK (("revoked_at" IS NULL) = ("revoked_by_user_id" IS NULL));

ALTER TABLE "place"
    ADD CONSTRAINT "place_latitude_range_check"
    CHECK ("latitude" BETWEEN -90 AND 90),
    ADD CONSTRAINT "place_longitude_range_check"
    CHECK ("longitude" BETWEEN -180 AND 180),
    ADD CONSTRAINT "place_source_fields_check"
    CHECK (
        ("source_type" = 'KAKAO' AND "provider_place_id" IS NOT NULL AND "created_by_user_id" IS NULL)
        OR
        ("source_type" = 'USER' AND "provider_place_id" IS NULL AND "created_by_user_id" IS NOT NULL)
    );

ALTER TABLE "space_place"
    ADD CONSTRAINT "space_place_impact_version_check"
    CHECK ("impact_version" >= 0),
    ADD CONSTRAINT "space_place_deletion_pair_check"
    CHECK (("deleted_at" IS NULL) = ("deleted_by_user_id" IS NULL));

ALTER TABLE "post"
    ADD CONSTRAINT "post_body_length_check"
    CHECK (char_length(btrim("body")) BETWEEN 1 AND 1000),
    ADD CONSTRAINT "post_revision_check"
    CHECK ("revision" >= 1);

ALTER TABLE "comment"
    ADD CONSTRAINT "comment_body_length_check"
    CHECK (char_length(btrim("body")) BETWEEN 1 AND 1000),
    ADD CONSTRAINT "comment_revision_check"
    CHECK ("revision" >= 1);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_uidx" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_user_id_expires_at_idx" ON "session"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "session_expires_at_idx" ON "session"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_uidx" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_issuer_account_id_uidx" ON "account"("issuer", "account_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "space_created_by_user_id_idx" ON "space"("created_by_user_id");

-- CreateIndex
CREATE INDEX "space_membership_user_active_created_idx" ON "space_membership"("user_id", "revoked_at", "created_at" DESC);

-- CreatePartialUniqueIndex
CREATE UNIQUE INDEX "space_membership_active_owner_uidx"
ON "space_membership"("space_id")
WHERE "role" = 'OWNER' AND "revoked_at" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "space_invitation_token_hash_uidx" ON "space_invitation"("token_hash");

-- CreateIndex
CREATE INDEX "space_invitation_space_created_idx" ON "space_invitation"("space_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "space_invitation_created_by_user_id_idx" ON "space_invitation"("created_by_user_id");

-- CreateIndex
CREATE INDEX "space_invitation_revoked_by_user_id_idx" ON "space_invitation"("revoked_by_user_id");

-- CreatePartialUniqueIndex
CREATE UNIQUE INDEX "space_invitation_active_space_uidx"
ON "space_invitation"("space_id")
WHERE "revoked_at" IS NULL;

-- CreateIndex
CREATE INDEX "place_created_by_user_id_idx" ON "place"("created_by_user_id");

-- CreatePartialUniqueIndex
CREATE UNIQUE INDEX "place_provider_identity_uidx"
ON "place"("source_type", "provider_place_id")
WHERE "provider_place_id" IS NOT NULL;

-- CreateIndex
CREATE INDEX "space_place_space_active_created_idx" ON "space_place"("space_id", "deleted_at", "created_at" DESC);

-- CreateIndex
CREATE INDEX "space_place_place_id_idx" ON "space_place"("place_id");

-- CreateIndex
CREATE INDEX "space_place_added_by_user_id_idx" ON "space_place"("added_by_user_id");

-- CreateIndex
CREATE INDEX "space_place_deleted_by_user_id_idx" ON "space_place"("deleted_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "space_place_space_id_place_id_uidx" ON "space_place"("space_id", "place_id");

-- CreateIndex
CREATE INDEX "place_recommendation_user_created_idx" ON "place_recommendation"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "post_space_place_active_created_idx" ON "post"("space_place_id", "deleted_at", "created_at" DESC);

-- CreateIndex
CREATE INDEX "post_author_user_id_idx" ON "post"("author_user_id");

-- CreateIndex
CREATE INDEX "comment_post_active_created_idx" ON "comment"("post_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "comment_author_user_id_idx" ON "comment"("author_user_id");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space" ADD CONSTRAINT "space_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_membership" ADD CONSTRAINT "space_membership_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_membership" ADD CONSTRAINT "space_membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_invitation" ADD CONSTRAINT "space_invitation_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_invitation" ADD CONSTRAINT "space_invitation_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_invitation" ADD CONSTRAINT "space_invitation_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place" ADD CONSTRAINT "place_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_place" ADD CONSTRAINT "space_place_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_place" ADD CONSTRAINT "space_place_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_place" ADD CONSTRAINT "space_place_added_by_user_id_fkey" FOREIGN KEY ("added_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_place" ADD CONSTRAINT "space_place_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_recommendation" ADD CONSTRAINT "place_recommendation_space_place_id_fkey" FOREIGN KEY ("space_place_id") REFERENCES "space_place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_recommendation" ADD CONSTRAINT "place_recommendation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_space_place_id_fkey" FOREIGN KEY ("space_place_id") REFERENCES "space_place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
