# Shopify Checkout Redirect Setup

## ⚠️ Important: Manual Configuration Required

Unfortunately, Shopify's Storefront API does not allow setting a custom redirect URL programmatically via the Cart API. The checkout redirect URL must be configured in your Shopify Admin settings.

## 🎯 Goal

After a customer completes payment, they should be redirected to:
```
https://YOUR-STORE.myshopify.com/pages/thank-you?sessionId=ALBUM_SESSION_ID
```

## 🛠️ Setup Options

### Option 1: Checkout Settings (Recommended for Testing)

1. Go to: **Settings > Checkout**
2. Scroll to **Order status page**
3. Find **Additional scripts**
4. Add this JavaScript:

```html
<script>
// Redirect to thank-you page with session ID from order attributes
{% if order.note_attributes %}
  {% for attribute in order.note_attributes %}
    {% if attribute.first == "album_session_id" %}
      <script>
        // Redirect after 3 seconds
        setTimeout(function() {
          window.location.href = "/pages/thank-you?sessionId={{ attribute.last }}";
        }, 3000);
      </script>
    {% endif %}
  {% endfor %}
{% endif %}
</script>
```

**Note**: This only works on Shopify Plus plans.

---

### Option 2: Custom Order Confirmation Page (Shopify Plus Only)

1. Go to: **Settings > Checkout**
2. Under **Order status page**, click **Customize**
3. Edit the Liquid template to include redirect logic
4. Save changes

---

### Option 3: Use Shopify Flow (Shopify Plus Only)

Create a Flow that:
1. Triggers on "Order Created"
2. Checks for `album_session_id` in line item properties
3. Sends customer an email with the correct thank-you link

---

### Option 4: Alternative - Email-Only Delivery (All Plans)

**This is the current implementation and works for all Shopify plans:**

1. Customer completes payment
2. Shopify shows standard "Thank you" page
3. Our webhook fires and sends email with album access link
4. Customer clicks email to access their album

**Pros:**
- ✅ Works on all Shopify plans
- ✅ No manual configuration needed
- ✅ Customer has permanent email record

**Cons:**
- ❌ Not immediate (customer must check email)
- ❌ Extra step for customer

---

## 🔍 How It Currently Works

### Current Flow (All Shopify Plans):

```
1. Customer on Shopify store
   ↓
2. Fills out love story form (in iframe)
   ↓
3. Approves lyrics
   ↓
4. Creates album session in database (with album_session_id)
   ↓
5. Redirects to Shopify Checkout
   - Line item has custom property: album_session_id
   ↓
6. Customer completes payment
   ↓
7. Shopify shows standard "Thank you for your purchase" page
   ↓
8. Webhook fires → Processes payment
   - Marks album as paid
   - Sends confirmation email with link:
     https://YOUR-STORE.myshopify.com/pages/album?sessionId=xxx
   ↓
9. Customer receives email
   ↓
10. Customer clicks link → Accesses album in store
```

---

## 📧 Email Links (Currently Implemented)

The webhook already sends emails with the correct Shopify store URLs:

**Payment Confirmation Email**:
```
https://YOUR-STORE.myshopify.com/pages/album?sessionId=xxx
```

**Access Granted Email**:
```
https://YOUR-STORE.myshopify.com/pages/album?sessionId=xxx
```

These links load the `/embed/results` iframe inside your Shopify store.

---

## ✅ Recommended Approach

**For Most Users (Non-Plus Plans)**:
1. Use the current email-based delivery system
2. Optionally: Customize the Shopify order confirmation page to mention "Check your email"
3. Benefits: Works immediately, no extra setup

**For Shopify Plus Users**:
1. Implement Option 1 (Additional Scripts)
2. This provides immediate redirect after checkout
3. Customers still receive email as backup

---

## 🧪 Testing the Current Flow

1. Make a test purchase through your embedded widget
2. Complete checkout on Shopify
3. Check that you receive confirmation email
4. Click the link in the email
5. Verify you land on `https://YOUR-STORE.myshopify.com/pages/album?sessionId=xxx`
6. Verify the iframe loads with your purchased album

---

## 🎨 Optional: Customize Shopify Thank You Page

Even without redirect, you can improve the standard Shopify thank you page:

1. Go to: **Settings > Checkout > Order status page**
2. Add custom message:

```
Thank you for your purchase!
🎵 Check your email for your AI Love Album access link.
📧 It should arrive within 2-3 minutes.
```

---

## 🚨 Troubleshooting

### Email not received:
- Check spam folder
- Verify webhook is configured correctly
- Check server logs for email sending errors

### Wrong redirect URL:
- Verify pages are created in Shopify (see SHOPIFY_TEMPLATES_SETUP.md)
- Check that page URLs match email template configuration

### Session ID not passed:
- Verify line item has `album_session_id` custom property
- Check webhook logs to see if session ID was extracted correctly

---

## 📝 Summary

**Current Status**: ✅ Fully functional email-based delivery
**Immediate Redirect**: ⚠️ Requires Shopify Plus OR manual setup
**Recommendation**: Use email delivery - it works great!

The email-based approach is actually preferred by many customers as it:
- Provides a permanent record
- Allows sharing with others
- Works on all devices
- Doesn't require complex Shopify configuration
