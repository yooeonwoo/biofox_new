import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { NextRequest, NextResponse } from 'next/server';

export function createSupabaseServerClient(req?: NextRequest, res?: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return getCookie(name, { req, res });
        },
        set(name: string, value: string, options: CookieOptions) {
          setCookie(name, value, { req, res, ...options });
        },
        remove(name: string, options: CookieOptions) {
          deleteCookie(name, { req, res, ...options });
        },
      },
    }
  );
}
