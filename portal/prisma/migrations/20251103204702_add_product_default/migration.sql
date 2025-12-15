/*
  Warnings:

  - You are about to drop the column `label` on the `CaseFile` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "patientAlias" TEXT NOT NULL,
    "toothCodes" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "product" TEXT NOT NULL DEFAULT 'ZIRCONIA',
    "material" TEXT,
    "shade" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'IN_DESIGN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'DESIGN',
    "designedAt" DATETIME,
    "milledAt" DATETIME,
    "shippedAt" DATETIME,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewQuestion" TEXT,
    "reviewRequestedAt" DATETIME,
    "reviewDeadline" DATETIME,
    "shippingCarrier" TEXT,
    "trackingNumber" TEXT,
    "shippingEta" DATETIME,
    CONSTRAINT "Case_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Case" ("clinicId", "createdAt", "designedAt", "dueDate", "id", "material", "milledAt", "needsReview", "patientAlias", "reviewDeadline", "reviewQuestion", "reviewRequestedAt", "shade", "shippedAt", "shippingCarrier", "shippingEta", "stage", "status", "toothCodes", "trackingNumber", "updatedAt") SELECT "clinicId", "createdAt", "designedAt", "dueDate", "id", "material", "milledAt", "needsReview", "patientAlias", "reviewDeadline", "reviewQuestion", "reviewRequestedAt", "shade", "shippedAt", "shippingCarrier", "shippingEta", "stage", "status", "toothCodes", "trackingNumber", "updatedAt" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
CREATE TABLE "new_CaseFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseFile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CaseFile" ("caseId", "createdAt", "id", "kind", "sizeBytes", "url") SELECT "caseId", "createdAt", "id", "kind", "sizeBytes", "url" FROM "CaseFile";
DROP TABLE "CaseFile";
ALTER TABLE "new_CaseFile" RENAME TO "CaseFile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
