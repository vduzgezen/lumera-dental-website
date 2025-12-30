/*
  Warnings:

  - Added the required column `updatedAt` to the `Clinic` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "preferenceNote" TEXT;

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "dueDate" DATETIME NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "method" TEXT NOT NULL,
    "referenceId" TEXT,
    "postedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "doctorUserId" TEXT,
    "assigneeId" TEXT,
    "patientAlias" TEXT NOT NULL,
    "doctorName" TEXT,
    "toothCodes" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "product" TEXT NOT NULL DEFAULT 'ZIRCONIA',
    "material" TEXT,
    "shade" TEXT,
    "cost" DECIMAL NOT NULL DEFAULT 60.00,
    "isRush" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "invoiced" BOOLEAN NOT NULL DEFAULT false,
    "invoiceId" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'IN_DESIGN',
    "stage" TEXT NOT NULL DEFAULT 'DESIGN',
    "designedAt" DATETIME,
    "milledAt" DATETIME,
    "shippedAt" DATETIME,
    "shippingCarrier" TEXT,
    "trackingNumber" TEXT,
    "shippingEta" DATETIME,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewQuestion" TEXT,
    "reviewRequestedAt" DATETIME,
    "reviewDeadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Case_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_doctorUserId_fkey" FOREIGN KEY ("doctorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Case" ("clinicId", "createdAt", "designedAt", "doctorName", "doctorUserId", "dueDate", "id", "material", "milledAt", "needsReview", "orderDate", "patientAlias", "product", "reviewDeadline", "reviewQuestion", "reviewRequestedAt", "shade", "shippedAt", "shippingCarrier", "shippingEta", "stage", "status", "toothCodes", "trackingNumber", "updatedAt") SELECT "clinicId", "createdAt", "designedAt", "doctorName", "doctorUserId", "dueDate", "id", "material", "milledAt", "needsReview", "orderDate", "patientAlias", "product", "reviewDeadline", "reviewQuestion", "reviewRequestedAt", "shade", "shippedAt", "shippingCarrier", "shippingEta", "stage", "status", "toothCodes", "trackingNumber", "updatedAt" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
CREATE TABLE "new_CaseFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "label" TEXT,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentId" TEXT,
    CONSTRAINT "CaseFile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CaseFile_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "CaseComment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CaseFile" ("caseId", "createdAt", "id", "kind", "label", "sizeBytes", "url") SELECT "caseId", "createdAt", "id", "kind", "label", "sizeBytes", "url" FROM "CaseFile";
DROP TABLE "CaseFile";
ALTER TABLE "new_CaseFile" RENAME TO "CaseFile";
CREATE TABLE "new_Clinic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "billingCycleDay" INTEGER NOT NULL DEFAULT 1,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "taxId" TEXT,
    "bankName" TEXT,
    "bankLast4" TEXT,
    "routingNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Clinic" ("id", "name") SELECT "id", "name" FROM "Clinic";
DROP TABLE "Clinic";
ALTER TABLE "new_Clinic" RENAME TO "Clinic";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
