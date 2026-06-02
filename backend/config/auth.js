// Central auth config. Override JWT_SECRET via environment in production.
export const JWT_SECRET = process.env.JWT_SECRET || "merchantmind-dev-secret-change-me";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
