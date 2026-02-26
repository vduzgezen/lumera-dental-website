-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "millingCenterId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "millingCenterId" TEXT;

-- CreateTable
CREATE TABLE "MillingCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MillingCenter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Case_millingCenterId_idx" ON "Case"("millingCenterId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_millingCenterId_fkey" FOREIGN KEY ("millingCenterId") REFERENCES "MillingCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_millingCenterId_fkey" FOREIGN KEY ("millingCenterId") REFERENCES "MillingCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
