-- Reintroduce ImageSize enum semantics for SQLite by constraining Image.size
-- to the allowed mapped string values. SQLite has no native enums; Prisma
-- models enums as TEXT with a CHECK constraint. This migration also preserves
-- existing data, mapping known string values to themselves and nulling others.

PRAGMA foreign_keys=OFF;

-- Create the new Image table with CHECK constraint on size
CREATE TABLE "new_Image" (
    "id"           TEXT    NOT NULL PRIMARY KEY,
    "kind"         TEXT    NOT NULL,
    "url"          TEXT    NOT NULL,
    "mimeType"     TEXT    NOT NULL,
    "width"        INTEGER,
    "height"       INTEGER,
    "sizeBytes"    INTEGER NOT NULL,
    "originalName" TEXT,
    "prompt"       TEXT,
    "expandedPrompt" TEXT,
    "size"         TEXT CHECK ("size" IN ('512x512','768x768','1024x1024')),
    "seed"         TEXT,
    "baseImageId"  TEXT,
    "hasMask"      BOOLEAN DEFAULT false,
    "provider"     TEXT,
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    DATETIME NOT NULL
);

-- Copy data, normalizing size values into the allowed set
INSERT INTO "new_Image" (
    "id","kind","url","mimeType","width","height","sizeBytes","originalName",
    "prompt","expandedPrompt","size","seed","baseImageId","hasMask","provider",
    "createdAt","updatedAt"
) 
SELECT 
    "id","kind","url","mimeType","width","height","sizeBytes","originalName",
    "prompt","expandedPrompt",
    CASE "size"
      WHEN '512x512' THEN '512x512'
      WHEN '768x768' THEN '768x768'
      WHEN '1024x1024' THEN '1024x1024'
      ELSE NULL
    END AS "size",
    "seed","baseImageId","hasMask","provider",
    "createdAt","updatedAt"
FROM "Image";

-- Replace old table
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";

-- Recreate indexes to match Prisma schema
CREATE INDEX IF NOT EXISTS "Image_createdAt_idx" ON "Image" ("createdAt");
CREATE INDEX IF NOT EXISTS "Image_kind_createdAt_idx" ON "Image" ("kind", "createdAt");
CREATE INDEX IF NOT EXISTS "Image_baseImageId_idx" ON "Image" ("baseImageId");

PRAGMA foreign_keys=ON;
