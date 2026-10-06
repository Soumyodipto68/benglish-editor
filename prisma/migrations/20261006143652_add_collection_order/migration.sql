-- AlterTable
ALTER TABLE "CollectionWork" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "CollectionWork_collectionId_order_idx" ON "CollectionWork"("collectionId", "order");
