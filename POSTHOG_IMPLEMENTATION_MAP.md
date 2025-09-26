# PostHog Implementation Map - DeepTrack Gotham

## 📋 Page-by-Page Event Implementation Plan

This document maps each page/component to the specific PostHog events that need to be implemented, following Next.js best practices.

## 🏗️ Next.js Setup Requirements

### 1. Package Installation
```bash
npm install posthog-js posthog-node
```

### 2. Environment Variables
```bash
# .env.local
NEXT_PUBLIC_POSTHOG_KEY=phc_XnKJCWeNQ2Ex9KZok5g8DXUD322TDWveKWxDZb3Mjst
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 3. Setup Files Needed
- `instrumentation-client.ts` (Next.js 15.3+)
- `app/posthog-server.ts` (Server-side client)
- `app/layout.tsx` (PostHog provider wrapper)

---

## 📄 Page-by-Page Implementation

### 1. **Root Layout** (`src/app/layout.tsx`)
**Current**: ClerkProvider wrapper
**PostHog Integration**: Add PostHogProvider wrapper

```typescript
// app/layout.tsx
import { PostHogProvider } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ClerkProvider>
          <PostHogProvider>
            <EnsureFullName />
            <HydrateHistory />
            <div className="min-h-screen flex flex-col">
              <Header />
              <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-4">
                  {children}
                </main>
              </div>
              <Footer />
            </div>
          </PostHogProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
```

**Events to Track**:
- `$pageview` (automatically tracked by PostHog)
- `route_change` (navigation between pages - optional custom event)

---

### 2. **Dashboard/Home Page** (`src/app/page.tsx`)
**Current**: File upload, token display, payment choice
**PostHog Integration**: Track user interactions and file uploads

```typescript
// app/page.tsx
'use client'
import { usePostHog } from 'posthog-js/react'

function DashboardContent() {
  const posthog = usePostHog()
  
  // PostHog automatically tracks pageviews
  // Optional: Add custom properties to pageview
  useEffect(() => {
    posthog.capture('$pageview', {
      page_type: 'dashboard',
      user_authenticated: isSignedIn
    })
  }, [])
  
  // Track file selection
  const handleFileSelect = (files: File[]) => {
    posthog.capture('add_to_cart', {
      product_id: 'media_verification',
      quantity: files.length,
      file_count: files.length,
      file_types: [...new Set(files.map(f => f.type.split('/')[0]))],
      total_file_size: files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024
    })
  }
  
  // Track checkout start
  const handleProceed = async () => {
    posthog.capture('checkout_started', {
      cart_id: orderId,
      file_count: selectedFiles.length,
      payment_method: isSignedIn && userTokens > 0 ? 'tokens' : 'paystack'
    })
  }
}
```

**Events to Track**:
- `product_viewed` (on page load)
- `add_to_cart` (file selection)
- `remove_from_cart` (file removal)
- `checkout_started` (proceed button click)
- `payment_method_selected` (token vs card choice)
- `component_mount` (UploadArea, TokenDisplay)

---

### 3. **Login Page** (`src/app/login/page.tsx`)
**Current**: Email/password + Google OAuth login
**PostHog Integration**: Track authentication events

```typescript
// app/login/page.tsx
'use client'
import { usePostHog } from 'posthog-js/react'

export default function Login() {
  const posthog = usePostHog()
  
  // PostHog automatically tracks pageviews
  // Optional: Add custom properties
  useEffect(() => {
    posthog.capture('$pageview', {
      page_type: 'login'
    })
  }, [])
  
  // Track login attempts
  const handleSubmit = async (e: React.FormEvent) => {
    posthog.capture('login_attempt', {
      method: 'email_password',
      email_domain: email.split('@')[1]
    })
    
    try {
      // ... login logic
      posthog.capture('user_signed_in', {
        signin_method: 'email',
        user_type: 'returning_user'
      })
    } catch (error) {
      posthog.capture('login_failed', {
        method: 'email_password',
        error_message: error.message
      })
    }
  }
  
  // Track Google OAuth
  const loginWithGoogle = async () => {
    posthog.capture('login_attempt', {
      method: 'google_oauth'
    })
  }
}
```

**Events to Track**:
- `$pageview` (automatically tracked by PostHog)
- `login_attempt` (form submission/OAuth click)
- `user_signed_in` (successful login)
- `login_failed` (failed attempts)

---

### 4. **Signup Page** (`src/app/signup/page.tsx`)
**Current**: Email/password + Google OAuth signup
**PostHog Integration**: Track registration events

```typescript
// app/signup/page.tsx
'use client'
import { usePostHog } from 'posthog-js/react'

