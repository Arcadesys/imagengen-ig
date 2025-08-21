-- CreateIndex
CREATE INDEX "Image_createdAt_idx" ON "Image"("createdAt");

-- CreateIndex
CREATE INDEX "Image_kind_createdAt_idx" ON "Image"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "Image_baseImageId_idx" ON "Image"("baseImageId");
