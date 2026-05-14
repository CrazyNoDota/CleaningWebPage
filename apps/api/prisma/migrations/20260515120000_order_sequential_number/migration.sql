-- Human-friendly sequential order reference. SERIAL creates a sequence and
-- backfills existing rows with sequential values; the uuid "id" stays the PK.
ALTER TABLE "Order" ADD COLUMN "orderNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