export default function Signup() {
  const posthog = usePostHog()
  
  // PostHog automatically tracks pageviews
  // Optional: Add custom properties
  useEffect(() => {
    posthog.capture('$pageview', {
      page_type: 'signup'
    })
  }, [])
  
  // Track signup attempts
  const handleSubmit = async (e: React.FormEvent) => {
    posthog.capture('signup_attempt', {
      method: 'email_password',
      email_domain: email.split('@')[1]
    })
    
    try {
      // ... signup logic
      posthog.capture('user_signed_up', {
        signup_method: 'email',
        user_type: 'business_user',
        email_domain: email.split('@')[1]
      })
    } catch (error) {
      posthog.capture('signup_failed', {
        method: 'email_password',
        error_message: error.message
      })
    }
  }
}
```

**Events to Track**:
- `$pageview` (automatically tracked by PostHog)
- `signup_attempt` (form submission)
- `user_signed_up` (successful registration)
- `signup_failed` (failed attempts)

---

### 5. **Checkout Page** (`src/app/checkout/page.tsx`)
**Current**: Authentication + payment processing
**PostHog Integration**: Track checkout flow events

```typescript
// app/checkout/page.tsx
'use client'
import { usePostHog } from 'posthog-js/react'

function CheckoutPageContent() {
  const posthog = usePostHog()
  
  // PostHog automatically tracks pageviews
  // Optional: Add custom properties
  useEffect(() => {
    posthog.capture('$pageview', {
      page_type: 'checkout',
      order_id: orderId
    })
  }, [])
  
  // Track payment info entry
  const handleAuth = async (e: React.FormEvent) => {
    posthog.capture('payment_info_entered', {
      cart_id: orderId,
      user_type: authMode === 'signin' ? 'returning_user' : 'new_user',
      auth_method: 'email_password'
    })
  }
  
  // Track payment initiation
  const handlePay = async () => {
    posthog.capture('payment_initiated', {
      order_id: orderId,
      payment_method: 'paystack',
      amount: order.totalAmountCents / 100
    })
  }
}
```

**Events to Track**:
- `$pageview` (automatically tracked by PostHog)
- `cart_viewed` (order summary display)
- `payment_info_entered` (authentication completion)
- `payment_initiated` (Paystack redirect)

---

### 6. **Results Page** (`src/app/results/page.tsx`)
**Current**: Display verification results
**PostHog Integration**: Track results viewing and engagement

```typescript
// app/results/page.tsx
'use client'
import { usePostHog } from 'posthog-js/react'

function ResultsContent() {
  const posthog = usePostHog()
  
  // PostHog automatically tracks pageviews
  // Optional: Add custom properties
  useEffect(() => {
    posthog.capture('$pageview', {
      page_type: 'results',
      order_id: orderId
    })
  }, [])
  
  // Track results viewing
  useEffect(() => {
    if (resultData && resultData.length > 0) {
      posthog.capture('results_viewed', {
        order_id: orderId,
        file_count: resultData.length,
        time_to_view: timeFromPurchaseToView,
        results_summary: {
          authentic: resultData.filter(r => r.result.status === 'AUTHENTIC').length,
          manipulated: resultData.filter(r => r.result.status === 'MANIPULATED').length
        }
      })
    }
  }, [resultData])
}
```

**Events to Track**:
- `$pageview` (automatically tracked by PostHog)
- `results_viewed` (results display)
- `verification_completed` (when results are ready)

---

### 7. **History Page** (`src/app/history/page.tsx`)
**Current**: View past verifications
**PostHog Integration**: Track history interactions

```typescript
// app/history/page.tsx
'use client'
import { usePostHog } from 'posthog-js/react'

