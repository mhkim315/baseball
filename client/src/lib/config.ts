export const config = {
  apiBase: import.meta.env.VITE_API_BASE ?? "/api",
  baseUrl: import.meta.env.BASE_URL,
  oauthPortalUrl: import.meta.env.VITE_OAUTH_PORTAL_URL as string,
  appId: import.meta.env.VITE_APP_ID as string,
} as const;
