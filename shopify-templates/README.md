# Shopify Liquid Templates

This directory contains Liquid templates for embedding the AI Love Album Generator into your Shopify store.

## 📁 Files

### 1. Page Template (JSON + Section)
**Full Page Template** - Creates a dedicated page for the love album creator.

**Files:**
- `page.love-album.json` - JSON template file
- `love-album-page-section.liquid` - Section with schema settings

**Use when:** You want a standalone page for the album creator (e.g., `/pages/create-album`)

**Setup:**
1. Go to: **Online Store > Themes > Edit Code**
2. **Upload the Section:**
   - In the left sidebar, **right-click** on the **"Sections"** folder
   - Select **"Add file"** or **"New file"** (or click the folder and look for an "Add section" button)
   - Name it: `love-album-page-section` (without the `.liquid` extension)
   - Paste the code from `love-album-page-section.liquid`
   - **Important:** The filename MUST be exactly `love-album-page-section` to match the JSON template
   - Save (Ctrl+S / Cmd+S)
3. **Upload the JSON Template:**
   - In the left sidebar, **right-click** on the **"Templates"** folder
   - Select **"Add file"** or **"New file"**
   - Name it: `page.love-album.json`
   - Paste the code from `page.love-album.json`
   - Save
4. **Create or Update Your Page:**
   - Go to: **Online Store > Pages**
   - Find your existing page or click **Add page**
   - Create/edit your page content
   - In the right sidebar, under **Template**, select: `page.love-album`
   - Save and publish

**Important Notes:**
- The section filename (`love-album-page-section`) MUST match the `"type"` in the JSON template
- Modern Shopify templates use JSON format that references sections
- Old Liquid-only page templates don't support `{% schema %}` tags
- Both files must be uploaded to Shopify before the page will display

### 2. `section-love-album-embed.liquid`
**Reusable Section** - Can be added to any page via the theme editor.

**Use when:** You want flexibility to add the album creator anywhere (homepage, product pages, etc.)

**Setup:**
1. Go to: **Online Store > Themes > Edit Code**
2. Click: **Add a new section**
3. Name it: `love-album-embed`
4. Paste the code from `section-love-album-embed.liquid`
5. Save
6. Go to: **Online Store > Themes > Customize**
7. Navigate to any page
8. Click **Add section**
9. Select: **Love Album Embed**
10. Customize settings and save

## 🔧 Configuration

**IMPORTANT:** The domain has been pre-configured to `https://poc-songs-album.vercel.app` in the template files.

The templates point to your album generation form at: `https://poc-songs-album.vercel.app/en`

If you need to change it (e.g., using a custom domain):
1. Open `love-album-page-section.liquid`
2. Find all instances of `https://poc-songs-album.vercel.app`
3. Replace with your actual domain
4. Update in 3 places:
   - Line 32: iframe `src` attribute
   - Line 102: postMessage origin check
   - Line 115: postMessage origin check

Same applies to `section-love-album-embed.liquid` if using that template.

## 🎨 Customization

### Page Template Customization
The page template (via `section-love-album-page.liquid`) provides these customization options in the theme editor:
- **Content:**
  - Page heading
  - Description text
- **Layout:**
  - Maximum width (600-1400px)
  - Initial height (400-1200px)
  - Top/bottom padding
  - Shadow toggle
- **Colors:**
  - Background color
  - Heading color
  - Text color

All settings are adjustable via the Shopify theme editor without editing code.

### Section Template Settings
The section template provides these customization options via theme editor:
- **Content:**
  - Section heading
  - Description text
- **Layout:**
  - Maximum width (600-1400px)
  - Initial height (400-1200px)
  - Top/bottom padding
  - Shadow toggle
- **Colors:**
  - Background color
  - Heading color
  - Text color

## 🔒 Security

Both templates include origin verification in JavaScript:
```javascript
if (event.origin !== 'https://YOUR_APP_DOMAIN') {
  return;
}
```

Make sure to update `YOUR_APP_DOMAIN` to match your actual domain for security.

## 📱 Mobile Responsiveness

Both templates are fully responsive:
- Adaptive padding on mobile
- Smaller font sizes for headings
- Optimized iframe dimensions
- Touch-friendly interactions

## 🚀 Testing

After installation:
1. Visit your page/section in the theme editor
2. Test the form submission flow
3. Verify checkout redirect works
4. Test on mobile devices
5. Check iframe auto-resize functionality

## 💡 Pro Tips

1. **JSON Page Template** (`page.love-album.json` + `section-love-album-page.liquid`) is best for:
   - Dedicated landing pages
   - Marketing campaigns
   - Direct links from ads
   - When you need full-page customization via theme editor

2. **Reusable Section** (`section-love-album-embed.liquid`) is best for:
   - Homepage integration
   - Product pages
   - Multiple locations
   - A/B testing different placements

3. **Understanding the Architecture:**
   - JSON templates reference sections (modern Shopify approach)
   - Only sections and blocks support `{% schema %}` tags
   - Liquid-only page templates are legacy and don't support schema

## 🐛 Troubleshooting

### Page shows blank/no content?
**Most common causes:**
1. **Section name mismatch** - The JSON template references `love-album-page-section` but your section file has a different name
   - **Solution:** Section filename MUST be exactly `love-album-page-section.liquid` in Shopify
2. **Template not assigned** - The page doesn't have the template selected
   - **Solution:** Go to Pages > Edit page > Template dropdown > Select `page.love-album`
3. **Files not uploaded** - Files are only in your local folder, not in Shopify
   - **Solution:** Upload both files to Shopify's code editor (see Setup instructions)
4. **Section not saved properly** - Section file wasn't saved in Shopify
   - **Solution:** Re-upload the section file and verify it appears in Sections folder

### "Unknown tag 'schema'" error?
- This error occurs when using `{% schema %}` in page templates (Liquid files)
- **Solution:** Use the JSON template approach (`page.love-album.json` + `love-album-page-section.liquid`)
- Only sections and blocks support schema tags, not page templates

### Iframe not loading?
- Check that the domain is correctly set to `https://poc-songs-album.vercel.app` in the section file
- Verify your app is deployed and accessible at that URL
- Check browser console for CORS errors
- Test the embed URL directly: `https://poc-songs-album.vercel.app/en?shop=YOUR_SHOP.myshopify.com`
- Make sure you're using `/en` route (the main form) not `/embed` (which is broken)

### Checkout not working?
- Ensure Storefront API is configured
- Verify `SHOPIFY_PRODUCT_VARIANT_ID` is set
- Check webhook configuration

### Iframe not resizing?
- Verify origin in postMessage handler matches your domain (`https://poc-songs-album.vercel.app`)
- Check browser console for errors
- Ensure the `/en` page is sending resize messages via postMessage

### Can't find the template in Shopify?
- Make sure you uploaded both the JSON template AND the section
- The section name must match the type in the JSON file (`love-album-page-section`)
- Refresh the Shopify admin page after uploading
- Check that files are in the correct folders:
  - Section: `/sections/love-album-page-section.liquid`
  - Template: `/templates/page.love-album.json`

### Template appears in list but page is still blank?
- Verify the section file exists in Shopify's Sections folder
- Check the browser console for JavaScript errors
- Try editing the page in Shopify's theme editor to see if the section appears
- Ensure the section name in JSON matches exactly (case-sensitive)

## 📞 Support

For issues or questions:
1. Check environment variables are configured
2. Review browser console for errors
3. Verify Shopify Storefront API permissions
4. Test the `/embed` endpoint directly