export default function History() {
  const posthog = usePostHog()
  
  // PostHog automatically tracks pageviews
  // Optional: Add custom properties
  useEffect(() => {
    posthog.capture('$pageview', {
      page_type: 'history'
    })
  }, [])
  
  // Track history viewing
  useEffect(() => {
    posthog.capture('history_viewed', {
      total_verifications: historyItems.length,
      filter_applied: activeFilter,
      search_term: searchTerm
    })
  }, [historyItems, activeFilter, searchTerm])
  
  // Track filter changes
  const handleFilterChange = (filter: string) => {
    posthog.capture('history_filter_changed', {
      from_filter: activeFilter,
      to_filter: filter,
      total_items: historyItems.length
    })
  }
}
```

**Events to Track**:
- `$pageview` (automatically tracked by PostHog)
- `history_viewed` (page load with data)
- `history_filter_changed` (filter selection)
- `history_search_performed` (search input)

---

### 8. **Payment Pending Page** (`src/app/payment-pending/page.tsx`)
**Current**: Payment status polling
**PostHog Integration**: Track payment status updates

```typescript
// app/payment-pending/page.tsx
'use client'
import { usePostHog } from 'posthog-js/react'

function PaymentPendingContent() {
  const posthog = usePostHog()
  
  // PostHog automatically tracks pageviews
  // Optional: Add custom properties
  useEffect(() => {
    posthog.capture('$pageview', {
      page_type: 'payment_pending',
      order_id: orderId
    })
  }, [])
  
  // Track payment confirmation
  useEffect(() => {
    if (paymentStatus === 'paid') {
      posthog.capture('purchase_confirmed', {
        order_id: orderId,
        confirmation_method: 'client_polling',
        polling_attempts: attempts
      })
    }
  }, [paymentStatus])
}
```

**Events to Track**:
- `$pageview` (automatically tracked by PostHog)
- `purchase_confirmed` (payment success via polling)

---

## 🔧 API Routes Implementation

### 1. **Upload API** (`src/app/api/uploads/route.ts`)
**Current**: File upload handling
**PostHog Integration**: Track upload events

```typescript
// app/api/uploads/route.ts
import PostHogClient from '../posthog-server'

export async function POST(req: Request) {
  const posthog = PostHogClient()
  
  try {
    // ... upload logic
    
    posthog.capture({
      distinctId: userId,
      event: 'file_upload_completed',
      properties: {
        file_count: uploadedFiles.length,
        total_size_mb: totalSize,
        upload_duration: uploadTime,
        success_rate: successRate
      }
    })
  } finally {
    await posthog.shutdown()
  }
}
```

**Events to Track**:
- `file_upload_started` (client-side)
- `file_upload_completed` (server-side)
- `api_request_completed` (performance tracking)

---

### 2. **Payment Webhook** (`src/app/api/webhook/paystack/route.ts`)
**Current**: Paystack webhook handling
**PostHog Integration**: Track payment confirmations

```typescript
// app/api/webhook/paystack/route.ts
import PostHogClient from '../posthog-server'

export async function POST(req: Request) {
  const posthog = PostHogClient()
  
  try {
    // ... webhook logic
    
    // Track webhook received
    posthog.capture({
      distinctId: userId,
      event: 'payment_webhook_received',
      properties: {
        webhook_event: event,
        transaction_reference: reference,
        payment_amount: data.amount,
        webhook_signature_valid: signatureValid
      }
    })
    
    if (event === "charge.success") {
      // Track successful payment
      posthog.capture({
        distinctId: userId,
        event: 'purchase',
        properties: {
          order_id: orderId,
          transaction_id: reference,
          value: data.amount,
          currency: data.currency,
          payment_method: 'paystack',
          payment_provider: 'paystack',
          webhook_event: 'charge.success'
        }
      })
    }
  } finally {
    await posthog.shutdown()
  }
}
```

**Events to Track**:
- `payment_webhook_received` (webhook reception)
- `purchase` (authoritative payment confirmation)

---

### 3. **Order Processing** (`src/app/api/process-order/route.ts`)
**Current**: Order processing after payment
**PostHog Integration**: Track processing events

```typescript
// app/api/process-order/route.ts
import PostHogClient from '../posthog-server'

