# Shopify Integration Setup Checklist

Use this checklist to ensure your Shopify storefront integration is properly configured.

## ✅ Pre-Setup

- [ ] Shopify Partner account created
- [ ] Development store created (for testing)
- [ ] Shopify app created in Partner Dashboard
- [ ] ngrok installed (for local development)

## ✅ Configuration Files

- [ ] `shopify.app.toml` updated with:
  - [ ] Your app client ID
  - [ ] Correct application URL
  - [ ] App proxy configuration
- [ ] `.env.local` contains:
  - [ ] `SHOPIFY_CLIENT_ID`
  - [ ] `SHOPIFY_CLIENT_SECRET`
  - [ ] All existing environment variables

## ✅ Shopify Partner Dashboard

- [ ] App created with correct name
- [ ] App URL configured (ngrok for dev, production for live)
- [ ] App proxy configured:
  - [ ] Subpath: `love-album`
  - [ ] Proxy URL: `https://your-domain.com/api/shopify-proxy/widget`
  - [ ] Prefix: `apps`
- [ ] Webhooks configured:
  - [ ] Orders/Paid → `/api/shopify/webhook`
  - [ ] Customer data request → `/api/shopify/gdpr/data-request`
  - [ ] Customer redact → `/api/shopify/gdpr/redact`
  - [ ] Shop redact → `/api/shopify/gdpr/shop-redact`
- [ ] Access scopes defined (minimum: `read_products`, `read_customers`)

## ✅ Local Development Setup

- [ ] Dependencies installed (`npm install`)
- [ ] Database migrated (`npx prisma migrate dev`)
- [ ] Next.js app running (`npm run dev`)
- [ ] ngrok tunnel started (`ngrok http 3000`)
- [ ] `NEXTAUTH_URL` updated with ngrok URL
- [ ] Shopify Partner Dashboard updated with ngrok URL

## ✅ Testing

- [ ] App installed on development store
- [ ] Can access widget at `https://dev-store.myshopify.com/apps/love-album`
- [ ] Signature verification working (no 401 errors)
- [ ] Widget loads in iframe
- [ ] Story form submission works
- [ ] Google authentication works
- [ ] Payment flow completes
- [ ] Webhook received and processed
- [ ] Album unlocked after payment

## ✅ Production Deployment

- [ ] App deployed to production (Vercel/hosting)
- [ ] Environment variables set in production
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] SSL certificate valid
- [ ] Shopify Partner Dashboard updated with production URLs
- [ ] `shopify.app.toml` updated with production URLs
- [ ] Webhooks tested on production

## ✅ Merchant Experience

- [ ] Installation flow tested
- [ ] App accessible at `/apps/love-album` on merchant store
- [ ] Widget responsive on mobile
- [ ] Widget integrates well with different themes
- [ ] Payment processing works
- [ ] Email notifications sent
- [ ] Customer receives album access

## ✅ Documentation

- [ ] Merchant installation guide created
- [ ] Support documentation prepared
- [ ] Troubleshooting steps documented
- [ ] Environment variables documented

## ✅ Optional Enhancements

- [ ] Theme app extension created (for deeper integration)
- [ ] Analytics tracking implemented
- [ ] Multi-language support configured
- [ ] Custom merchant settings page

## 🚀 Ready for Production

When all checkboxes above are complete, your Shopify integration is ready!

## 📞 Need Help?

Refer to:
- [SHOPIFY_INTEGRATION.md](./SHOPIFY_INTEGRATION.md) - Complete integration guide
- [Shopify App Development Docs](https://shopify.dev/docs/apps)
- [Shopify Partner Dashboard](https://partners.shopify.com/)

---

**Last Updated**: 2025-10-25
