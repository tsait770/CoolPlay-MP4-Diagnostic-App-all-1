import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL;
  
  if (baseUrl) {
    console.log('[tRPC] Using base URL:', baseUrl);
    return baseUrl;
  }

  console.error('[tRPC] No base URL found in environment variables');
  console.error('[tRPC] Available env vars:', Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC')));
  
  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL or EXPO_PUBLIC_API_URL"
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          // Attach Supabase access token for protected tRPC procedures
          const { data: { session } } = await supabase.auth.getSession();
          const headers = new Headers(options?.headers || {});
          if (session?.access_token) {
            headers.set('Authorization', `Bearer ${session.access_token}`);
          }

          const response = await fetch(url, { ...options, headers });
          return response;
        } catch (error) {
          console.warn('[tRPC] Network error, API unavailable:', error);
          // Return a mock response for development
          return new Response(
            JSON.stringify({ 
              error: { 
                message: 'API temporarily unavailable', 
                code: 'NETWORK_ERROR' 
              } 
            }),
            { 
              status: 503, 
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      },
    }),
  ],
});