export async function POST(req: Request) {
  const posthog = PostHogClient()
  
  try {
    // ... processing logic
    
    posthog.capture({
      distinctId: userId,
      event: 'order_processing_started',
      properties: {
        order_id: orderId,
        file_count: fileCount,
        processing_method: 'reality_defender_api'
      }
    })
    
    // After processing completes
    posthog.capture({
      distinctId: userId,
      event: 'verification_completed',
      properties: {
        order_id: orderId,
        processing_time: processingTime,
        results: {
          authentic: authenticCount,
          manipulated: manipulatedCount
        }
      }
    })
  } finally {
    await posthog.shutdown()
  }
}
```

**Events to Track**:
- `order_processing_started` (processing begins)
- `verification_completed` (processing finishes)

---

## 🎯 Component-Level Events

### 1. **Header Component** (`src/components/layout/Header.tsx`)
**Events to Track**:
- `navigation_click` (menu item clicks)
- `user_menu_opened` (user dropdown)
- `theme_toggle_click` (dark/light mode)

### 2. **Upload Area** (`src/components/upload/upload-area.tsx`)
**Events to Track**:
- `file_drag_started` (drag and drop begins)
- `file_drop_completed` (files dropped)
- `file_validation_failed` (invalid files)

### 3. **Token Display** (`src/components/tokens/token-display.tsx`)
**Events to Track**:
- `token_balance_viewed` (token display)
- `token_purchase_clicked` (buy tokens button)

### 4. **Payment Choice Dialog** (`src/components/tokens/payment-choice-dialog.tsx`)
**Events to Track**:
- `payment_choice_dialog_opened`
- `payment_method_selected` (tokens vs card)

---

## 📊 Implementation Priority

### Phase 1: Core Setup (Week 1)
1. ✅ Install packages and environment setup
2. ✅ Create `instrumentation-client.ts`
3. ✅ Create `posthog-server.ts`
4. ✅ Add PostHogProvider to layout
5. ✅ PostHog automatically tracks pageviews (no manual setup needed)

### Phase 2: Core Events (Week 2)
1. ✅ Dashboard page events
2. ✅ Login/Signup events
3. ✅ Checkout page events
4. ✅ Basic API route events

### Phase 3: Payment Events (Week 3)
1. ✅ Payment webhook events
2. ✅ Order processing events
3. ✅ Results page events
4. ✅ Payment pending events

### Phase 4: Engagement Events (Week 4)
1. ✅ History page events
2. ✅ Component-level events
3. ✅ Error boundary events
4. ✅ Performance tracking

### Phase 5: Optimization (Week 5)
1. ✅ Event deduplication
2. ✅ Performance monitoring
3. ✅ Data validation
4. ✅ Dashboard setup

---

## 🚨 Critical Implementation Notes

### 1. **Client vs Server Events**
- **Client**: User interactions, UI events, navigation
- **Server**: Payment confirmations, webhook events, API calls
- **Hybrid**: Some events tracked on both sides for redundancy

### 2. **Event Deduplication**
- Use unique identifiers to prevent duplicate events
- Implement proper event timing to avoid race conditions
- Use server-side events as authoritative source for payments

### 3. **Performance Considerations**
- Use `instrumentation-client.ts` for optimal loading
- Implement proper server-side client shutdown
- Consider event batching for high-volume events

### 4. **Error Handling**
- Wrap all PostHog calls in try-catch blocks
- Implement fallback mechanisms for failed events
- Log errors without breaking user experience

### 5. **Privacy Compliance**
- Mask sensitive data in session recordings
- Implement proper user consent mechanisms
- Follow data retention policies

---

## 📈 Expected Analytics Insights

### Conversion Funnel
1. `product_viewed` → `add_to_cart` → `checkout_started` → `purchase`
2. `file_upload_started` → `file_upload_completed` → `verification_started` → `verification_completed`

### Key Metrics
- **Conversion Rate**: Dashboard → Purchase
- **Upload Success Rate**: File selection → Upload completion
- **Payment Success Rate**: Checkout → Payment confirmation
- **User Retention**: Signup → Repeat usage
- **Processing Time**: Upload → Results ready

This implementation map provides a comprehensive guide for integrating PostHog across all pages and components of the DeepTrack Gotham application.
