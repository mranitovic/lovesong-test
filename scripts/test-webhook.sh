#!/bin/bash

# Shopify Webhook Tester Script
# This script tests the Shopify webhook endpoint with a mock order payload

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔔 Shopify Webhook Tester${NC}"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env with your environment variables"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Configuration
WEBHOOK_URL="${1:-http://localhost:3000/api/shopify/webhook}"
USER_EMAIL="${2:-}"
ALBUM_SESSION_ID="${3:-}"

echo -e "${YELLOW}ℹ️  Configuration:${NC}"
echo "Webhook URL: $WEBHOOK_URL"
echo "Webhook Secret: ${SHOPIFY_WEBHOOK_SECRET:0:10}..."
echo ""

# Prompt for user email if not provided
if [ -z "$USER_EMAIL" ]; then
    echo -e "${YELLOW}Enter user email (must exist in database):${NC}"
    read -r USER_EMAIL
    echo ""
fi

# Prompt for album session ID if not provided
if [ -z "$ALBUM_SESSION_ID" ]; then
    echo -e "${YELLOW}Enter album session ID (optional, press Enter to skip):${NC}"
    read -r ALBUM_SESSION_ID
    echo ""
fi

# Generate random order ID
ORDER_ID=$(date +%s)$(( RANDOM % 1000 ))
CHECKOUT_ID=$(( ORDER_ID + 1000 ))

echo -e "${BLUE}📦 Creating test order...${NC}"
echo "Order ID: $ORDER_ID"
echo "User Email: $USER_EMAIL"
[ -n "$ALBUM_SESSION_ID" ] && echo "Album Session ID: $ALBUM_SESSION_ID"
echo ""

# Build payload
if [ -n "$ALBUM_SESSION_ID" ]; then
    PAYLOAD=$(cat <<EOF
{
  "id": $ORDER_ID,
  "email": "$USER_EMAIL",
  "financial_status": "paid",
  "total_price": "100.00",
  "currency": "BRL",
  "checkout_id": $CHECKOUT_ID,
  "payment_gateway_names": ["pix"],
  "note": "Album Session: $ALBUM_SESSION_ID",
  "note_attributes": [
    {
      "name": "album_session_id",
      "value": "$ALBUM_SESSION_ID"
    },
    {
      "name": "user_email",
      "value": "$USER_EMAIL"
    }
  ],
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)
else
    PAYLOAD=$(cat <<EOF
{
  "id": $ORDER_ID,
  "email": "$USER_EMAIL",
  "financial_status": "paid",
  "total_price": "100.00",
  "currency": "BRL",
  "checkout_id": $CHECKOUT_ID,
  "payment_gateway_names": ["pix"],
  "note": "Test order from webhook script",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)
fi

# Check if SHOPIFY_WEBHOOK_SECRET is set
if [ -z "$SHOPIFY_WEBHOOK_SECRET" ]; then
    echo -e "${RED}❌ Error: SHOPIFY_WEBHOOK_SECRET not found in .env${NC}"
    exit 1
fi

# Generate HMAC signature
echo -e "${BLUE}🔐 Generating HMAC signature...${NC}"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SHOPIFY_WEBHOOK_SECRET" -binary | base64)
echo "Signature: ${SIGNATURE:0:20}..."
echo ""

# Send webhook request
echo -e "${BLUE}📤 Sending webhook request...${NC}"
echo ""

# Create temp file for response
TEMP_RESPONSE=$(mktemp)
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$TEMP_RESPONSE" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/paid" \
  -H "X-Shopify-Hmac-Sha256: $SIGNATURE" \
  -H "X-Shopify-Shop-Domain: test-shop.myshopify.com" \
  -H "X-Shopify-Order-Id: $ORDER_ID" \
  -d "$PAYLOAD")

# Read response body
HTTP_BODY=$(cat "$TEMP_RESPONSE")
rm "$TEMP_RESPONSE"

echo -e "${YELLOW}Response Status: $HTTP_CODE${NC}"
echo -e "${YELLOW}Response Body:${NC}"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
echo ""

# Check response
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Webhook processed successfully!${NC}"
    echo ""
    echo -e "${BLUE}💡 Next steps:${NC}"
    echo "1. Check your database for the updated AlbumSession"
    echo "2. Check WebhookLog table: SELECT * FROM \"WebhookLog\" ORDER BY \"createdAt\" DESC LIMIT 1;"
    echo "3. Check Purchase table: SELECT * FROM \"Purchase\" WHERE \"orderId\" = '$ORDER_ID';"
    echo "4. Check if emails were sent to: $USER_EMAIL"
else
    echo -e "${RED}❌ Webhook failed with status code: $HTTP_CODE${NC}"
    echo ""
    echo -e "${BLUE}💡 Troubleshooting:${NC}"
    echo "1. Check that the user email exists in your database"
    echo "2. Verify SHOPIFY_WEBHOOK_SECRET in .env is correct"
    echo "3. Check webhook logs: SELECT * FROM \"WebhookLog\" WHERE \"shopifyOrderId\" = '$ORDER_ID';"
    echo "4. Review server logs for detailed error messages"
fi

echo ""
echo "================================"
