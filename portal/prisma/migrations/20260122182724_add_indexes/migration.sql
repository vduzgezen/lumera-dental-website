-- CreateIndex
CREATE INDEX "Case_clinicId_idx" ON "Case"("clinicId");

-- CreateIndex
CREATE INDEX "Case_doctorUserId_idx" ON "Case"("doctorUserId");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_createdAt_idx" ON "Case"("createdAt");
