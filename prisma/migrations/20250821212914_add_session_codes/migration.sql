-- CreateTable
CREATE TABLE "SessionCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "maxGenerations" INTEGER NOT NULL DEFAULT 10,
    "usedGenerations" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SessionCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionCode_code_key" ON "SessionCode"("code");

-- CreateIndex
CREATE INDEX "SessionCode_code_idx" ON "SessionCode"("code");

-- CreateIndex
CREATE INDEX "SessionCode_isActive_idx" ON "SessionCode"("isActive");

-- CreateIndex
CREATE INDEX "SessionCode_createdAt_idx" ON "SessionCode"("createdAt");
