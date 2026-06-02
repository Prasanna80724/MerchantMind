const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error(
    "Missing required environment variable: VITE_API_URL\n" +
      "Copy .env.example to .env in the project root and set VITE_API_URL."
  );
}

/** Base URL for API requests (no trailing slash). */
export const API_BASE_URL = apiUrl.replace(/\/$/, "");

/** Host portion used for auth redirect checks. */
export const API_HOST = new URL(API_BASE_URL).host;
