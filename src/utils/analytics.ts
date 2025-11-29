import ReactGA from 'react-ga4';

// Initialize Google Analytics
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  
  if (measurementId) {
    ReactGA.initialize(measurementId, {
      gaOptions: {
        anonymizeIp: true, // Privacy-friendly
      },
      gtagOptions: {
        send_page_view: false, // We'll send manually for better control
      },
    });
    console.log('✅ Google Analytics initialized');
  } else {
    console.warn('⚠️ Google Analytics Measurement ID not found');
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  ReactGA.send({ 
    hitType: 'pageview', 
    page: path,
    title: title || document.title,
  });
};

// Track custom events
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

// Track button clicks
export const trackButtonClick = (buttonName: string, location?: string) => {
  trackEvent('Button', 'click', `${buttonName}${location ? ` - ${location}` : ''}`);
};

// Track form submissions
export const trackFormSubmit = (formName: string, success: boolean) => {
  trackEvent('Form', success ? 'submit_success' : 'submit_fail', formName);
};

// Track sign ups
export const trackSignUp = (method: string) => {
  ReactGA.event({
    category: 'User',
    action: 'sign_up',
    label: method,
  });
};

// Track sign ins
export const trackSignIn = (method: string) => {
  ReactGA.event({
    category: 'User',
    action: 'sign_in',
    label: method,
  });
};

// Track purchases/subscriptions
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string,
  items: string
) => {
  ReactGA.event({
    category: 'Ecommerce',
    action: 'purchase',
    label: items,
    value,
  });
  
  // Send enhanced ecommerce event
  ReactGA.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items: [
      {
        item_name: items,
      },
    ],
  });
};

// Track search queries
export const trackSearch = (searchTerm: string) => {
  ReactGA.event({
    category: 'Search',
    action: 'search',
    label: searchTerm,
  });
};

// Track file downloads
export const trackDownload = (fileName: string, fileType: string) => {
  ReactGA.event({
    category: 'Download',
    action: 'download',
    label: `${fileName} (${fileType})`,
  });
};

// Track external link clicks
export const trackExternalLink = (url: string) => {
  ReactGA.event({
    category: 'External Link',
    action: 'click',
    label: url,
  });
};

// Track errors
export const trackError = (errorMessage: string, errorLocation?: string) => {
  ReactGA.event({
    category: 'Error',
    action: 'error_occurred',
    label: `${errorLocation ? `${errorLocation}: ` : ''}${errorMessage}`,
  });
};

// Track timing (e.g., page load time)
export const trackTiming = (
  category: string,
  variable: string,
  value: number,
  label?: string
) => {
  ReactGA.gtag('event', 'timing_complete', {
    name: variable,
    value,
    event_category: category,
    event_label: label,
  });
};

// Track social shares
export const trackSocialShare = (network: string, contentType: string) => {
  ReactGA.event({
    category: 'Social',
    action: 'share',
    label: `${network} - ${contentType}`,
  });
};

