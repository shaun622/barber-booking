/// <reference types="@sveltejs/kit" />

import type { D1DatabaseLike } from '$lib/db';

interface MinimalKVForPlatform {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

declare global {
  namespace App {
    interface Platform {
      env: {
        DB: D1DatabaseLike;
        RATE_LIMIT: MinimalKVForPlatform;
        SLOT_LOCKS: MinimalKVForPlatform;
        TURNSTILE_SECRET?: string;
        TURNSTILE_SITE_KEY?: string;
        ADMIN_PASSWORD_HASH?: string;
        SESSION_SECRET?: string;
        RESEND_API_KEY?: string;
        EMAIL_FROM?: string;
        EMAIL_TO_OWNER?: string;
        WHATSAPP_TOKEN?: string;
        WHATSAPP_PHONE_ID?: string;
        WHATSAPP_OWNER_NUMBER?: string;
        WHATSAPP_TEMPLATE_NAME?: string;
        WHATSAPP_TEMPLATE_LANG?: string;
        SHOP_TZ?: string;
        SHOP_WHATSAPP?: string;
      };
      context: { waitUntil(promise: Promise<unknown>): void };
    }
    interface Locals {
      lang: 'en' | 'id';
      adminUser?: { authenticated: true };
    }
    interface PageData {
      lang: 'en' | 'id';
    }
  }
}

export {};
