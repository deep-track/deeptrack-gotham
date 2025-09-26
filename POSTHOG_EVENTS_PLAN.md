# PostHog Events Tracking Plan - DeepTrack Gotham

## Overview
This document outlines the standard ecommerce events to track with PostHog for the DeepTrack Gotham AI media verification platform. These events will provide insights into user behavior, conversion rates, and business performance.

## 🚀 Next.js Integration Best Practices

### Event Naming Conventions
Following PostHog best practices:
- ✅ **snake_case**: Use lowercase with underscores (`product_viewed`)
- ✅ **Present tense**: Use present tense verbs (`view`, `click`, `submit`)
- ✅ **Consistent verbs**: Use standardized action words
- ✅ **Clear structure**: `category:object_action` when applicable
- ❌ **Avoid**: Title Case, spaces, inconsistent naming

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_POSTHOG_KEY=phc_XnKJCWeNQ2Ex9KZok5g8DXUD322TDWveKWxDZb3Mjst
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Client-Side Setup (Recommended: instrumentation-client.ts)
```typescript
// instrumentation-client.ts (Next.js 15.3+)
import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: {
    // Disable automatic pageview capture for manual control
    capture_pageview: false,
    // Enable session recordings
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: {
        password: true,
        email: true
      }
    },
    // Enable feature flags
    bootstrap: {
      featureFlags: {}
    }
  }
});
```

### Server-Side Setup
```typescript
// app/posthog-server.ts
import { PostHog } from 'posthog-node'

export default function PostHogClient() {
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0
  })
  return posthogClient
}
```

## 🛒 Standard Ecommerce Events

### Event Tracking Strategy
- **Client-side events**: User interactions, UI events, navigation
- **Server-side events**: Payment confirmations, webhook events, API calls
- **Hybrid events**: Some events tracked on both sides for redundancy

### 1. Product/Service Events (Client-side)

#### product_viewed
**Trigger**: When user views the main dashboard/service page
```javascript
{
  event: 'product_viewed',
  properties: {
    product_id: 'media_verification_service',
    product_name: 'AI Media Verification',
    category: 'AI Services',
    price: 100, // in cents (100 bob)
    currency: 'KES',
    value: 100
  }
}
```

#### product_list_viewed
**Trigger**: When user sees available services/features
```javascript
{
  event: 'product_list_viewed',
  properties: {
    list_id: 'verification_services',
    category: 'AI Services',
    products: [
      {
        product_id: 'image_verification',
        product_name: 'Image Verification',
        price: 100
      },
      {
        product_id: 'video_verification', 
        product_name: 'Video Verification',
        price: 100
      }
    ]
  }
}
```

### 2. Cart/Order Events (Client-side)

#### add_to_cart
**Trigger**: When user selects files for verification
```javascript
{
  event: 'add_to_cart',
  properties: {
    product_id: 'media_verification',
    product_name: 'Media Verification',
    price: 100,
    quantity: selectedFiles.length,
    currency: 'KES',
    value: selectedFiles.length * 100,
    file_count: selectedFiles.length,
    file_types: ['image', 'video'], // derived from selected files
    total_file_size: totalSizeInMB
  }
}
```

#### remove_from_cart
**Trigger**: When user removes files from selection
```javascript
{
  event: 'remove_from_cart',
  properties: {
    product_id: 'media_verification',
    product_name: 'Media Verification',
    price: 100,
    quantity: removedCount,
    currency: 'KES',
    value: removedCount * 100
  }
}
```

#### cart_viewed
**Trigger**: When user sees their selected files before checkout
```javascript
{
  event: 'cart_viewed',
  properties: {
    cart_id: orderId, // if order is created
    products: [
      {
        product_id: 'media_verification',
        product_name: 'Media Verification',
        price: 100,
        quantity: selectedFiles.length
      }
    ],
    value: selectedFiles.length * 100,
    currency: 'KES'
  }
}
```

