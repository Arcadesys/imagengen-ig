-- CreateTable
CREATE TABLE "EmailSignup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "preferences" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailSignup_email_key" ON "EmailSignup"("email");

-- CreateIndex

-- CreateIndex
CREATE INDEX "EmailSignup_createdAt_idx" ON "EmailSignup"("createdAt");

-- CreateIndex
CREATE INDEX "EmailSignup_source_idx" ON "EmailSignup"("source");
