/**
 * Rate Limiting Service
 * Prevents abuse by limiting sign-up attempts
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

// Store rate limit data in memory (will be reset on page refresh)
// For production, consider using backend storage
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const MAX_SIGNUP_ATTEMPTS = 3; // Max attempts per time window
const TIME_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const COOLDOWN_AFTER_LIMIT_MS = 60 * 60 * 1000; // 1 hour cooldown after limit reached

/**
 * Get client identifier (IP would be better, but we use a combination of factors)
 */
function getClientIdentifier(): string {
  // In a real app, you'd want to get the IP from the backend
  // For now, we use browser fingerprinting
  const navigatorInfo = `${navigator.userAgent}_${navigator.language}_${screen.width}x${screen.height}`;
  return btoa(navigatorInfo).substring(0, 32);
}

/**
 * Clean up old entries
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitStore.forEach((entry, key) => {
    // Remove entries older than time window + cooldown
    if (now - entry.lastAttempt > TIME_WINDOW_MS + COOLDOWN_AFTER_LIMIT_MS) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

/**
 * Check if client is rate limited
 */
export function isRateLimited(): {
  limited: boolean;
  remainingAttempts: number;
  resetTime?: Date;
  message?: string;
} {
  cleanupOldEntries();

  const clientId = getClientIdentifier();
  const entry = rateLimitStore.get(clientId);
  const now = Date.now();

  if (!entry) {
    return {
      limited: false,
      remainingAttempts: MAX_SIGNUP_ATTEMPTS
    };
  }

  // Check if in cooldown period
  if (entry.count >= MAX_SIGNUP_ATTEMPTS) {
    const timeSinceLimit = now - entry.lastAttempt;
    if (timeSinceLimit < COOLDOWN_AFTER_LIMIT_MS) {
      const resetTime = new Date(entry.lastAttempt + COOLDOWN_AFTER_LIMIT_MS);
      return {
        limited: true,
        remainingAttempts: 0,
        resetTime,
        message: `Too many sign-up attempts. Please try again after ${resetTime.toLocaleTimeString()}`
      };
    } else {
      // Cooldown expired, reset
      rateLimitStore.delete(clientId);
      return {
        limited: false,
        remainingAttempts: MAX_SIGNUP_ATTEMPTS
      };
    }
  }

  // Check if within time window
  const timeSinceFirst = now - entry.firstAttempt;
  if (timeSinceFirst > TIME_WINDOW_MS) {
    // Time window expired, reset
    rateLimitStore.delete(clientId);
    return {
      limited: false,
      remainingAttempts: MAX_SIGNUP_ATTEMPTS
    };
  }

  // Still within limits
  const remainingAttempts = MAX_SIGNUP_ATTEMPTS - entry.count;
  return {
    limited: false,
    remainingAttempts
  };
}

/**
 * Record a sign-up attempt
 */
export function recordSignupAttempt(): void {
  cleanupOldEntries();

  const clientId = getClientIdentifier();
  const entry = rateLimitStore.get(clientId);
  const now = Date.now();

  if (!entry) {
    rateLimitStore.set(clientId, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now
    });
  } else {
    // Check if we should reset (time window expired)
    if (now - entry.firstAttempt > TIME_WINDOW_MS) {
      rateLimitStore.set(clientId, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
    } else {
      entry.count++;
      entry.lastAttempt = now;
      rateLimitStore.set(clientId, entry);
    }
  }
}

/**
 * Reset rate limit for testing purposes
 */
export function resetRateLimit(): void {
  const clientId = getClientIdentifier();
  rateLimitStore.delete(clientId);
}

/**
 * Get rate limit statistics (for debugging)
 */
export function getRateLimitStats(): {
  totalEntries: number;
  currentClient: RateLimitEntry | undefined;
} {
  cleanupOldEntries();
  const clientId = getClientIdentifier();
  return {
    totalEntries: rateLimitStore.size,
    currentClient: rateLimitStore.get(clientId)
  };
}

/**
 * Email-specific rate limiting
 * Prevents same email from being used multiple times quickly
 */
const emailRateLimitStore = new Map<string, number>();
const EMAIL_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour between attempts with same email

export function isEmailRateLimited(email: string): {
  limited: boolean;
  resetTime?: Date;
  message?: string;
} {
  const emailLower = email.toLowerCase();
  const lastAttempt = emailRateLimitStore.get(emailLower);
  const now = Date.now();

  if (!lastAttempt) {
    return { limited: false };
  }

  const timeSince = now - lastAttempt;
  if (timeSince < EMAIL_COOLDOWN_MS) {
    const resetTime = new Date(lastAttempt + EMAIL_COOLDOWN_MS);
    return {
      limited: true,
      resetTime,
      message: `This email was recently used for sign-up. Please try again after ${resetTime.toLocaleTimeString()}`
    };
  }

  // Cooldown expired
  emailRateLimitStore.delete(emailLower);
  return { limited: false };
}

export function recordEmailAttempt(email: string): void {
  const emailLower = email.toLowerCase();
  emailRateLimitStore.set(emailLower, Date.now());
}

export function cleanupEmailRateLimit(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  emailRateLimitStore.forEach((timestamp, email) => {
    if (now - timestamp > EMAIL_COOLDOWN_MS) {
      keysToDelete.push(email);
    }
  });

  keysToDelete.forEach(key => emailRateLimitStore.delete(key));
}

