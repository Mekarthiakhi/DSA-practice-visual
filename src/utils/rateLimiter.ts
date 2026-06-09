/**
 * Rate Limiter Module
 * Prevents API abuse and controls request frequency
 */

export class RateLimiter {
  private lastCallTime = 0
  private minInterval: number
  private requestCount = 0
  private windowStart = Date.now()
  private windowSize = 60000  // 1 minute window

  constructor(minInterval: number = 1000) {
    this.minInterval = minInterval
  }

  /**
   * Wait until rate limit allows next request
   * Returns: true if allowed, false if rate limited
   */
  async wait(): Promise<boolean> {
    const now = Date.now()
    const elapsed = now - this.lastCallTime

    if (elapsed < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - elapsed)
      )
    }

    this.lastCallTime = Date.now()
    return true
  }

  /**
   * Check if request is allowed within window
   * maxRequests: max requests per window
   */
  isAllowed(maxRequests: number = 100): boolean {
    const now = Date.now()
    const windowElapsed = now - this.windowStart

    // Reset window if expired
    if (windowElapsed > this.windowSize) {
      this.windowStart = now
      this.requestCount = 0
    }

    if (this.requestCount >= maxRequests) {
      return false
    }

    this.requestCount++
    return true
  }

  /**
   * Get current request count in window
   */
  getRequestCount(): number {
    return this.requestCount
  }

  /**
   * Get time until next request allowed (in ms)
   */
  getWaitTime(): number {
    const now = Date.now()
    const elapsed = now - this.lastCallTime
    return Math.max(0, this.minInterval - elapsed)
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.lastCallTime = 0
    this.requestCount = 0
    this.windowStart = Date.now()
  }
}

// Global rate limiter instances for different services
export const aiServiceLimiter = new RateLimiter(1000)  // 1 request per second
export const apiLimiter = new RateLimiter(100)  // 100ms between requests
