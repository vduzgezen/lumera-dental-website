-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "shippingBatchId" TEXT,
ADD COLUMN     "shippingCost" DECIMAL(65,30) DEFAULT 0.00;

-- CreateIndex
CREATE INDEX "Case_orderDate_idx" ON "Case"("orderDate");
