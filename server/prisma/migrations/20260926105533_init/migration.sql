/*
  Warnings:

  - You are about to drop the column `flavor` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `sizeKg` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `toppings` on the `Order` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Ingredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ingredientId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "lowStockThreshold" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventory_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cakeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recipe_cakeId_fkey" FOREIGN KEY ("cakeId") REFERENCES "Cake" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recipeId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL,
    CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "cakeId" INTEGER,
    "notes" TEXT,
    "pickupDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,
    CONSTRAINT "Order_cakeId_fkey" FOREIGN KEY ("cakeId") REFERENCES "Cake" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("cakeId", "createdAt", "createdById", "customerName", "id", "isCustom", "notes", "phone", "pickupDate", "status") SELECT "cakeId", "createdAt", "createdById", "customerName", "id", "isCustom", "notes", "phone", "pickupDate", "status" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_ingredientId_key" ON "Inventory"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_cakeId_key" ON "Recipe"("cakeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_ingredientId_key" ON "RecipeIngredient"("recipeId", "ingredientId");
