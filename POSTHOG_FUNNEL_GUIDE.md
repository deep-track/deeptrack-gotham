# PostHog Funnel Setup Guide - DeepTrack Gotham

## 🎯 Overview
This guide shows you how to create and analyze funnels in PostHog based on the events we've implemented in your DeepTrack Gotham application.

## 📊 Key Funnels to Create

### 1. **Main Conversion Funnel** (Most Important)
**Purpose**: Track users from file upload to successful payment

**Steps**:
1. `file_upload_started` - User begins uploading files
2. `file_upload_completed` - Files successfully uploaded
3. `checkout_started` - User initiates payment process
4. `payment_method_selected` - User chooses payment method
5. `purchase` - Payment completed (server-side webhook)
6. `results_viewed` - User views verification results

**PostHog Setup**:
- Go to **Insights** → **Funnels**
- Add each event as a step
- Set conversion window: 1 hour
- Group by: `user_type` (authenticated vs anonymous)

### 2. **Authentication Funnel**
**Purpose**: Track user sign-up and sign-in success rates

**Steps**:
1. `user_signed_up` - User creates account
2. `user_signed_in` - User logs in successfully
3. `file_upload_started` - User starts using the service

**PostHog Setup**:
- Conversion window: 24 hours
- Group by: `signup_method` (email vs google)
- Filter by: `page_type: 'signup'` or `page_type: 'login'`

### 3. **Payment Method Funnel**
**Purpose**: Compare token vs card payment conversion

**Steps**:
1. `payment_method_selected` - User chooses payment method
2. `checkout_started` - Payment process begins
3. `purchase` - Payment successful

**PostHog Setup**:
- Group by: `payment_method` (tokens vs paystack)
- Conversion window: 30 minutes
- Add breakdown: `user_type`

### 4. **File Upload Success Funnel**
**Purpose**: Track file upload completion rates

**Steps**:
1. `file_upload_started` - Upload begins
2. `file_upload_completed` - Upload succeeds
3. `checkout_started` - User proceeds to payment

**PostHog Setup**:
- Conversion window: 10 minutes
- Group by: `file_count` (single vs multiple files)
- Filter by: `user_type`

## 🔧 How to Create Funnels in PostHog

### Step 1: Access Funnels
1. Log into your PostHog dashboard
2. Navigate to **Insights** → **Funnels**
3. Click **New Funnel**

### Step 2: Configure Funnel Steps
1. **Add Events**: Click "Add step" for each event
2. **Set Order**: Ensure events are in chronological order
3. **Add Filters**: Use event properties to filter data
4. **Set Timeframe**: Choose date range for analysis

### Step 3: Advanced Configuration
1. **Conversion Window**: How long users have to complete the funnel
2. **Group By**: Break down by user properties
3. **Breakdown**: Additional segmentation
4. **Filters**: Exclude/include specific conditions

## 📈 Key Metrics to Track

### Conversion Rates
- **Overall Conversion**: `file_upload_started` → `purchase`
- **Upload Success**: `file_upload_started` → `file_upload_completed`
- **Payment Success**: `checkout_started` → `purchase`
- **Auth Success**: `user_signed_up` → `user_signed_in`

### Drop-off Analysis
- **Upload Drop-off**: Users who start but don't complete uploads
- **Payment Drop-off**: Users who reach checkout but don't pay
- **Auth Drop-off**: Users who sign up but don't sign in

### User Segmentation
- **Authenticated vs Anonymous**: Compare conversion rates
- **Payment Methods**: Token vs card payment success
- **File Types**: Different file types conversion rates
- **User Types**: Business vs individual users

## 🎯 Recommended Funnel Configurations

### 1. Revenue Funnel (Critical)
```
Step 1: file_upload_started
Step 2: checkout_started  
Step 3: purchase
Conversion Window: 1 hour
Group By: user_type
Breakdown: payment_method
```

### 2. User Onboarding Funnel
```
Step 1: user_signed_up
Step 2: file_upload_started
Step 3: checkout_started
Conversion Window: 24 hours
Group By: signup_method
Breakdown: email_domain
```

### 3. Payment Method Comparison
```
Step 1: payment_method_selected
Step 2: checkout_started
Step 3: purchase
Conversion Window: 30 minutes
Group By: payment_method
Filter: payment_method = 'tokens' OR 'paystack'
```

## 📊 Dashboard Setup

### Create a Funnel Dashboard
1. Go to **Dashboards** → **New Dashboard**
2. Name it "DeepTrack Conversion Funnels"
3. Add funnel widgets for each key funnel
4. Set refresh interval to 1 hour

### Key Widgets to Add
1. **Main Conversion Funnel** (large widget)
2. **Payment Method Comparison** (medium widget)
3. **Authentication Success Rate** (small widget)
4. **File Upload Success Rate** (small widget)

## 🔍 Advanced Analysis

### Cohort Analysis
- **Retention**: Users who return after first purchase
- **Revenue**: Repeat purchase behavior
- **Engagement**: File upload frequency

### A/B Testing Setup
- **Payment Methods**: Test token vs card preference
- **Upload Flow**: Test different upload interfaces
- **Pricing**: Test different token packages

### Custom Events for Deeper Insights
Consider adding these events for better funnel analysis:

```javascript
// Add to your components
posthog.capture('funnel_step_completed', {
  funnel_name: 'main_conversion',
  step_number: 1,
  step_name: 'file_upload_started',
  user_type: 'authenticated',
  file_count: selectedFiles.length
});
```

## 📋 Funnel Monitoring Checklist

### Daily Monitoring
- [ ] Check main conversion funnel drop-off rates
- [ ] Monitor payment method performance
- [ ] Review authentication success rates
- [ ] Analyze file upload completion rates

### Weekly Analysis
- [ ] Compare week-over-week conversion rates
- [ ] Identify top drop-off points
- [ ] Analyze user segmentation performance
- [ ] Review funnel optimization opportunities

### Monthly Review
- [ ] Calculate overall conversion rate trends
- [ ] Identify seasonal patterns
- [ ] Plan funnel optimization experiments
- [ ] Review and update funnel configurations

## 🚀 Optimization Opportunities

### Based on Funnel Data
1. **High Upload Drop-off**: Improve file upload UX
2. **Low Payment Conversion**: Optimize checkout flow
3. **Auth Issues**: Simplify sign-up process
4. **Token vs Card**: Adjust pricing strategy

### Testing Ideas
1. **Upload Flow**: Test drag-and-drop vs click-to-upload
2. **Payment Flow**: Test single-step vs multi-step checkout
3. **Pricing**: Test different token packages
4. **Onboarding**: Test guided vs self-service setup

## 📞 Support Resources

### PostHog Documentation
- [Funnels Guide](https://posthog.com/docs/data/funnels)
- [Event Properties](https://posthog.com/docs/data/events)
- [Cohort Analysis](https://posthog.com/docs/data/cohorts)

### Implementation Notes
- All events are already implemented in your codebase
- Server-side events (`purchase`) are most reliable
- Client-side events provide user experience insights
- Use both for comprehensive funnel analysis

---

**Next Steps**: 
1. Set up the main conversion funnel first
2. Monitor for 1 week to establish baseline
3. Identify biggest drop-off points
4. Implement optimization experiments
5. Track improvement over time

Remember: The most important funnel is the **Main Conversion Funnel** - this directly impacts your revenue!
