# Shopify Page Templates Setup Guide

This guide explains how to set up the Shopify page templates required for the complete embedded user flow.

## 📋 Overview

You need to create **2 page templates** and **2 pages** in your Shopify store:

1. **Thank You Page** - Shown after payment completion
2. **Album Access Page** - For accessing purchased albums from email links

---

## 🛠️ Setup Instructions

### Step 1: Create Page Templates in Theme

#### 1.1 Create "thank-you" Template

1. Go to: **Online Store > Themes**
2. Click **Actions** > **Edit code**
3. In the sidebar, find **Templates** section
4. Click **Add a new template**
5. Select **page** from dropdown
6. Name it: `thank-you`
7. Click **Create template**
8. **Copy the entire content** from `shopify-templates/page.thank-you.liquid`
9. **Paste** into the new template
10. Click **Save**

#### 1.2 Create "album" Template

1. While still in **Edit code**
2. Click **Add a new template** again
3. Select **page** from dropdown
4. Name it: `album`
5. Click **Create template**
6. **Copy the entire content** from `shopify-templates/page.album.liquid`
7. **Paste** into the new template
8. Click **Save**

---

### Step 2: Create Pages

#### 2.1 Create Thank You Page

1. Go to: **Online Store > Pages**
2. Click **Add page**
3. Fill in:
   - **Title**: `Thank You`
   - **Content**: (leave empty or add optional text like "Loading your album...")
4. In the right sidebar, find **Template**
5. Click **Change template**
6. Select: `page.thank-you`
7. Click **Save**
8. **Copy the page URL** (e.g., `https://your-store.myshopify.com/pages/thank-you`)

#### 2.2 Create Album Access Page

1. Still in **Online Store > Pages**
2. Click **Add page** again
3. Fill in:
   - **Title**: `Your Album`
   - **Content**: (leave empty or add optional text like "Loading your music...")
4. In the right sidebar, find **Template**
5. Click **Change template**
6. Select: `page.album`
7. Click **Save**
8. **Copy the page URL** (e.g., `https://your-store.myshopify.com/pages/album`)

---

## ✅ Verification

Test that the pages work correctly:

### Test Thank You Page:
1. Visit: `https://your-store.myshopify.com/pages/thank-you?sessionId=test`
2. You should see the thank-you iframe load
3. It will show an error (no valid session), but iframe should be visible

### Test Album Page:
1. Visit: `https://your-store.myshopify.com/pages/album?sessionId=test`
2. You should see the album iframe load
3. It will show an error (no valid session), but iframe should be visible

---

## 🔧 Customization (Optional)

### Update App Domain

If your app domain is different from `poc-songs-album.vercel.app`, update both templates:

**In `page.thank-you.liquid` (line 19)**:
```liquid
src="https://YOUR-DOMAIN.com/embed/thank-you{{ request.search }}"
```

**In `page.album.liquid` (line 19)**:
```liquid
src="https://YOUR-DOMAIN.com/embed/results{{ request.search }}"
```

Also update the security check in the `<script>` section:
```javascript
if (event.origin !== 'https://YOUR-DOMAIN.com') {
  return;
}
```

---

## 📊 Page URLs Reference

After creating the pages, note down these URLs for configuration:

- **Thank You Page**: `https://YOUR-STORE.myshopify.com/pages/thank-you`
- **Album Page**: `https://YOUR-STORE.myshopify.com/pages/album`

You'll need these URLs for:
1. Email template configuration
2. Checkout redirect URL setup
3. Testing the complete flow

---

## 🚨 Troubleshooting

### Iframe not showing:
- Check browser console for errors
- Verify the app URL is correct in the template
- Make sure the page template is assigned to the page

### Iframe shows "Refused to connect":
- Verify your app allows iframe embedding (no X-Frame-Options blocking)
- Check the Content-Security-Policy headers
- Ensure the origin check in the script matches your domain

### Session ID not passed:
- The sessionId is passed via query string: `?sessionId=xxx`
- Check that `{{ request.search }}` is in the iframe src
- Verify the URL in browser shows the parameter

---

## 🎯 Next Steps

After setting up the templates:

1. ✅ Update email templates to use Shopify page URLs
2. ✅ Update checkout redirect to point to thank-you page
3. ✅ Test complete payment flow
4. ✅ Verify email links work correctly

See the main implementation plan for details on these next steps.
