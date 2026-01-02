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
    "billingType" TEXT NOT NULL DEFAULT 'BILLABLE',
    "units" INTEGER NOT NULL DEFAULT 1,
    "cost" DECIMAL NOT NULL DEFAULT 0.00,
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
INSERT INTO "new_Case" ("assigneeId", "clinicId", "cost", "createdAt", "currency", "designedAt", "doctorName", "doctorUserId", "dueDate", "id", "invoiceId", "invoiced", "isRush", "material", "milledAt", "needsReview", "orderDate", "patientAlias", "product", "reviewDeadline", "reviewQuestion", "reviewRequestedAt", "shade", "shippedAt", "shippingCarrier", "shippingEta", "stage", "status", "toothCodes", "trackingNumber", "updatedAt") SELECT "assigneeId", "clinicId", "cost", "createdAt", "currency", "designedAt", "doctorName", "doctorUserId", "dueDate", "id", "invoiceId", "invoiced", "isRush", "material", "milledAt", "needsReview", "orderDate", "patientAlias", "product", "reviewDeadline", "reviewQuestion", "reviewRequestedAt", "shade", "shippedAt", "shippingCarrier", "shippingEta", "stage", "status", "toothCodes", "trackingNumber", "updatedAt" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
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
    "priceTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "bankName" TEXT,
    "bankLast4" TEXT,
    "routingNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Clinic" ("bankLast4", "bankName", "billingCycleDay", "city", "createdAt", "id", "name", "paymentTerms", "phone", "routingNumber", "state", "street", "taxId", "updatedAt", "zipCode") SELECT "bankLast4", "bankName", "billingCycleDay", "city", "createdAt", "id", "name", "paymentTerms", "phone", "routingNumber", "state", "street", "taxId", "updatedAt", "zipCode" FROM "Clinic";
DROP TABLE "Clinic";
ALTER TABLE "new_Clinic" RENAME TO "Clinic";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
