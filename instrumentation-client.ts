import posthog from 'posthog-js'

// Debug logging
console.log('🔧 PostHog Instrumentation Client Loading...');
console.log('Environment:', process.env.NODE_ENV);
console.log('PostHog Key:', process.env.NEXT_PUBLIC_POSTHOG_KEY ? '✅ Set' : '❌ Missing');
console.log('PostHog Host:', process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com');

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    debug: process.env.NODE_ENV === 'development'
  });
  
  console.log('✅ PostHog initialized successfully via instrumentation-client');
  
  // Send a test event immediately
  posthog.capture('instrumentation_client_loaded', {
    method: 'instrumentation-client',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
  
  console.log('📊 Test event sent: instrumentation_client_loaded');
} else {
  console.error('❌ PostHog key not found in environment variables');
}
