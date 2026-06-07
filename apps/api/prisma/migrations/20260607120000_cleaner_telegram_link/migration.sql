-- AlterTable: link code for Telegram cleaner onboarding deep-links
ALTER TABLE "Cleaner" ADD COLUMN "tgLinkCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Cleaner_tgLinkCode_key" ON "Cleaner"("tgLinkCode");
