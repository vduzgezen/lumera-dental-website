-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "salesRepId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "salesRepId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
