-- CreateTable
CREATE TABLE "CaseComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseComment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'DESIGN',
    "designedAt" DATETIME,
    "milledAt" DATETIME,
    "shippedAt" DATETIME,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewQuestion" TEXT,
    "reviewRequestedAt" DATETIME,
    "shippingCarrier" TEXT,
    "trackingNumber" TEXT,
    "shippingEta" DATETIME,
    CONSTRAINT "Case_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Case" ("clinicId", "createdAt", "dueDate", "id", "material", "patientAlias", "shade", "status", "toothCodes", "updatedAt") SELECT "clinicId", "createdAt", "dueDate", "id", "material", "patientAlias", "shade", "status", "toothCodes", "updatedAt" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
