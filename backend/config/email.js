import env from "./env.js";

/** SMTP / email settings from environment variables. */
export const emailConfig = env.email;

/** True when both EMAIL_USER and EMAIL_PASS are set. */
export function isEmailConfigured() {
  return Boolean(emailConfig.user && emailConfig.pass);
}