### 3. Checkout Events (Client-side)

#### checkout_started
**Trigger**: When user clicks "Proceed to Checkout"
```javascript
{
  event: 'checkout_started',
  properties: {
    cart_id: orderId,
    products: [
      {
        product_id: 'media_verification',
        product_name: 'Media Verification',
        price: 100,
        quantity: selectedFiles.length
      }
    ],
    value: selectedFiles.length * 100,
    currency: 'KES',
    payment_method: 'paystack', // or 'tokens'
    file_count: selectedFiles.length
  }
}
```

#### payment_info_entered
**Trigger**: When user completes authentication/signup
```javascript
{
  event: 'payment_info_entered',
  properties: {
    cart_id: orderId,
    value: selectedFiles.length * 100,
    currency: 'KES',
    payment_method: 'paystack',
    user_type: 'new_user' // or 'returning_user'
  }
}
```

### 4. Purchase Events (Server-side - Webhook)

#### purchase (Server-side)
**Trigger**: When Paystack webhook confirms payment success
```javascript
// In /api/webhook/paystack/route.ts
{
  event: 'purchase',
  properties: {
    order_id: orderId,
    transaction_id: paymentReference,
    products: [
      {
        product_id: 'media_verification',
        product_name: 'Media Verification',
        price: 100,
        quantity: fileCount
      }
    ],
    value: fileCount * 100,
    currency: 'KES',
    payment_method: 'paystack',
    file_count: fileCount,
    user_type: 'demo_user', // or 'regular_user'
    payment_provider: 'paystack',
    webhook_event: 'charge.success',
    payment_status: 'success'
  }
}
```

#### purchase (Client-side - Fallback)
**Trigger**: When client detects payment success via polling
```javascript
{
  event: 'purchase_confirmed',
  properties: {
    order_id: orderId,
    transaction_id: paymentReference,
    value: selectedFiles.length * 100,
    currency: 'KES',
    confirmation_method: 'client_polling',
    polling_attempts: attempts
  }
}
```

#### order_completed
**Trigger**: When verification results are ready
```javascript
{
  event: 'order_completed',
  properties: {
    order_id: orderId,
    transaction_id: paymentReference,
    products: [
      {
        product_id: 'media_verification',
        product_name: 'Media Verification',
        price: 100,
        quantity: selectedFiles.length
      }
    ],
    value: selectedFiles.length * 100,
    currency: 'KES',
    processing_time: processingTimeInSeconds,
    verification_results: {
      authentic_count: authenticFiles,
      manipulated_count: manipulatedFiles,
      unknown_count: unknownFiles
    }
  }
}
```

### 5. Server-Side API Events

#### payment_webhook_received
**Trigger**: When Paystack webhook is received
```javascript
// In /api/webhook/paystack/route.ts
{
  event: 'payment_webhook_received',
  properties: {
    webhook_event: 'charge.success', // or other Paystack events
    transaction_reference: reference,
    payment_amount: data.amount,
    payment_currency: data.currency,
    webhook_signature_valid: signatureValid,
    processing_time_ms: processingTime
  }
}
```

#### order_processing_started
**Trigger**: When order processing begins after payment
```javascript
// In /api/process-order/route.ts
{
  event: 'order_processing_started',
  properties: {
    order_id: orderId,
    file_count: fileCount,
    processing_method: 'reality_defender_api',
    estimated_processing_time: estimatedTime
  }
}
```

#### api_request_completed
**Trigger**: When API requests complete
```javascript
// In various API routes
{
  event: 'api_request_completed',
  properties: {
    endpoint: '/api/upload',
    method: 'POST',
    status_code: 200,
    response_time_ms: responseTime,
    success: true,
    user_authenticated: isAuthenticated
  }
}
```

### 6. User Lifecycle Events (Client-side)

