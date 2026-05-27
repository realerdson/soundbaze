import type { SupabaseClient, User } from '@supabase/supabase-js';

declare global {
  /**
   * Minimal Cloudflare Workers KV namespace interface.
   * Replace with `import type { KVNamespace } from '@cloudflare/workers-types'`
   * once you add that devDependency for full type coverage.
   */
  interface KVNamespace {
    get(key: string, options?: { type?: 'text' }): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
  }

  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user:     User | null;
    }
    interface PageData {
      user?: User | null;
    }
    interface Error {}
    /** Cloudflare Workers bindings — typed so rate-limit KV is accessible */
    interface Platform {
      env?: {
        RATE_LIMIT_KV?: KVNamespace;
      };
    }
  }
}

export {};
