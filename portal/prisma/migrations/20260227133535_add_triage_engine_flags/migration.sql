-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "actionRequiredBy" TEXT,
ADD COLUMN     "unreadForDoctor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unreadForLab" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "requiresStrictDesignApproval" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Case_actionRequiredBy_idx" ON "Case"("actionRequiredBy");
