-- CreateTable
CREATE TABLE "Cake" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎂'
);

-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "cakeId" INTEGER,
    "flavor" TEXT,
    "toppings" TEXT,
    "sizeKg" REAL,
    "message" TEXT,
    "notes" TEXT,
    "pickupDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_cakeId_fkey" FOREIGN KEY ("cakeId") REFERENCES "Cake" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
