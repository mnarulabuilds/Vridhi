-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING');
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'LINKED', 'SYNCING', 'ERROR', 'DISCONNECTED');
CREATE TYPE "AssetClass" AS ENUM ('EQUITY', 'MUTUAL_FUND', 'ETF', 'DEBT', 'CRYPTO', 'REAL_ESTATE', 'OTHER');
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED');
CREATE TYPE "ReportKind" AS ENUM ('MONTHLY_GROWTH', 'NET_WORTH', 'PORTFOLIO', 'TAX_SUMMARY');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

ALTER TABLE "accounts" ADD COLUMN "externalAccountId" TEXT;

ALTER TABLE "transactions" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_externalAccountId_key" ON "accounts"("externalAccountId");
CREATE INDEX "transactions_accountId_externalId_idx" ON "transactions"("accountId", "externalId");

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" TEXT,
    "externalCustomerId" TEXT,
    "externalSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "adsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "financial_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "institutionName" TEXT,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "externalItemId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "external_accounts" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mask" TEXT,
    "type" "AccountType" NOT NULL DEFAULT 'OTHER_ASSET',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetClass" "AssetClass" NOT NULL DEFAULT 'OTHER',
    "quantity" DECIMAL(18,6) NOT NULL,
    "costBasis" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "lastPrice" DECIMAL(15,4),
    "lastPriceAt" TIMESTAMP(3),
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "currentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_runs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ReportKind" NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_userId_key" ON "user_subscriptions"("userId");
CREATE INDEX "financial_connections_userId_idx" ON "financial_connections"("userId");
CREATE INDEX "financial_connections_userId_provider_idx" ON "financial_connections"("userId", "provider");
CREATE UNIQUE INDEX "external_accounts_connectionId_externalId_key" ON "external_accounts"("connectionId", "externalId");
CREATE INDEX "external_accounts_connectionId_idx" ON "external_accounts"("connectionId");
CREATE INDEX "holdings_userId_idx" ON "holdings"("userId");
CREATE INDEX "holdings_userId_symbol_idx" ON "holdings"("userId", "symbol");
CREATE INDEX "goals_userId_status_idx" ON "goals"("userId", "status");
CREATE INDEX "report_runs_userId_kind_createdAt_idx" ON "report_runs"("userId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_externalAccountId_fkey" FOREIGN KEY ("externalAccountId") REFERENCES "external_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "financial_connections" ADD CONSTRAINT "financial_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_accounts" ADD CONSTRAINT "external_accounts_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "financial_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
