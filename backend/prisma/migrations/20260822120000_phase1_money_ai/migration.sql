-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "categoryId" TEXT,
ADD COLUMN "transferToAccountId" TEXT,
ADD COLUMN "importHash" TEXT;

-- Backfill categoryId from the legacy free-text category column when a matching user category exists
UPDATE "transactions" t
SET "categoryId" = c.id
FROM "accounts" a, "categories" c
WHERE t."accountId" = a.id
  AND c."userId" = a."userId"
  AND c.name = t.category
  AND c.type = t.type
  AND t.type <> 'TRANSFER'
  AND t."categoryId" IS NULL;

-- Create fallback categories for unmatched non-transfer rows
INSERT INTO "categories" ("id", "name", "type", "userId", "isArchived", "createdAt", "updatedAt")
SELECT DISTINCT
  'c' || substr(md5(a."userId" || ':' || t.category || ':' || t.type::text), 1, 24),
  t.category,
  t.type,
  a."userId",
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "transactions" t
JOIN "accounts" a ON a.id = t."accountId"
WHERE t.type <> 'TRANSFER'
  AND t."categoryId" IS NULL
  AND t.category IS NOT NULL
  AND t.category <> ''
ON CONFLICT ("userId", "name", "type") DO NOTHING;

UPDATE "transactions" t
SET "categoryId" = c.id
FROM "accounts" a, "categories" c
WHERE t."accountId" = a.id
  AND c."userId" = a."userId"
  AND c.name = t.category
  AND c.type = t.type
  AND t.type <> 'TRANSFER'
  AND t."categoryId" IS NULL;

ALTER TABLE "transactions" DROP COLUMN "category";

CREATE UNIQUE INDEX "transactions_accountId_importHash_key" ON "transactions"("accountId", "importHash");
CREATE INDEX "transactions_accountId_transactionDate_idx" ON "transactions"("accountId", "transactionDate");
CREATE INDEX "transactions_categoryId_idx" ON "transactions"("categoryId");
CREATE INDEX "transactions_transferToAccountId_idx" ON "transactions"("transferToAccountId");

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transferToAccountId_fkey" FOREIGN KEY ("transferToAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_conversations_userId_idx" ON "ai_conversations"("userId");
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT');

CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_messages_conversationId_idx" ON "ai_messages"("conversationId");
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
