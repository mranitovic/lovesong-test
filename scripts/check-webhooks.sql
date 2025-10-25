-- View recent webhooks
SELECT
  "id",
  "topic",
  "shopifyOrderId",
  "verified",
  "processed",
  "error",
  "createdAt"
FROM "WebhookLog"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Count webhooks by status
SELECT
  "processed",
  "verified",
  COUNT(*) as count
FROM "WebhookLog"
GROUP BY "processed", "verified";

-- View failed webhooks
SELECT
  "id",
  "topic",
  "shopifyOrderId",
  "error",
  "payload",
  "createdAt"
FROM "WebhookLog"
WHERE "processed" = false OR "error" IS NOT NULL
ORDER BY "createdAt" DESC;

-- View successful payments processed
SELECT
  w."id",
  w."shopifyOrderId",
  w."createdAt" as webhook_received_at,
  a."hasPaid",
  a."paidAt",
  p."amount"
FROM "WebhookLog" w
LEFT JOIN "AlbumSession" a ON a."id" = w."albumSessionId"
LEFT JOIN "Purchase" p ON p."orderId" = w."shopifyOrderId"
WHERE w."processed" = true
ORDER BY w."createdAt" DESC
LIMIT 10;
