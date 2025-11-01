# Shopify Templates - Updated Configuration

## ✅ Changes Made

All Shopify Liquid template files have been updated to point to your live Vercel deployment.

### Updated Files:

#### 1. `shopify-templates/love-album-page-section.liquid`
- **Line 32:** iframe src changed from `https://love-stories.ai/embed` to `https://poc-songs-album.vercel.app/en`
- **Line 102:** postMessage origin check changed to `https://poc-songs-album.vercel.app`
- **Line 115:** postMessage origin check changed to `https://poc-songs-album.vercel.app`

#### 2. `shopify-templates/section-love-album-embed.liquid`
- **Line 31:** iframe src changed from `https://YOUR_APP_DOMAIN/embed` to `https://poc-songs-album.vercel.app/en`
- **Line 105:** postMessage origin check changed to `https://poc-songs-album.vercel.app`
- **Line 116:** postMessage origin check changed to `https://poc-songs-album.vercel.app`

#### 3. `shopify-templates/README.md`
- Updated configuration section with correct domain
- Updated troubleshooting guides with correct URLs
- Added note about using `/en` instead of `/embed`

## 📋 Next Steps - Upload to Shopify

Now you need to upload these updated files to your Shopify store:

### Option 1: Full Page Template (Recommended)

1. **Go to Shopify Admin:** Online Store > Themes > Edit Code

2. **Upload the Section:**
   - In left sidebar, find **"Sections"** folder
   - Right-click and select "Add file" or look for existing `love-album-page-section`
   - If exists: Click it and replace all content
   - If new: Name it `love-album-page-section` (without `.liquid`)
   - Copy/paste code from: `shopify-templates/love-album-page-section.liquid`
   - **Save** (Ctrl+S / Cmd+S)

3. **Upload the JSON Template:**
   - In left sidebar, find **"Templates"** folder
   - Right-click and select "Add file" or look for existing `page.love-album.json`
   - If exists: Click it and replace content
   - If new: Name it `page.love-album.json`
   - Copy/paste code from: `shopify-templates/page.love-album.json`
   - **Save**

4. **Create/Update Your Page:**
   - Go to: Online Store > Pages
   - Find your "love-album" page or create new one
   - Edit page content if desired
   - In right sidebar, under **Template**, select: `page.love-album`
   - **Save and publish**

5. **Test It:**
   - Visit: `https://love-stories.ai/pages/love-album` (or your page URL)
   - You should now see your form embedded in an iframe

### Option 2: Reusable Section (Alternative)

Use this if you want to add the form to multiple pages or sections:

1. **Upload Section:**
   - Go to: Online Store > Themes > Edit Code
   - Find/create: `section-love-album-embed.liquid`
   - Copy/paste code from: `shopify-templates/section-love-album-embed.liquid`
   - Save

2. **Add to Pages:**
   - Go to: Online Store > Themes > Customize
   - Navigate to any page
   - Click "Add section"
   - Select "Love Album Embed"
   - Customize and save

## 🔍 What Changed and Why

### Before:
```liquid
src="https://love-stories.ai/embed?shop={{ shop.domain }}"
if (event.origin !== 'https://love-stories.ai')
```

### After:
```liquid
src="https://poc-songs-album.vercel.app/en?shop={{ shop.domain }}"
if (event.origin !== 'https://poc-songs-album.vercel.app')
```

### Reasons:
1. **Domain:** Your actual app is deployed at `poc-songs-album.vercel.app`, not `love-stories.ai`
2. **Route:** Using `/en` (your main form) instead of `/embed` (which has errors)
3. **Security:** postMessage origin checks must match the iframe URL domain for communication

## ✅ Verification Checklist

After uploading to Shopify:

- [ ] Files uploaded to correct locations in Shopify
- [ ] Section filename matches JSON template reference (`love-album-page-section`)
- [ ] Page template assigned to your page
- [ ] Page loads without errors
- [ ] Form is visible in the iframe
- [ ] Form is interactive (can fill out fields)
- [ ] Browser console shows no CORS errors
- [ ] Iframe resizes properly (check browser console for postMessage events)

## 🐛 Common Issues

### Iframe shows blank page
- Check browser console for errors
- Verify domain in iframe src matches your deployment URL
- Test the URL directly: https://poc-songs-album.vercel.app/en

### postMessage not working
- Ensure origin checks match exactly: `https://poc-songs-album.vercel.app`
- Check browser console for blocked postMessage warnings
- Verify iframe is loading from the same domain as the origin check

### Form doesn't submit
- Check that all environment variables are set in Vercel
- Verify Shopify Storefront API credentials are configured
- Check browser network tab for API errors

## 🔄 Future Updates

If you deploy to a custom domain (e.g., `app.love-stories.ai`):
1. Update all 3 locations in each Liquid file
2. Re-upload to Shopify
3. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables

## 📞 Need Help?

Check these files for more information:
- `shopify-templates/README.md` - Full setup guide
- `SHOPIFY_SETUP_CHECKLIST.md` - Complete Shopify integration checklist
- `SHOPIFY_EMBED_GUIDE.md` - Detailed embedding documentation
