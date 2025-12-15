-- AlterTable
ALTER TABLE "CaseFile" ADD COLUMN "label" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "patientAlias" TEXT NOT NULL,
    "toothCodes" TEXT NOT NULL,
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
INSERT INTO "new_Case" ("clinicId", "createdAt", "designedAt", "dueDate", "id", "material", "milledAt", "needsReview", "patientAlias", "reviewQuestion", "reviewRequestedAt", "shade", "shippedAt", "shippingCarrier", "shippingEta", "stage", "status", "toothCodes", "trackingNumber", "updatedAt") SELECT "clinicId", "createdAt", "designedAt", "dueDate", "id", "material", "milledAt", "needsReview", "patientAlias", "reviewQuestion", "reviewRequestedAt", "shade", "shippedAt", "shippingCarrier", "shippingEta", "stage", "status", "toothCodes", "trackingNumber", "updatedAt" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
