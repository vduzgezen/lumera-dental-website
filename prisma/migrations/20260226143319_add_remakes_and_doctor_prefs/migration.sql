/*
  Warnings:

  - You are about to drop the column `designPreferences` on the `Case` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Case" DROP COLUMN "designPreferences",
ADD COLUMN     "doctorPreferences" TEXT,
ADD COLUMN     "hasRemakeInsurance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRemake" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalCaseId" TEXT,
ADD COLUMN     "remakeType" TEXT;
