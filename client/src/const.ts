export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Local email+password login page. Previously this built a Manus OAuth URL;
// the app is now fully self-hosted so sign-in happens at /login.
export const getLoginUrl = () => "/login";
