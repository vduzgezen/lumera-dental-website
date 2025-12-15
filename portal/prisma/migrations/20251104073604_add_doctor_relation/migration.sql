-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "doctorUserId" TEXT,
    "patientAlias" TEXT NOT NULL,
    "doctorName" TEXT,
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
    CONSTRAINT "Case_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_doctorUserId_fkey" FOREIGN KEY ("doctorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Case" ("clinicId", "createdAt", "designedAt", "doctorName", "dueDate", "id", "material", "milledAt", "needsReview", "orderDate", "patientAlias", "product", "reviewDeadline", "reviewQuestion", "reviewRequestedAt", "shade", "shippedAt", "shippingCarrier", "shippingEta", "stage", "status", "toothCodes", "trackingNumber", "updatedAt") SELECT "clinicId", "createdAt", "designedAt", "doctorName", "dueDate", "id", "material", "milledAt", "needsReview", "orderDate", "patientAlias", "product", "reviewDeadline", "reviewQuestion", "reviewRequestedAt", "shade", "shippedAt", "shippingCarrier", "shippingEta", "stage", "status", "toothCodes", "trackingNumber", "updatedAt" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
