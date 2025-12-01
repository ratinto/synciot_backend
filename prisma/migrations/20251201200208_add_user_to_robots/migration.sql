-- AlterTable
ALTER TABLE "robots" ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE INDEX "robots_userId_idx" ON "robots"("userId");

-- AddForeignKey
ALTER TABLE "robots" ADD CONSTRAINT "robots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
