ALTER TABLE "OrderItem" ADD COLUMN "pieces" INTEGER NOT NULL DEFAULT 8;

DROP INDEX "OrderItem_orderId_cakeId_key";

CREATE UNIQUE INDEX "OrderItem_orderId_cakeId_pieces_key"
ON "OrderItem"("orderId", "cakeId", "pieces");
