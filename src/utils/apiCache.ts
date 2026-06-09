/**
 * API Response Caching Module
 * Reduces API calls and improves performance
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number  // Time to live in ms
}

export class APICache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly defaultTTL = 3600000  // 1 hour

  /**
   * Get cached data if valid
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set cache entry
   */
  set(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Clear specific key
   */
  clear(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instances for different services
export const aiServiceCache = new APICache<{ content?: string; error?: string }>()
export const codeAnalysisCache = new APICache<string>()

/**
 * Create cache key from inputs
 */
export function createCacheKey(...parts: (string | number)[]): string {
  return parts.map(p => String(p)).join(':')
}
