/*
  Warnings:

  - You are about to drop the column `userId` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Clinic` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Clinic` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `Clinic` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `Clinic` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Made the column `city` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `street` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `zipCode` on table `Address` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT DEFAULT 'USA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Address" ("city", "country", "id", "state", "street", "zipCode") SELECT "city", "country", "id", "state", "street", "zipCode" FROM "Address";
DROP TABLE "Address";
ALTER TABLE "new_Address" RENAME TO "Address";
CREATE TABLE "new_Clinic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "addressId" TEXT,
    "phone" TEXT,
    "billingCycleDay" INTEGER NOT NULL DEFAULT 1,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "taxId" TEXT,
    "priceTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "bankName" TEXT,
    "bankLast4" TEXT,
    "routingNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Clinic_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Clinic" ("bankLast4", "bankName", "billingCycleDay", "createdAt", "id", "name", "paymentTerms", "phone", "priceTier", "routingNumber", "taxId", "updatedAt") SELECT "bankLast4", "bankName", "billingCycleDay", "createdAt", "id", "name", "paymentTerms", "phone", "priceTier", "routingNumber", "taxId", "updatedAt" FROM "Clinic";
DROP TABLE "Clinic";
ALTER TABLE "new_Clinic" RENAME TO "Clinic";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "phoneNumber" TEXT,
    "preferenceNote" TEXT,
    "role" TEXT NOT NULL,
    "clinicId" TEXT,
    "addressId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("clinicId", "createdAt", "email", "id", "name", "password", "phoneNumber", "preferenceNote", "role", "updatedAt") SELECT "clinicId", "createdAt", "email", "id", "name", "password", "phoneNumber", "preferenceNote", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
