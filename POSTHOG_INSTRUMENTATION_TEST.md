# PostHog Instrumentation Test Guide

## 🔧 **What We Changed**

### **1. Created `instrumentation-client.ts`**
- This is the new recommended approach for Next.js 15.3+
- PostHog initializes automatically when the app loads
- No need for React Provider wrapper

### **2. Removed PostHogProvider**
- Removed from `src/App.tsx`
- No longer needed with instrumentation approach

### **3. Updated All Components**
- Changed from `usePostHog()` hook to direct `posthog` import
- PostHog is now globally available

## 🧪 **Testing Steps**

### **1. Check Browser Console**
Open your app (`http://localhost:3000`) and look for:
```
PostHog initialized via instrumentation-client with key: phc_XnKJCWeNQ2Ex9KZok5g8DXUD322TDWveKWxDZb3Mjst
```

### **2. Test Manual Event**
Open browser console and run:
```javascript
// Test if PostHog is available
console.log('PostHog available:', typeof posthog !== 'undefined');

// Send a test event
posthog.capture('instrumentation_test', {
  test: true,
  method: 'instrumentation-client',
  timestamp: new Date().toISOString()
});

console.log('Test event sent via instrumentation');
```

### **3. Check Network Tab**
- Open Developer Tools → Network tab
- Refresh the page
- Look for requests to `app.posthog.com` or `us.i.posthog.com`

### **4. Test App Events**
- Upload a file → Should trigger `file_upload_started`
- Click "Proceed" → Should trigger `checkout_started`
- Sign in/up → Should trigger `user_signed_in/up`

### **5. Check PostHog Dashboard**
- Go to [PostHog Dashboard](https://app.posthog.com)
- Navigate to **Events** → **Live Events**
- You should see:
  - `$pageview` events (automatic)
  - `dashboard_loaded` events (our test event)
  - `instrumentation_test` events (manual test)
  - Other custom events when you interact with the app

## 🔍 **Debugging**

### **If No Events Appear:**

1. **Check Console for Errors**
   - Look for PostHog initialization message
   - Check for any JavaScript errors

2. **Verify Environment Variables**
   ```bash
   # Check if variables are loaded
   echo $NEXT_PUBLIC_POSTHOG_KEY
   echo $NEXT_PUBLIC_POSTHOG_HOST
   ```

3. **Test PostHog Status**
   ```javascript
   // In browser console
   console.log('PostHog config:', posthog.get_config());
   console.log('PostHog status:', posthog.get_session_id());
   ```

4. **Check Network Requests**
   - Look for blocked requests
   - Check if requests reach PostHog servers

### **Common Issues:**

- **Ad Blockers**: Disable temporarily
- **Corporate Firewall**: Check if PostHog domains are blocked
- **Environment Variables**: Restart dev server after changes
- **Browser Cache**: Try incognito mode

## ✅ **Expected Results**

With the instrumentation approach, you should see:

1. **Console Message**: PostHog initialization confirmation
2. **Network Requests**: Regular requests to PostHog servers
3. **Events in Dashboard**: Events appearing within 1-2 minutes
4. **No Errors**: Clean console without PostHog-related errors

## 🚀 **Advantages of Instrumentation Approach**

- **Simpler Setup**: No React Provider needed
- **Better Performance**: Initializes earlier in app lifecycle
- **More Reliable**: Less prone to React hydration issues
- **Next.js Optimized**: Built specifically for Next.js 15.3+

---

**If events still don't appear, check the browser console and network tab for specific error messages.**