#### user_signed_up
**Trigger**: When user creates account
```javascript
{
  event: 'user_signed_up',
  properties: {
    signup_method: 'email', // or 'google_oauth',
    user_type: 'business_user', // based on email validation
    referral_source: 'direct', // or other sources
    email_domain: 'company.com'
  }
}
```

#### user_signed_in
**Trigger**: When user logs in
```javascript
{
  event: 'user_signed_in',
  properties: {
    signin_method: 'email', // or 'google_oauth',
    user_type: 'returning_user',
    days_since_last_signin: daysSinceLastSignin
  }
}
```

### 7. Custom Business Events (Client-side)

#### file_upload_started
**Trigger**: When user begins uploading files
```javascript
{
  event: 'file_upload_started',
  properties: {
    file_count: selectedFiles.length,
    total_size_mb: totalSizeInMB,
    file_types: ['image', 'video'],
    upload_method: 'drag_drop' // or 'file_picker'
  }
}
```

#### file_upload_completed
**Trigger**: When all files are successfully uploaded
```javascript
{
  event: 'file_upload_completed',
  properties: {
    file_count: uploadedFiles.length,
    total_size_mb: totalSizeInMB,
    upload_duration: uploadTimeInSeconds,
    success_rate: successRate
  }
}
```

#### verification_started
**Trigger**: When AI verification process begins
```javascript
{
  event: 'verification_started',
  properties: {
    order_id: orderId,
    file_count: selectedFiles.length,
    ai_models_used: ['rd-context-img', 'rd-pine-img', 'rd-oak-img'],
    verification_type: 'image' // or 'video'
  }
}
```

#### verification_completed
**Trigger**: When AI verification process completes
```javascript
{
  event: 'verification_completed',
  properties: {
    order_id: orderId,
    file_count: selectedFiles.length,
    processing_time: processingTimeInSeconds,
    results: {
      authentic: authenticCount,
      manipulated: manipulatedCount,
      unknown: unknownCount
    },
    average_confidence: averageConfidence
  }
}
```

#### token_purchase
**Trigger**: When user buys tokens
```javascript
{
  event: 'token_purchase',
  properties: {
    token_amount: tokenAmount,
    price_per_token: 100,
    total_value: tokenAmount * 100,
    currency: 'KES',
    payment_method: 'paystack'
  }
}
```

#### token_used
**Trigger**: When user spends tokens for verification
```javascript
{
  event: 'token_used',
  properties: {
    tokens_used: tokensUsed,
    tokens_remaining: tokensRemaining,
    order_id: orderId,
    file_count: selectedFiles.length
  }
}
```

### 8. Engagement Events (Client-side)

#### results_viewed
**Trigger**: When user views verification results
```javascript
{
  event: 'results_viewed',
  properties: {
    order_id: orderId,
    file_count: selectedFiles.length,
    time_to_view: timeFromPurchaseToView,
    results_shared: false, // if sharing feature exists
    page_url: window.location.href,
    referrer: document.referrer
  }
}
```

#### history_viewed
**Trigger**: When user views their verification history
```javascript
{
  event: 'history_viewed',
  properties: {
    total_verifications: totalVerifications,
    filter_applied: 'all', // or 'authentic', 'synthetic'
    search_term: searchTerm,
    page_url: window.location.href
  }
}
```

#### payment_method_selected
**Trigger**: When user chooses payment method (tokens vs card)
```javascript
{
  event: 'payment_method_selected',
  properties: {
    payment_method: 'tokens', // or 'card',
    order_id: orderId,
    value: selectedFiles.length * 100,
    user_tokens: userTokenBalance,
    page_url: window.location.href
  }
}
```

### 9. Next.js Specific Events (Client-side)

#### Page View (Automatic)
**Trigger**: Automatically tracked by PostHog on route changes
```javascript
// PostHog automatically captures:
{
  event: '$pageview',
  properties: {
    $current_url: window.location.href,
    $pathname: window.location.pathname,
    $search: window.location.search,
    $title: document.title,
    $referrer: document.referrer
  }
}

// Optional: Add custom properties
posthog.capture('$pageview', {
  page_type: 'dashboard', // or 'checkout', 'results', 'history'
  user_authenticated: isSignedIn
})
```

