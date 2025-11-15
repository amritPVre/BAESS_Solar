/**
 * Google reCAPTCHA v3 Service
 * Provides bot detection and spam prevention
 */

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const RECAPTCHA_SECRET_KEY = import.meta.env.VITE_RECAPTCHA_SECRET_KEY;

// Minimum score threshold (0.0 - 1.0, where 1.0 is very likely a good interaction)
const MIN_SCORE_THRESHOLD = 0.5;

export interface RecaptchaVerificationResult {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
}

/**
 * Load reCAPTCHA script
 */
export function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'));
      return;
    }

    // Check if already loaded
    if ((window as any).grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait for grecaptcha to be ready
      const checkReady = setInterval(() => {
        if ((window as any).grecaptcha && (window as any).grecaptcha.ready) {
          clearInterval(checkReady);
          (window as any).grecaptcha.ready(() => {
            resolve();
          });
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkReady);
        reject(new Error('reCAPTCHA load timeout'));
      }, 10000);
    };

    script.onerror = () => {
      reject(new Error('Failed to load reCAPTCHA script'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Execute reCAPTCHA and get token
 */
export async function executeRecaptcha(action: string = 'submit'): Promise<string> {
  if (!RECAPTCHA_SITE_KEY) {
    throw new Error('reCAPTCHA site key is not configured');
  }

  if (typeof window === 'undefined' || !(window as any).grecaptcha) {
    throw new Error('reCAPTCHA is not loaded');
  }

  try {
    const token = await (window as any).grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
    return token;
  } catch (error) {
    console.error('reCAPTCHA execution error:', error);
    throw new Error('Failed to execute reCAPTCHA');
  }
}

/**
 * Verify reCAPTCHA token on backend
 * This should be called from your backend API
 */
export async function verifyRecaptchaToken(
  token: string,
  remoteIp?: string
): Promise<RecaptchaVerificationResult> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.error('reCAPTCHA secret key is not configured');
    return {
      success: false,
      error_codes: ['missing-secret-key']
    };
  }

  try {
    const params = new URLSearchParams({
      secret: RECAPTCHA_SECRET_KEY,
      response: token,
    });

    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result: RecaptchaVerificationResult = await response.json();
    return result;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return {
      success: false,
      error_codes: ['verification-failed']
    };
  }
}

/**
 * Check if reCAPTCHA score meets threshold
 */
export function isScoreAcceptable(score: number | undefined): boolean {
  if (score === undefined) return false;
  return score >= MIN_SCORE_THRESHOLD;
}

/**
 * Get human-readable error message
 */
export function getRecaptchaErrorMessage(errorCodes?: string[]): string {
  if (!errorCodes || errorCodes.length === 0) {
    return 'reCAPTCHA verification failed';
  }

  const errorMessages: { [key: string]: string } = {
    'missing-input-secret': 'The secret parameter is missing',
    'invalid-input-secret': 'The secret parameter is invalid or malformed',
    'missing-input-response': 'The response parameter is missing',
    'invalid-input-response': 'The response parameter is invalid or malformed',
    'bad-request': 'The request is invalid or malformed',
    'timeout-or-duplicate': 'The response is no longer valid: either is too old or has been used previously',
    'low-score': 'The interaction score is too low (possible bot)',
  };

  return errorMessages[errorCodes[0]] || 'reCAPTCHA verification failed';
}

/**
 * Initialize reCAPTCHA for the app
 */
export async function initializeRecaptcha(): Promise<boolean> {
  if (!RECAPTCHA_SITE_KEY) {
    console.warn('reCAPTCHA site key is not configured. Skipping initialization.');
    return false;
  }

  try {
    await loadRecaptchaScript();
    console.log('reCAPTCHA initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize reCAPTCHA:', error);
    return false;
  }
}

