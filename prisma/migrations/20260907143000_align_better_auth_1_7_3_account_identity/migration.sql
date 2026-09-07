-- DropIndex
DROP INDEX "account_issuer_account_id_uidx";

-- AlterTable
ALTER TABLE "account" DROP COLUMN "issuer";

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_id_account_id_uidx" ON "account"("provider_id", "account_id");
