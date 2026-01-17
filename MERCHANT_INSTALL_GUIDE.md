# AI Love Story Album Generator - Installation Guide for Shopify Merchants

## Overview

This guide will help you add the AI Love Story Album Generator to your Shopify store in **under 10 minutes**. Your customers will be able to create personalized love story albums directly on your website.

## What You'll Get

- ✅ AI-powered love story album creation
- ✅ Professional music generation
- ✅ Seamless integration with your store
- ✅ Native Shopify checkout
- ✅ Automatic order fulfillment

## Prerequisites

- ✅ Shopify store (any plan)
- ✅ Access to theme code editor
- ✅ A product created for "Love Album" (we'll help configure this)

---

## Installation Steps

### Step 1: Add the Embed Snippet

1. **Go to your Shopify Admin**
   - Navigate to: **Online Store → Themes**

2. **Open the code editor**
   - Click **Actions → Edit code**

3. **Create a new snippet**
   - In the left sidebar, find **Snippets**
   - Click **Add a new snippet**
   - Name it: `love-album-embed`
   - Click **Create snippet**

4. **Paste the embed code**
   - You'll receive a file called `shopify-embed-snippet.liquid` from us
   - Copy the entire contents
   - Paste into the snippet editor
   - **Important**: Update the `app_url` on line 16 with the URL we provide
   - Click **Save**

### Step 2: Create a Dedicated Page

1. **Create a new page**
   - Go to: **Online Store → Pages**
   - Click **Add page**

2. **Configure the page**
   - **Title**: "Create Your Love Album" (or your preferred title)
   - **Content**: Click "Show HTML" (looks like `<>` icon)
   - **Paste this code**:
     ```liquid
     {% render 'love-album-embed' %}
     ```
   - Click **Save**

3. **Note the page URL**
   - Your page will be at: `https://your-store.com/pages/create-your-love-album`

### Step 3: Add to Navigation (Optional but Recommended)

1. **Edit your navigation menu**
   - Go to: **Online Store → Navigation**
   - Select your main menu (usually "Main menu")

2. **Add a menu item**
   - Click **Add menu item**
   - **Name**: "Create Your Album" (or your preferred text)
   - **Link**: Select "Pages" → "Create Your Love Album"
   - Click **Add**

3. **Save the menu**
   - Click **Save menu**

### Step 4: Configure Product for Checkout

This is where customers will complete their purchase.

1. **Create a product** (if you haven't already)
   - Go to: **Products → Add product**
   - **Title**: "AI Love Story Album"
   - **Price**: (We recommend $99.00 - $149.00)
   - **Description**: Add compelling description
   - **Make it invisible**: Uncheck "Online Store" in sales channels
     - This prevents customers from buying it directly
     - They must go through the widget flow

2. **Get the Product Variant ID**
   - Open the product you just created
   - Look at the URL: `admin/products/PRODUCT_ID`
   - **Send us this Product ID** - we'll configure it in our system

3. **Share with us**
   - Email us: [your-support-email@example.com]
   - Include:
     - Your store domain: `your-store.myshopify.com`
     - Product Variant ID
     - Desired price

---

## Testing Your Installation

### 1. Visit Your Page

Go to: `https://your-store.com/pages/create-your-love-album`

You should see the AI Love Album Generator widget loaded.

### 2. Test the Flow

1. Fill out the love story form
2. Submit and see the AI analysis
3. Click to purchase
4. Complete checkout (use Shopify's test mode)
5. Verify you receive confirmation

### 3. Mobile Testing

Test on mobile devices to ensure responsive design.

---

## Customization Options

### Change the Page Layout

If you want to customize how the page looks:

1. Go to: **Themes → Customize**
2. Navigate to your "Create Your Love Album" page
3. Adjust sections, headers, footers as desired
4. The widget will adapt to your theme

### Add a Banner or Hero Section

Above the widget, you can add promotional content:

```liquid
<div class="custom-banner">
  <h1>Create Your Personalized Love Story Album</h1>
  <p>AI-powered music generation based on your unique love story</p>
</div>

{% render 'love-album-embed' %}
```

### Adjust Widget Width

In the snippet, find `.love-album-wrapper` style and modify:

```css
.love-album-wrapper {
  max-width: 1400px; /* Change this value */
}
```

---

## Troubleshooting

### Widget Not Appearing

**Check:**
- ✅ Snippet is saved with correct name: `love-album-embed`
- ✅ Page contains: `{% render 'love-album-embed' %}`
- ✅ App URL in snippet is correct
- ✅ Clear browser cache

### Payment Not Working

**Check:**
- ✅ Product Variant ID shared with us
- ✅ Product price is configured
- ✅ Shopify Payments is enabled

### Widget Appears Broken

**Check:**
- ✅ View in incognito/private mode
- ✅ Disable browser extensions
- ✅ Check browser console for errors (F12)
- ✅ Contact support with screenshot

### Mobile Issues

**Check:**
- ✅ Widget should auto-resize
- ✅ Test on actual device, not just desktop simulator
- ✅ Check theme's mobile CSS isn't conflicting

---

## Support

### Contact Us

- **Email**: [your-support-email@example.com]
- **Response Time**: Within 24 hours
- **Phone**: [your-phone] (business hours)

### What to Include When Contacting Support

1. Your Shopify store URL
2. Screenshot of the issue
3. Browser console errors (press F12)
4. Steps to reproduce the problem

---

## FAQ

### Q: Can I use this with my existing theme?
**A:** Yes! The widget is designed to work with any Shopify theme.

### Q: Will this slow down my store?
**A:** No. The widget loads in an iframe and doesn't affect your store's performance.

### Q: Can I customize the design?
**A:** The widget maintains consistent branding, but you can customize the page around it.

### Q: What happens after purchase?
**A:** Customers receive automated emails with access to their generated album.

### Q: Is there a transaction fee?
**A:** [Your pricing model here - e.g., "No additional fees. You keep all proceeds except standard Shopify fees."]

### Q: Can I remove the widget later?
**A:** Yes, simply delete the page or remove the snippet code.

---

## Next Steps After Installation

1. ✅ Test the complete customer flow
2. ✅ Add promotional content around the widget
3. ✅ Create marketing materials
4. ✅ Train your support team
5. ✅ Announce to your customers

---

## Success Checklist

Before going live, verify:

- [ ] Widget loads correctly on desktop
- [ ] Widget loads correctly on mobile
- [ ] Navigation menu link works
- [ ] Test purchase completes successfully
- [ ] Confirmation email is received
- [ ] Album is delivered after payment
- [ ] Support knows how to handle questions

---

## Marketing Tips

### Promote Your New Feature

**Email Ideas:**
- "Introducing: Create Your Personalized Love Story Album"
- "The Perfect Anniversary Gift - AI-Generated Music"

**Social Media:**
- Share example albums (with permission)
- Behind-the-scenes of AI music generation
- Customer testimonials

**Homepage Banner:**
- "New: Create Your AI Love Story Album →"
- Links to your new page

---

**Installation Complete!** 🎵💕

Your customers can now create beautiful, personalized love story albums directly on your Shopify store.

Need help? Contact us anytime at [your-support-email@example.com]
