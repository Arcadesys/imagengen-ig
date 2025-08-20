-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" INTEGER NOT NULL,
    "originalName" TEXT,
    "prompt" TEXT,
    "expandedPrompt" TEXT,
    "size" TEXT,
    "seed" TEXT,
    "baseImageId" TEXT,
    "hasMask" BOOLEAN DEFAULT false,
    "provider" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImageBlob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" BLOB NOT NULL,
    CONSTRAINT "ImageBlob_id_fkey" FOREIGN KEY ("id") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
