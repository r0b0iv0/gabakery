/*
  Warnings:

  - You are about to drop the column `isCustom` on the `Order` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cakeId" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "pickupDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,
    CONSTRAINT "Order_cakeId_fkey" FOREIGN KEY ("cakeId") REFERENCES "Cake" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("cakeId", "createdAt", "createdById", "customerName", "id", "notes", "phone", "pickupDate", "status") SELECT "cakeId", "createdAt", "createdById", "customerName", "id", "notes", "phone", "pickupDate", "status" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
