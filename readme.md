# AI Love Story Album Generator

## 🎵 Real Suno API Integration Complete!

This POC now features **full integration with the real Suno API v4** for professional music generation and **Shopify storefront integration** for e-commerce deployment.

### ✨ Features

- **Story Analysis**: OpenAI GPT-4 analyzes your love story and creates 5 song concepts
- **Real Music Generation**: Suno API v4 generates actual professional-quality songs
- **Shopify Integration**: Seamless custom store integration via Storefront API
- **Payment Processing**: Integrated Shopify checkout with webhook fulfillment
- **Audio Players**: Built-in players with download functionality
- **Multi-language Support**: i18n ready with next-intl
- **Production Ready**: Real API integrations and comprehensive error handling

### 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up API Keys** (Required)
   ```bash
   cp .env.local.example .env.local
   # Add your API keys to .env.local - both are required!
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open** http://localhost:3000 and create your album!

### 🔑 API Keys

#### Suno API (Music Generation) - REQUIRED
- Get your key: https://sunoapi.org/api-key  
- Real music generation with Suno v4
- Required for the application to function

#### OpenAI API (Story Analysis) - REQUIRED
- Get your key: https://platform.openai.com/api-keys  
- Required for story analysis (cover generation temporarily disabled)

### 🎼 How It Works

1. **Enter your love story** (minimum 50 characters)
2. **AI analyzes** your story into 5 song themes
3. **Suno generates** real music for each theme
4. **Listen and download** your songs

### 💡 Production Ready Features

- **Async Processing**: Real-time task polling for music generation
- **Rate Limiting**: Respects Suno's API limits (20 req/10s)
- **Error Handling**: Comprehensive error recovery and user feedback
- **Timeout Protection**: 15-minute generation timeout
- **Progressive Polling**: Smart backoff for task completion

### 📁 Project Structure

```
src/
  app/api/           # API endpoints
  components/        # React components  
  lib/
    suno.ts         # Real Suno API integration
    openai.ts       # OpenAI integration
  types/            # TypeScript definitions
```

### 🛍️ Shopify Integration

Perfect integration for **custom Shopify stores** using Storefront API - no Partner account required!

#### Custom Store Integration (Recommended)

**Best for: Your own store** - Seamless checkout experience with direct Storefront API integration

- ✅ No Partner account required
- ✅ Perfect checkout flow integration
- ✅ Direct Storefront API access
- ✅ Embeddable page templates (Liquid)
- ✅ Native Shopify checkout
- ✅ Simple setup (< 30 minutes)

**Setup Guide**: [PERFECT_CUSTOM_STORE_INTEGRATION.md](./PERFECT_CUSTOM_STORE_INTEGRATION.md)

**Quick Start:**
1. Configure Storefront API credentials
2. Add Liquid template to theme
3. Create product in Shopify
4. Configure webhooks
5. Deploy and test!

#### Alternative Options:

**Simple Embed** (No Partner Account)
- Basic iframe embedding
- **See**: [SHOPIFY_EMBED_GUIDE.md](./SHOPIFY_EMBED_GUIDE.md)

**Full App Proxy** (Requires Partner Account)
- Multi-merchant distribution
- **See**: [SHOPIFY_INTEGRATION.md](./SHOPIFY_INTEGRATION.md)

### 📖 Documentation

**Shopify Integration:**
- [PERFECT_CUSTOM_STORE_INTEGRATION.md](./PERFECT_CUSTOM_STORE_INTEGRATION.md) - **RECOMMENDED** Custom store setup
- [shopify-templates/README.md](./shopify-templates/README.md) - Liquid template guide
- [SHOPIFY_EMBED_GUIDE.md](./SHOPIFY_EMBED_GUIDE.md) - Simple embed approach
- [SHOPIFY_INTEGRATION.md](./SHOPIFY_INTEGRATION.md) - App Proxy approach (requires Partner)

**Technical:**
- [SUNO_INTEGRATION.md](./SUNO_INTEGRATION.md) - Suno API implementation guide
- [PROJECT_PLAN.md](./PROJECT_PLAN.md) - Original project planning

### 🛠 Tech Stack

- **Next.js 14** with TypeScript & App Router
- **Shopify Storefront API** for seamless checkout integration
- **Suno API v4** for music generation
- **OpenAI GPT-4** for story analysis
- **NextAuth.js** for authentication
- **Prisma** + **PostgreSQL** for database
- **TailwindCSS** for styling
- **next-intl** for internationalization

### 🎯 Ready for Production

The integration is production-ready with:
- Real API endpoints
- Proper error handling
- Rate limiting compliance
- Async task processing
- Comprehensive logging

---

**Create your AI-powered love story album today!** 🎵💕
