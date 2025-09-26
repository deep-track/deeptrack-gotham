# PostHog Debugging Guide

## 🔍 **Step-by-Step Debugging**

### **1. Check Browser Console**
1. Open your app in browser (`http://localhost:3000`)
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Look for these messages:
   - ✅ `PostHog initialized with key: phc_XnKJCWeNQ2Ex9KZok5g8DXUD322TDWveKWxDZb3Mjst`
   - ✅ `PostHog test event sent: dashboard_loaded`
   - ❌ Any error messages about PostHog

### **2. Check Network Tab**
1. In Developer Tools, go to **Network** tab
2. Refresh the page
3. Look for requests to `app.posthog.com` or `us.i.posthog.com`
4. If you see requests, PostHog is working
5. If no requests, there's a configuration issue

### **3. Check PostHog Dashboard**
1. Go to [PostHog Dashboard](https://app.posthog.com)
2. Navigate to **Events** → **Live Events**
3. You should see:
   - `$pageview` events (automatic)
   - `dashboard_loaded` events (our test event)
   - Other custom events when you interact with the app

### **4. Test Event Manually**
Open browser console and run:
```javascript
// Test if PostHog is available
console.log('PostHog available:', typeof posthog !== 'undefined');

// Send a test event
posthog.capture('manual_test_event', {
  test: true,
  timestamp: new Date().toISOString()
});

// Check PostHog status
console.log('PostHog status:', posthog.get_config());
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: No Events in PostHog Dashboard**
**Possible Causes:**
- Environment variables not loaded
- PostHog not initialized
- Network blocking requests

**Solutions:**
1. Check `.env` file has correct variables
2. Restart development server (`pnpm run dev`)
3. Check browser console for errors
4. Verify PostHog key is correct

### **Issue 2: PostHog Key Not Found**
**Error:** `PostHog key not found in environment variables`

**Solution:**
1. Ensure `.env` file is in project root
2. Variables must start with `NEXT_PUBLIC_`
3. Restart development server after changes

### **Issue 3: Network Requests Blocked**
**Symptoms:** No requests to PostHog in Network tab

**Solutions:**
1. Check ad blockers (disable temporarily)
2. Check corporate firewall
3. Try incognito mode
4. Check browser extensions

### **Issue 4: Events Not Appearing Immediately**
**Note:** PostHog has a small delay (1-2 minutes) for events to appear

**Solution:** Wait 2-3 minutes and refresh PostHog dashboard

## 🧪 **Testing Checklist**

### **Basic Test**
- [ ] App loads without console errors
- [ ] PostHog initialization message appears
- [ ] Test event `dashboard_loaded` appears in console
- [ ] Network requests to PostHog visible

### **Event Test**
- [ ] Upload a file → Should trigger `file_upload_started`
- [ ] Click "Proceed" → Should trigger `checkout_started`
- [ ] Sign in/up → Should trigger `user_signed_in/up`

### **PostHog Dashboard Test**
- [ ] Events appear in Live Events
- [ ] Events have correct properties
- [ ] User identification working (if signed in)

## 🔧 **Quick Fixes**

### **Fix 1: Restart Everything**
```bash
# Stop the dev server (Ctrl+C)
# Then restart
pnpm run dev
```

### **Fix 2: Clear Browser Cache**
1. Hard refresh (Ctrl+Shift+R)
2. Or clear browser cache
3. Or try incognito mode

### **Fix 3: Check Environment Variables**
```bash
# In terminal, check if variables are loaded
echo $NEXT_PUBLIC_POSTHOG_KEY
```

### **Fix 4: Manual PostHog Test**
Add this to any component to test:
```javascript
useEffect(() => {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture('test_event', { test: true });
    console.log('Manual test event sent');
  }
}, []);
```

## 📞 **If Still Not Working**

### **Check PostHog Key Validity**
1. Go to PostHog Dashboard → Settings → Project API Keys
2. Verify the key matches your `.env` file
3. Ensure the key is active (not disabled)

### **Check PostHog Host**
- Default: `https://app.posthog.com`
- EU: `https://eu.posthog.com`
- Self-hosted: Your custom domain

### **Contact Support**
If nothing works:
1. Check PostHog status page
2. Contact PostHog support
3. Share console logs and network requests

---

**Most Common Issue:** Environment variables not loaded - restart the dev server after adding them!
