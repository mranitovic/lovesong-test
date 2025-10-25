/*
  Warnings:

  - A unique constraint covering the columns `[shopifyCheckoutId]` on the table `AlbumSession` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."AlbumSession" ADD COLUMN     "shopifyCheckoutId" TEXT,
ADD COLUMN     "webhookProcessedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Purchase" ADD COLUMN     "emailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."WebhookLog" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "shopifyOrderId" TEXT,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "albumSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookLog_shopifyOrderId_idx" ON "public"."WebhookLog"("shopifyOrderId");

-- CreateIndex
CREATE INDEX "WebhookLog_topic_createdAt_idx" ON "public"."WebhookLog"("topic", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookLog_processed_createdAt_idx" ON "public"."WebhookLog"("processed", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumSession_shopifyCheckoutId_key" ON "public"."AlbumSession"("shopifyCheckoutId");

-- CreateIndex
CREATE INDEX "AlbumSession_shopifyCheckoutId_idx" ON "public"."AlbumSession"("shopifyCheckoutId");

-- CreateIndex
CREATE INDEX "AlbumSession_userId_hasPaid_idx" ON "public"."AlbumSession"("userId", "hasPaid");