#### route_change
**Trigger**: When user navigates between pages
```javascript
{
  event: 'route_change',
  properties: {
    from_route: previousRoute,
    to_route: currentRoute,
    navigation_method: 'link_click', // or 'back_button', 'forward_button'
    time_on_previous_page: timeSpentOnPreviousPage
  }
}
```

#### component_mount
**Trigger**: When key components load
```javascript
{
  event: 'component_mount',
  properties: {
    component_name: 'UploadArea', // or 'PaymentChoiceDialog', 'ResultsDisplay'
    mount_time: componentMountTime,
    page_url: window.location.href,
    user_authenticated: isSignedIn
  }
}
```

#### error_boundary_triggered
**Trigger**: When React error boundary catches an error
```javascript
{
  event: 'error_boundary_triggered',
  properties: {
    error_message: error.message,
    error_stack: error.stack,
    component_stack: componentStack,
    page_url: window.location.href,
    user_authenticated: isSignedIn,
    user_agent: navigator.userAgent
  }
}
```

## 🎯 Key Metrics to Track

### Conversion Funnel
1. **product_viewed** → **add_to_cart** → **checkout_started** → **purchase**
2. **file_upload_started** → **file_upload_completed** → **verification_started** → **verification_completed**

### Revenue Metrics
- Total revenue (sum of all purchases)
- Average order value
- Revenue per user
- Token purchase frequency
- Payment method preference (tokens vs card)

### User Behavior Metrics
- File upload success rate
- Payment completion rate
- Time from upload to results
- User retention and repeat purchases
- Session duration and page views

### Product Performance Metrics
- Most common file types
- Average file size
- Verification accuracy rates
- Processing time trends
- Error rates and failure points

### User Segmentation
- New vs returning users
- Demo vs regular users
- Business vs personal email domains
- Payment method preferences
- File type preferences

## 📊 Dashboard Recommendations

### Revenue Dashboard
- Daily/Monthly revenue trends
- Average order value over time
- Revenue by payment method
- Token sales vs direct payments

### Conversion Dashboard
- Funnel conversion rates
- Drop-off points in the user journey
- Payment completion rates
- File upload success rates

### User Engagement Dashboard
- User retention cohorts
- Session duration trends
- Feature usage (history, results viewing)
- User lifecycle analysis

### Product Performance Dashboard
- File type distribution
- Processing time trends
- Verification accuracy rates
- Error and failure analysis

## 🔧 Implementation Notes

### Next.js Specific Implementation

#### Client-Side Event Tracking
```typescript
// Use instrumentation-client.ts for global PostHog access
import posthog from 'posthog-js'

// In components, use the hook for React context
import { usePostHog } from 'posthog-js/react'

export default function UploadComponent() {
  const posthog = usePostHog()
  
  const handleFileUpload = (files: File[]) => {
    posthog.capture('File Upload Started', {
      file_count: files.length,
      total_size_mb: files.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024,
      file_types: [...new Set(files.map(f => f.type.split('/')[0]))],
      upload_method: 'drag_drop'
    })
  }
}
```

#### Server-Side Event Tracking
```typescript
// In API routes or server components
import PostHogClient from '../posthog-server'

export async function POST(req: Request) {
  const posthog = PostHogClient()
  
  try {
    // Your API logic here
    
    // Track server-side events
    posthog.capture({
      distinctId: userId,
      event: 'api_request_completed',
      properties: {
        endpoint: '/api/upload',
        method: 'POST',
        success: true,
        processing_time: processingTime
      }
    })
  } finally {
    await posthog.shutdown() // Always shutdown server-side client
  }
}
```

