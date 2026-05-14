export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { config } from "@/lib/config";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${config.oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", config.appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
