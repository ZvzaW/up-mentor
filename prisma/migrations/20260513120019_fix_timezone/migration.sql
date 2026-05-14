-- AlterTable
ALTER TABLE "notification" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "refresh_token" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ;