#### Payment Webhook Event Tracking
```typescript
// In /api/webhook/paystack/route.ts
import PostHogClient from '../posthog-server'

export async function POST(req: Request) {
  const posthog = PostHogClient()
  
  try {
    const payload = JSON.parse(rawBody)
    const event = payload.event
    const data = payload.data
    
    // Track webhook received
    posthog.capture({
      distinctId: userId, // Get from metadata or order
      event: 'payment_webhook_received',
      properties: {
        webhook_event: event,
        transaction_reference: data.reference,
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
          transaction_id: data.reference,
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

#### Optional: Custom Pageview Properties
```typescript
// Add custom properties to automatic pageviews
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'

export function PostHogPageView() {
  const pathname = usePathname()
  const posthog = usePostHog()

  useEffect(() => {
    if (pathname) {
      // PostHog automatically tracks pageviews
      // Add custom properties for better segmentation
      posthog.capture('$pageview', {
        page_type: getPageType(pathname),
        user_authenticated: isSignedIn
      })
    }
  }, [pathname])

  function getPageType(pathname: string): string {
    if (pathname === '/') return 'dashboard'
    if (pathname === '/checkout') return 'checkout'
    if (pathname === '/results') return 'results'
    if (pathname === '/history') return 'history'
    if (pathname === '/login') return 'login'
    if (pathname === '/signup') return 'signup'
    return 'other'
  }
}
```

### Event Timing
- Track events at the exact moment they occur
- Include timestamps for all events
- Measure time between key events (upload to results)
- Use `performance.now()` for precise timing measurements

### User Identification
- Use consistent user IDs across all events
- Include session information
- Track anonymous users before signup
- Use Clerk user ID as distinct_id when available

### Data Quality
- Validate event properties before sending
- Include error handling for failed events
- Monitor event volume and consistency
- Use TypeScript interfaces for event properties

### Privacy Considerations
- Ensure compliance with data protection regulations
- Consider data retention policies
- Implement user consent mechanisms
- Mask sensitive data in session recordings

## 🚀 Future Enhancements

### Advanced Analytics
- Cohort analysis for user retention
- A/B testing for conversion optimization using PostHog feature flags
- Predictive analytics for user behavior
- Real-time alerting for anomalies
- Funnel analysis with Next.js route tracking

### Integration Opportunities
- Facebook Conversion API for ad optimization
- Google Analytics 4 for broader insights
- Customer support system integration
- Email marketing platform integration
- Clerk user events integration

### Next.js Specific Enhancements
- Server-side feature flag evaluation for SSR
- Edge runtime optimization for PostHog events
- Middleware-based event tracking
- Static generation with PostHog data
- ISR (Incremental Static Regeneration) with analytics

### Performance Monitoring
- Core Web Vitals tracking
- Next.js performance metrics
- Bundle size impact monitoring
- API response time tracking
- Error rate monitoring with PostHog

## 📋 Implementation Checklist

### Phase 1: Basic Setup
- [ ] Install `posthog-js` and `posthog-node`
- [ ] Set up environment variables
- [ ] Create `instrumentation-client.ts`
- [ ] Create `posthog-server.ts`
- [ ] Set up manual pageview tracking

### Phase 2: Core Events
- [ ] Implement product/service events
- [ ] Add cart/order events
- [ ] Set up checkout events
- [ ] Track purchase events
- [ ] Add user lifecycle events

### Phase 3: Custom Events
- [ ] File upload tracking
- [ ] Verification process events
- [ ] Token system events
- [ ] Error boundary events
- [ ] Component mount tracking

### Phase 4: Advanced Features
- [ ] Session recordings configuration
- [ ] Feature flags setup
- [ ] A/B testing implementation
- [ ] Cohort analysis setup
- [ ] Real-time dashboards

### Phase 5: Optimization
- [ ] Event deduplication
- [ ] Performance monitoring
- [ ] Error handling improvements
- [ ] Data validation
- [ ] Privacy compliance review
