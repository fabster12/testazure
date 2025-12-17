/**
 * Session Cache Service
 * Provides session-based caching for AI results and other data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheService {
  private prefix = 'eu_dashboard_cache_';

  /**
   * Get cached data for a key
   */
  get<T>(key: string): T | null {
    try {
      const fullKey = this.prefix + key;
      const item = sessionStorage.getItem(fullKey);

      if (!item) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);
      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data for a key
   */
  set<T>(key: string, data: T): void {
    try {
      const fullKey = this.prefix + key;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now()
      };

      sessionStorage.setItem(fullKey, JSON.stringify(entry));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string): boolean {
    const fullKey = this.prefix + key;
    return sessionStorage.getItem(fullKey) !== null;
  }

  /**
   * Remove a specific cache entry
   */
  remove(key: string): void {
    const fullKey = this.prefix + key;
    sessionStorage.removeItem(fullKey);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): { count: number; keys: string[] } {
    const keys = Object.keys(sessionStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.replace(this.prefix, ''));

    return {
      count: keys.length,
      keys
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();
